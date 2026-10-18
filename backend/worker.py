"""Background worker: processes the analyses saved as 'pending' by POST /api/execute-analyse.

Runs in a thread started by create_app. The database is the queue, so analyses
interrupted by a server restart are picked up again when it starts.
"""

import threading
from pathlib import Path

from flask import current_app
from sqlalchemy import update

from backend.extensions import db
from backend.feedback import train_model
from backend.models import (
    COMPLETED,
    FAILED,
    PENDING,
    PROCESSING,
    Analysis,
    Execution,
    Onset,
)
from processamento.analise_ritmica import analyse, filter_events, load_reference, section_reference
from processamento.pre_processamento import extrair_onsets

POLL_INTERVAL = 5  # seconds, fallback in case a notification is missed

_wake = threading.Event()


def processar_execucao(audio_path, output_dir, number, reference, start_second=None, end_second=None):
    """Onset detection of one execution + rhythmic comparison with the reference"""
    clicks_audio = f"execucao{number}-clicks.wav"
    result = extrair_onsets(
        audio_path,
        start_second,
        end_second,
        clicks_path=Path(output_dir) / clicks_audio,
    )

    user = filter_events({"execution": number, "BPM": result["BPM"], "events": result["events"]})
    comparison = analyse(reference, user)

    return {**result, "comparison": comparison, "clicksAudio": clicks_audio}


def notify():
    """Wake the worker up right after a new analysis is saved"""
    _wake.set()


def start_worker(app):
    with app.app_context():
        _recover()
        _train()
    threading.Thread(target=_loop, args=(app,), daemon=True, name="analysis-worker").start()


def _recover():
    """Analyses left 'processing' by a previous run go back to the queue"""
    db.session.execute(
        update(Execution).where(Execution.status == PROCESSING).values(status=PENDING)
    )
    db.session.execute(
        update(Analysis).where(Analysis.status == PROCESSING).values(status=PENDING)
    )
    db.session.commit()


def _loop(app):
    while True:
        with app.app_context():
            try:
                while (analysis_id := _claim_next()) is not None:
                    _run(app, analysis_id)
            except Exception:
                app.logger.exception("Erro no worker de análises")
            finally:
                db.session.remove()

        _wake.wait(POLL_INTERVAL)
        _wake.clear()


def _claim_next():
    analysis_id = db.session.scalar(
        db.select(Analysis.id).where(Analysis.status == PENDING).order_by(Analysis.id).limit(1)
    )
    if analysis_id is None:
        return None

    claimed = db.session.execute(
        update(Analysis)
        .where(Analysis.id == analysis_id, Analysis.status == PENDING)
        .values(status=PROCESSING)
    ).rowcount
    db.session.commit()
    return analysis_id if claimed else _claim_next()


def _run(app, analysis_id):
    analysis = db.session.get(Analysis, analysis_id)

    output_dir = Path(app.config["RESULTS_DIR"]) / str(analysis_id)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        reference = section_reference(
            load_reference()[0], analysis.start_second, analysis.end_second
        )
    except Exception as error:
        reference = None
        reference_error = f"{type(error).__name__}: {error}"

    for execution in analysis.executions:
        if execution.status in (COMPLETED, FAILED):
            continue

        execution.status = PROCESSING
        db.session.commit()

        try:
            if reference is None:
                raise RuntimeError(reference_error)
            result = processar_execucao(
                execution.audio_path,
                output_dir,
                execution.number,
                reference,
                analysis.start_second,
                analysis.end_second,
            )
            _save_result(execution, result)
            execution.status = COMPLETED
        except Exception as error:
            db.session.rollback()
            execution.status = FAILED
            execution.error = f"{type(error).__name__}: {error}"

        db.session.commit()

    any_completed = any(e.status == COMPLETED for e in analysis.executions)
    if any_completed:
        # Before finishing, so the front already reads the new model when the analysis is done
        _train()
    analysis.status = COMPLETED if any_completed else FAILED
    db.session.commit()


def _train():
    """The model learns again with the new executions, takes a fraction of a second"""
    try:
        train_model()
    except ValueError as error:
        # Not enough executions yet: the feedback uses only the fuzzy logic meanwhile
        current_app.logger.info("Modelo de feedback não treinado: %s", error)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Erro ao treinar o modelo de feedback")


def _save_result(execution, result):
    audio = result["audio"]
    execution.duration = audio["duration"]
    execution.sample_rate = audio["sampleRate"]
    execution.channels = audio["channels"]
    execution.bpm = result["BPM"]

    execution.onsets = [
        Onset(time=event["time"], confidence=event["confidence"], beat=event.get("beat"))
        for event in result["events"]
    ]
    execution.onset_count = len(execution.onsets)
    execution.average_onset_confidence = (
        sum(onset.confidence for onset in execution.onsets) / len(execution.onsets)
        if execution.onsets
        else None
    )

    comparison = result["comparison"]
    execution.reference_onset_count = comparison["onsetCount"]["reference"]
    execution.bpm_difference = comparison["BPM"]["difference"]
    execution.euclidean_distance = comparison["euclideanDistance"]
    execution.similarity = comparison["similarity"]
    execution.shift = comparison["shift"]
    execution.evenness = comparison["evenness"]["user"]
    execution.reference_evenness = comparison["evenness"]["reference"]
    execution.bars = comparison["bars"]

    execution.clicks_audio = result["clicksAudio"]
