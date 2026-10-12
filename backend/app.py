from pathlib import Path

from flask import Flask

from backend.extensions import db
from backend.routes import bp

BASE_DIR = Path(__file__).resolve().parent


def create_app(config=None):
    app = Flask(__name__)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{BASE_DIR / 'analises.db'}",
        UPLOAD_DIR=BASE_DIR / "uploads",
        RESULTS_DIR=BASE_DIR / "results",
        MAX_CONTENT_LENGTH=500 * 1024 * 1024,
    )
    app.config.update(config or {})
    app.json.sort_keys = False

    db.init_app(app)
    app.register_blueprint(bp)

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    create_app().run(debug=True, use_reloader=False)
