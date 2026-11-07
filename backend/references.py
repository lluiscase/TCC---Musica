"""References the executions are compared with.

The default one comes from assets/results/dataset/output.json, the others are recorded or
sent by the user and go through the same onset detection of the executions.
"""

import uuid
from pathlib import Path

import soundfile as sf
from flask import current_app
from sqlalchemy import update

from backend.extensions import db
from backend.models import Analysis, Reference
from processamento.analise_ritmica import (
    bars_evenness,
    filter_events,
    load_reference,
    nearest_euclidean,
    pattern_text,
    section_reference,
    split_bars,
    to_grid,
)
from processamento.pre_processamento import extrair_onsets

DEFAULT_REFERENCE_DIR = Path(__file__).resolve().parents[1] / "assets" / "reference"


def setup_references():
    """Called by create_app after db.create_all"""
    default = _default_reference()
    if default is not None:
        # Analyses created before there was more than one reference
        db.session.execute(
            update(Analysis).where(Analysis.reference_id.is_(None)).values(reference_id=default.id)
        )
        db.session.commit()


def _default_reference():
    default = db.session.scalar(db.select(Reference).where(Reference.is_default))
    if default is not None:
        return default

    try:
        item = load_reference()[0]
        # output.json keeps the absolute path of the machine that generated it, only the name matters
        audio_path = DEFAULT_REFERENCE_DIR / Path(item["audio"].replace("\\", "/")).name
        info = sf.info(audio_path)
    except Exception:
        current_app.logger.exception("Referência padrão não encontrada em assets")
        return None

    default = Reference(
        name="Referência padrão",
        audio_path=str(audio_path),
        duration=info.duration,
        sample_rate=info.samplerate,
        channels=info.channels,
        bpm=item["BPM"],
        events=item["events"],
        is_default=True,
    )
    db.session.add(default)
    db.session.commit()
    return default


def create_reference(file, name):
    """Onset detection of the audio sent by the user. Done before touching the database,
    so the worker isn't blocked while librosa runs."""
    directory = Path(current_app.config["UPLOAD_DIR"]) / "references"
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{uuid.uuid4().hex}.wav"
    file.save(path)

    try:
        result = extrair_onsets(path)
    except Exception:
        path.unlink(missing_ok=True)
        raise

    reference = Reference(
        name=name,
        audio_path=str(path),
        duration=result["audio"]["duration"],
        sample_rate=result["audio"]["sampleRate"],
        channels=result["audio"]["channels"],
        bpm=result["BPM"],
        events=result["events"],
    )
    db.session.add(reference)
    db.session.commit()
    return reference


def analysis_reference(analysis):
    """Reference of the analysis cut to the section requested for the user"""
    if analysis.reference is None:
        raise ValueError("A análise não tem referência")
    return section_reference(analysis.reference.source(), analysis.start_second, analysis.end_second)


def reference_detail(reference):
    clean = filter_events(reference.source())
    grid = to_grid(clean["events"], clean["BPM"])
    _, evenness = bars_evenness(grid)
    # Every bar, including the empty ones, so the front can draw the whole grid
    bars = [nearest_euclidean(bar) or {"pattern": pattern_text(bar), "k": 0} for bar in split_bars(grid)]

    return {
        **reference.summary(),
        "audio": {
            "url": f"/api/references/{reference.id}/audio",
            "duration": reference.duration,
            "sampleRate": reference.sample_rate,
            "channels": reference.channels,
        },
        "detectedOnsetCount": len(reference.events),
        "onsetCount": len(clean["events"]),
        "evenness": evenness,
        "onsets": clean["events"],
        "bars": bars,
    }
