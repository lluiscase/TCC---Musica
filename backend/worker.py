import threading
from pathlib import Path

from backend.extensions import db
from backend.models import (
    COMPLETED,
    FAILED,
    PROCESSING,
    Analysis,
    Feedback,
    Onset,
)


def processar_execucao(audio_path, output_dir, start_second=None, end_second=None):
    """Entry point of the automation for one execution. Replace the body with the
    call to the processing code.

    audio_path: path of the uploaded .wav
    output_dir: folder where report images can be saved (served by /api/files)
    start_second / end_second: section of the song to analyse, None = complete

    Must return:
    {
        "audio": {"duration": float, "sampleRate": int, "channels": int},
        "BPM": float,
        "onsets": [
            {
                "time": float,
                "confidence": float,
                "duration": float | None,
                "features": {"energy": float | None, "spectralCentroid": float | None},
            }
        ],
        "metrics": {"onsetCount": int, "averageOnsetConfidence": float},
        "feedback": [{"type": "good" | "warning" | "bad", "text": str}],
        "reportImage": "file name inside output_dir" | None,
    }
    """
    raise NotImplementedError("Conecte aqui a automação de processamento")


def start_analysis(app, analysis_id):
    """Process the analysis in background so the POST can answer right away"""
    threading.Thread(target=_run, args=(app, analysis_id), daemon=True).start()


def _run(app, analysis_id):
    with app.app_context():
        analysis = db.session.get(Analysis, analysis_id)
        analysis.status = PROCESSING
        db.session.commit()

        output_dir = Path(app.config["RESULTS_DIR"]) / str(analysis_id)
        output_dir.mkdir(parents=True, exist_ok=True)

        for execution in analysis.executions:
            execution.status = PROCESSING
            db.session.commit()

            try:
                result = processar_execucao(
                    execution.audio_path,
                    output_dir,
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
        analysis.status = COMPLETED if any_completed else FAILED
        db.session.commit()
        db.session.remove()


def _save_result(execution, result):
    audio = result["audio"]
    execution.duration = audio["duration"]
    execution.sample_rate = audio["sampleRate"]
    execution.channels = audio["channels"]
    execution.bpm = result["BPM"]

    execution.onsets = [
        Onset(
            time=onset["time"],
            confidence=onset["confidence"],
            duration=onset.get("duration"),
            energy=onset.get("features", {}).get("energy"),
            spectral_centroid=onset.get("features", {}).get("spectralCentroid"),
        )
        for onset in result["onsets"]
    ]

    metrics = result.get("metrics") or {}
    execution.onset_count = metrics.get("onsetCount", len(execution.onsets))
    execution.average_onset_confidence = metrics.get("averageOnsetConfidence")

    execution.feedback = [
        Feedback(type=item["type"], text=item["text"])
        for item in result.get("feedback", [])
    ]
    execution.report_image = result.get("reportImage")
