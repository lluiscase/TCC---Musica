from pathlib import Path

from flask import Blueprint, current_app, request, send_from_directory

from backend.extensions import db
from backend.models import Analysis, Execution
from backend.worker import start_analysis

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

    start_analysis(current_app._get_current_object(), analysis.id)

    return {"content": {"analysisId": analysis.id, "status": analysis.status}}, 202


@bp.get("/result-analyse/<int:analysis_id>")
def result_analyse(analysis_id):
    analysis = db.session.get(Analysis, analysis_id)
    if analysis is None:
        return _error("Análise não encontrada", 404)
    return {"content": analysis.to_dict()}


@bp.get("/files/<int:analysis_id>/<path:filename>")
def result_file(analysis_id, filename):
    """Serve the report images saved by the automation"""
    directory = Path(current_app.config["RESULTS_DIR"]) / str(analysis_id)
    return send_from_directory(directory, filename)
