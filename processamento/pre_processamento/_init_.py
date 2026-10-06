import librosa

import numpy as np

from IPython.display import Audio, display

from glob import glob

import soundfile as sf

import json

""" Part to search all files """
files = glob("C:/Users/jglrjlg/Music/assets/execs/guitarra/*.wav")

content = []

for index, file in enumerate(files):
    """Load the file in canal mono"""
    ampl, sample_rate = librosa.load(file, sr=None, mono=True)

    y_trimmed, _ = librosa.effects.trim(ampl, top_db=150)

    D = librosa.stft(y_trimmed)

    S_db = librosa.amplitude_to_db(np.abs(D), ref=np.max)

    diffs = np.diff(S_db, axis=-1, prepend=S_db[:, :1])

    diffs_thresh = np.maximum(diffs, 0)

    onset_env = librosa.onset.onset_strength(y=y_trimmed, sr=sample_rate, S=S_db)

    onset_peak = librosa.util.localmax(onset_env)

    onset_detect = librosa.onset.onset_detect(onset_envelope=onset_env)

    frequency, voiced_flag, voiced_prob = librosa.pyin(
        y=y_trimmed, sr=sample_rate, fmin=27.5, fmax=4186, frame_length=4096
    )

    onset_strengths = onset_env[onset_detect]

    confidence = onset_strengths / np.max(onset_strengths)

    clicks = librosa.clicks(frames=onset_detect, length=len(ampl), sr=sample_rate)

    # Salva o áudio original + clicks dos onsets
    sf.write(
        f"assets/results/audio/audio_result{index+1}.wav", ampl + clicks, sample_rate
    )

    times = librosa.times_like(onset_env, sr=sample_rate)
    onset_times = librosa.frames_to_time(onset_detect, sr=sample_rate)
    interval = np.diff(onset_times)

    bpm = librosa.feature.tempo(onset_envelope=onset_env, sr=sample_rate)

    print(f"INTERVALO:{interval} FREQUENCIA:{frequency}")
    print(f"BPM:{bpm}")

    """ Generate the files of audio and json """

    events = [
        {"time": float(time), "confidence": float(conf), "frequency": float(freq)}
        for time, conf, freq in zip(onset_times, confidence, frequency)
    ]
    content.append(
        {"execution": index + 1, "audio": file, "BPM": float(bpm[0]), "events": events}
    )

    display(Audio(data=ampl + clicks, rate=sample_rate))

with open("assets/results/dataset/output.json", "w", encoding="utf-8") as json_file:
    json.dump(content, json_file, indent=4)
