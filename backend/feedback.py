"""Connects the database with processamento.feedback: features of the saved executions,
training with the executions of every user and feedback of each execution."""

import threading
from pathlib import Path

from flask import current_app

from backend.extensions import db
from backend.models import COMPLETED, Execution
from processamento.analise_ritmica import filter_events, load_reference, section_reference
from processamento.feedback import auto_labels, extract_features, load_model, predict, save_model, train

_lock = threading.Lock()
_cache = {"path": None, "mtime": None, "model": None}


def _model_path():
    return Path(current_app.config["MODEL_PATH"])


def current_model():
    """Model saved on disk, read again only when the file changes"""
    path = _model_path()
    mtime = path.stat().st_mtime if path.exists() else None
    with _lock:
        if (_cache["path"], _cache["mtime"]) != (path, mtime):
            _cache.update(path=path, mtime=mtime, model=load_model(path))
        return _cache["model"]


def _reference(analysis):
    return section_reference(load_reference()[0], analysis.start_second, analysis.end_second)


def execution_features(execution, reference=None):
    reference = reference or _reference(execution.analysis)
    user = filter_events(
        {
            "execution": execution.number,
            "BPM": execution.bpm,
            "events": [onset.to_dict() for onset in execution.onsets],
        }
    )
    return extract_features(reference, user)


def execution_feedback(execution, model):
    if execution.status != COMPLETED:
        return None
    reference = _reference(execution.analysis)
    return predict(model, execution_features(execution, reference), reference["BPM"])


def train_model():
    """Trains with every completed execution, labeled by the fuzzy sets. Called by the worker
    after each analysis, so the model keeps learning as users send executions."""
    executions = db.session.scalars(db.select(Execution).where(Execution.status == COMPLETED)).all()
    samples = []
    for execution in executions:
        try:
            features = execution_features(execution)
        except ValueError:
            continue  # e.g. section of the reference without attacks
        samples.append((features, auto_labels(features)))

    model = train(samples)
    save_model(model, _model_path())
    return model


def completed_count():
    return db.session.scalar(
        db.select(db.func.count()).select_from(Execution).where(Execution.status == COMPLETED)
    )
