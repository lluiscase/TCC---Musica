from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.extensions import db

PENDING = "pending"
PROCESSING = "processing"
COMPLETED = "completed"
FAILED = "failed"

FINISHED = (COMPLETED, FAILED)


class Analysis(db.Model):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default=PENDING)
    total_executions: Mapped[int]
    start_second: Mapped[Optional[float]]
    end_second: Mapped[Optional[float]]
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)

    executions: Mapped[list["Execution"]] = relationship(
        back_populates="analysis",
        order_by="Execution.number",
        cascade="all, delete-orphan",
    )

    @property
    def completed_executions(self):
        return sum(execution.status == COMPLETED for execution in self.executions)

    @property
    def progress(self):
        """Percentage of executions already finished (completed or failed)"""
        if not self.total_executions:
            return 0
        finished = sum(execution.status in FINISHED for execution in self.executions)
        return round(finished / self.total_executions * 100)

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "progress": self.progress,
            "totalExecutions": self.total_executions,
            "completedExecutions": self.completed_executions,
            "startSecond": self.start_second,
            "endSecond": self.end_second,
            "executions": [execution.to_dict() for execution in self.executions],
        }


class Execution(db.Model):
    __tablename__ = "executions"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"))
    number: Mapped[int]
    status: Mapped[str] = mapped_column(String(20), default=PENDING)
    audio_path: Mapped[str] = mapped_column(String(500))

    duration: Mapped[Optional[float]]
    sample_rate: Mapped[Optional[int]]
    channels: Mapped[Optional[int]]
    bpm: Mapped[Optional[float]]

    onset_count: Mapped[Optional[int]]
    average_onset_confidence: Mapped[Optional[float]]

    report_image: Mapped[Optional[str]] = mapped_column(String(255))
    error: Mapped[Optional[str]] = mapped_column(Text)

    analysis: Mapped[Analysis] = relationship(back_populates="executions")
    onsets: Mapped[list["Onset"]] = relationship(
        back_populates="execution",
        order_by="Onset.time",
        cascade="all, delete-orphan",
    )
    feedback: Mapped[list["Feedback"]] = relationship(
        back_populates="execution",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        completed = self.status == COMPLETED
        return {
            "id": self.id,
            "number": self.number,
            "status": self.status,
            "audio": {
                "duration": self.duration,
                "sampleRate": self.sample_rate,
                "channels": self.channels,
            }
            if completed
            else None,
            "BPM": self.bpm,
            "onsets": [onset.to_dict() for onset in self.onsets],
            "metrics": {
                "onsetCount": self.onset_count,
                "averageOnsetConfidence": self.average_onset_confidence,
            }
            if completed
            else None,
            "feedback": [item.to_dict() for item in self.feedback],
            "reportImage": f"/api/files/{self.analysis_id}/{self.report_image}"
            if self.report_image
            else None,
            "error": self.error,
        }


class Onset(db.Model):
    __tablename__ = "onsets"

    id: Mapped[int] = mapped_column(primary_key=True)
    execution_id: Mapped[int] = mapped_column(ForeignKey("executions.id"))
    time: Mapped[float]
    confidence: Mapped[float]
    duration: Mapped[Optional[float]]
    energy: Mapped[Optional[float]]
    spectral_centroid: Mapped[Optional[float]]

    execution: Mapped[Execution] = relationship(back_populates="onsets")

    def to_dict(self):
        return {
            "time": self.time,
            "confidence": self.confidence,
            "duration": self.duration,
            "features": {
                "energy": self.energy,
                "spectralCentroid": self.spectral_centroid,
            },
        }


class Feedback(db.Model):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    execution_id: Mapped[int] = mapped_column(ForeignKey("executions.id"))
    type: Mapped[str] = mapped_column(String(20))
    text: Mapped[str] = mapped_column(Text)

    execution: Mapped[Execution] = relationship(back_populates="feedback")

    def to_dict(self):
        return {"type": self.type, "text": self.text}
