from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.extensions import db

PENDING = "pending"
PROCESSING = "processing"
COMPLETED = "completed"
FAILED = "failed"

FINISHED = (COMPLETED, FAILED)


def _mean(values):
    values = [value for value in values if value is not None]
    return sum(values) / len(values) if values else None


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

    def summary(self):
        """Row of the analyses table (GET /api/analyses)"""
        completed = [e for e in self.executions if e.status == COMPLETED]
        return {
            "id": self.id,
            "status": self.status,
            "progress": self.progress,
            "createdAt": self.created_at.isoformat(timespec="seconds"),
            "totalExecutions": self.total_executions,
            "completedExecutions": len(completed),
            "startSecond": self.start_second,
            "endSecond": self.end_second,
            "averageBPM": _mean([e.bpm for e in completed]),
            "averageSimilarity": _mean([e.similarity for e in completed]),
        }

    def to_dict(self):
        return {
            **self.summary(),
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

    # Comparison with the reference (processamento.analise_ritmica)
    reference_onset_count: Mapped[Optional[int]]
    bpm_difference: Mapped[Optional[float]]
    euclidean_distance: Mapped[Optional[float]]
    similarity: Mapped[Optional[float]]
    shift: Mapped[Optional[int]]
    evenness: Mapped[Optional[float]]
    reference_evenness: Mapped[Optional[float]]
    bars: Mapped[Optional[dict]] = mapped_column(JSON)

    clicks_audio: Mapped[Optional[str]] = mapped_column(String(255))
    error: Mapped[Optional[str]] = mapped_column(Text)

    analysis: Mapped[Analysis] = relationship(back_populates="executions")
    onsets: Mapped[list["Onset"]] = relationship(
        back_populates="execution",
        order_by="Onset.time",
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
            "comparison": {
                "referenceOnsetCount": self.reference_onset_count,
                "BPMDifference": self.bpm_difference,
                "euclideanDistance": self.euclidean_distance,
                "similarity": self.similarity,
                "shift": self.shift,
                "evenness": {"reference": self.reference_evenness, "user": self.evenness},
                "bars": self.bars,
            }
            if completed
            else None,
            "clicksAudio": f"/api/files/{self.analysis_id}/{self.clicks_audio}"
            if self.clicks_audio
            else None,
            "error": self.error,
        }


class Onset(db.Model):
    __tablename__ = "onsets"

    id: Mapped[int] = mapped_column(primary_key=True)
    execution_id: Mapped[int] = mapped_column(ForeignKey("executions.id"))
    time: Mapped[float]
    confidence: Mapped[float]
    beat: Mapped[Optional[float]]

    execution: Mapped[Execution] = relationship(back_populates="onsets")

    def to_dict(self):
        return {"time": self.time, "confidence": self.confidence, "beat": self.beat}

