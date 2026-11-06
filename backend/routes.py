from pathlib import Path

import soundfile as sf
from flask import Blueprint, current_app, request, send_file, send_from_directory

from backend.extensions import db
from backend.feedback import completed_count, current_model, execution_feedback
from backend.models import Analysis, Execution
from backend.worker import notify
from processamento.analise_ritmica import (
    bars_evenness,
    filter_events,
    load_reference,
    nearest_euclidean,
    pattern_text,
    split_bars,
    to_grid,
)
from processamento.feedback import ERROR_TYPES, model_summary

REFERENCE_DIR = Path(__file__).resolve().parents[1] / "assets" / "reference"

bp = Blueprint("api", __name__, url_prefix="/api")


def _error(message, status=400):
    return {"error": message}, status


@bp.post("/execute-analyse")
def execute_analyse():
    """formData: audio (one .wav per execution), executions, startSecond?, endSecond?"""
    files = request.files.getlist("audio")
    executions = request.form.get("executions", type=int)
    start_second = request.form.get("startSecond", type=float)
    end_second = request.form.get("endSecond", type=float)

    if not executions or executions < 1:
        return _error("'executions' deve ser um número maior que zero")
    if len(files) != executions:
        return _error(f"Esperados {executions} áudios, recebidos {len(files)}")
    if any(not file.filename.lower().endswith(".wav") for file in files):
        return _error("Todos os áudios devem ser .wav")
    if start_second is not None and end_second is not None and end_second <= start_second:
        return _error("'endSecond' deve ser maior que 'startSecond'")

    analysis = Analysis(
        total_executions=executions,
        start_second=start_second,
        end_second=end_second,
    )
    db.session.add(analysis)
    db.session.flush()

    upload_dir = Path(current_app.config["UPLOAD_DIR"]) / str(analysis.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    for number, file in enumerate(files, start=1):
        path = upload_dir / f"execucao{number}.wav"
        file.save(path)
        analysis.executions.append(Execution(number=number, audio_path=str(path)))

    db.session.commit()

    notify()

    return {"content": {"analysisId": analysis.id, "status": analysis.status}}, 202


@bp.get("/analyses")
def list_analyses():
    """Rows of the analyses table, newest first"""
    analyses = db.session.scalars(db.select(Analysis).order_by(Analysis.id.desc())).all()
    return {"content": [analysis.summary() for analysis in analyses]}


@bp.get("/result-analyse/<int:analysis_id>")
def result_analyse(analysis_id):
    analysis = db.session.get(Analysis, analysis_id)
    if analysis is None:
        return _error("Análise não encontrada", 404)

    content = analysis.to_dict()
    model = current_model()
    for execution, row in zip(analysis.executions, content["executions"]):
        try:
            row["feedback"] = execution_feedback(execution, model)
        except Exception:
            current_app.logger.exception("Erro ao gerar o feedback da execução %s", execution.id)
            row["feedback"] = None
    return {"content": content}


@bp.get("/model")
def model_status():
    """Model trained by the worker with the executions of every user"""
    return {
        "content": {
            "errorTypes": [{"type": key, "label": value["label"]} for key, value in ERROR_TYPES.items()],
            "completedExecutions": completed_count(),
            "model": model_summary(current_model()),
        }
    }


def _reference_audio(reference):
    # output.json keeps the absolute path of the machine that generated it, only the name matters
    return REFERENCE_DIR / Path(reference["audio"].replace("\\", "/")).name


@bp.get("/reference")
def reference():
    """Fixed reference the executions are compared with (assets/results/dataset/output.json)"""
    reference = load_reference()[0]
    clean = filter_events(reference)
    grid = to_grid(clean["events"], clean["BPM"])
    _, evenness = bars_evenness(grid)
    # Every bar, including the empty ones, so the front can draw the whole grid
    bars = [nearest_euclidean(bar) or {"pattern": pattern_text(bar), "k": 0} for bar in split_bars(grid)]
    info = sf.info(_reference_audio(reference))

    return {
        "content": {
            "audio": {
                "url": "/api/reference/audio",
                "duration": info.duration,
                "sampleRate": info.samplerate,
                "channels": info.channels,
            },
            "BPM": reference["BPM"],
            "detectedOnsetCount": len(reference["events"]),
            "onsetCount": len(clean["events"]),
            "evenness": evenness,
            "onsets": clean["events"],
            "bars": bars,
        }
    }


@bp.get("/reference/audio")
def reference_audio():
    return send_file(_reference_audio(load_reference()[0]), mimetype="audio/wav")
