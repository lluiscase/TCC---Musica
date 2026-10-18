import json
from glob import glob
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

ROOT_DIR = Path(__file__).resolve().parents[2]


def extrair_onsets(audio_path, start_second=None, end_second=None, clicks_path=None):
    """Detect the onsets of one recording.

    start_second / end_second: section of the audio to analyse, None = complete
    clicks_path: if given, saves the original audio + clicks on each onset there
    """
    duration = None
    if end_second is not None:
        duration = end_second - (start_second or 0)

    """Load the file in canal mono"""
    ampl, sample_rate = librosa.load(
        audio_path, sr=None, mono=True, offset=start_second or 0, duration=duration
    )
    channels = sf.info(audio_path).channels

    y_trimmed, _ = librosa.effects.trim(ampl, top_db=150)

    D = librosa.stft(y_trimmed)

    S_db = librosa.amplitude_to_db(np.abs(D), ref=np.max)

    onset_env = librosa.onset.onset_strength(y=y_trimmed, sr=sample_rate, S=S_db)

    onset_detect = librosa.onset.onset_detect(onset_envelope=onset_env)

    if len(onset_detect) == 0:
        raise ValueError("Nenhum ataque rítmico detectado na gravação")

    onset_strengths = onset_env[onset_detect]

    confidence = np.clip(onset_strengths / np.percentile(onset_strengths, 95), 0, 1)

    if clicks_path is not None:
        # Salva o áudio original + clicks dos onsets
        clicks = librosa.clicks(frames=onset_detect, length=len(ampl), sr=sample_rate)
        sf.write(clicks_path, ampl + clicks, sample_rate)

    onset_times = librosa.frames_to_time(onset_detect, sr=sample_rate)

    bpm = float(librosa.feature.tempo(onset_envelope=onset_env, sr=sample_rate)[0])
    beat = [time * bpm / 60 for time in onset_times]

    events = [
        {"time": float(time), "confidence": float(conf), "beat": float(beat)}
        for time, conf, beat in zip(onset_times, confidence, beat)
    ]

    return {
        "audio": {
            "duration": len(ampl) / sample_rate,
            "sampleRate": int(sample_rate),
            "channels": channels,
        },
        "BPM": bpm,
        "events": events,
    }


if __name__ == "__main__":
    """ Part to search all files """
    files = glob(str(ROOT_DIR / "assets" / "execs" / "guitarra" / "*.wav"))

    content = []

    for index, file in enumerate(files):
        result = extrair_onsets(
            file,
            clicks_path=ROOT_DIR / "assets" / "results" / "audio" / f"audio_result{index+1}.wav",
        )
        print(f"BPM:{result['BPM']}")

        """ Generate the files of audio and json """
        content.append(
            {"execution": index + 1, "audio": file, "BPM": result["BPM"], "events": result["events"]}
        )

    with open(ROOT_DIR / "assets" / "results" / "dataset" / "outputUser.json", "w", encoding="utf-8") as json_file:
        json.dump(content, json_file, indent=4)
