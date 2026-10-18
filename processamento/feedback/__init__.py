"""Machine learning of the feedback.

Each execution becomes a row of features (how it compares with the reference). Nobody
labels the executions: the fuzzy sets of processamento.fuzzy give each one its errors
(weak supervision), and one classifier per error type learns from the executions of every
user. The fuzzy inference joins how strong the error was measured with how sure the
classifier is, and the resulting severity decides which errors become feedback. While an
error type does not have enough executions to train, the measured degree alone is used.
"""

from datetime import datetime

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from processamento import fuzzy
from processamento.analise_ritmica import analyse

MATCH_TOLERANCE = 0.25  # beats (one sixteenth note) to consider the same attack
ANCHORS = 3  # first onsets tried as the start of the alignment
TEMPO_RATIOS = np.arange(0.75, 1.35, 0.0025)  # user seconds per reference second tried
ON_BEAT = 0.1  # beats from a whole beat for an attack of the reference to mark the pulse
MIN_SAMPLES = 10  # executions needed to train
MIN_PER_CLASS = 3  # executions with and without an error to learn that error

ERROR_TYPES = {
    "adiantado": {
        "label": "Adiantado",
        "message": "Você está entrando um pouquinho antes da batida. Respire e espere o tempo chegar: "
        "tocar junto com um metrônomo, mais devagar, ajuda a sentir o momento certo.",
    },
    "atrasado": {
        "label": "Atrasado",
        "message": "Os ataques estão chegando um pouco depois da batida. Tente antecipar levemente o "
        "movimento da mão; contar o tempo em voz alta ajuda bastante.",
    },
    "faltando": {
        "label": "Ataques faltando",
        "message": "Alguns ataques da referência ficaram de fora. Ouça a referência mais uma vez e "
        "treine o trecho em partes pequenas, sem pressa.",
    },
    "extras": {
        "label": "Ataques extras",
        "message": "Apareceram ataques que não estão na referência. Pode ser um toque sem querer ou "
        "uma corda soando junto: foque em tocar só as batidas do padrão.",
    },
    "andamento": {
        "label": "Andamento diferente",
        "message": "Seu andamento ficou {direction} que o da referência ({reference_bpm:.0f} BPM). "
        "Coloque o metrônomo nesse BPM, ou um pouco abaixo, e vá subindo aos poucos.",
    },
    "irregular": {
        "label": "Tempo irregular",
        "message": "O tempo entre as batidas variou ao longo da execução. Isso é normal no começo: "
        "repita o trecho com metrônomo até ele ficar confortável.",
    },
}

NO_ERRORS_MESSAGE = (
    "Mandou bem! Seu ritmo ficou próximo da referência. Continue praticando para manter essa consistência."
)

FEATURES = [
    "bpm_ratio",  # user BPM / reference BPM
    "tempo_ratio",  # user seconds per reference second, from the pulse of the pairs, > 1 = slower
    "tempo_deviation",  # |tempo_ratio - 1|: slower and faster are both wrong, a linear model needs it apart
    "onset_ratio",  # attacks of the user / attacks of the reference
    "hit_rate",  # reference attacks the user also played
    "extra_rate",  # user attacks without a pair, relative to the reference
    "mean_error_ms",  # mean timing error of the pairs relative to the user's pulse, negative = early
    "mean_abs_error_ms",
    "error_std_ms",  # how much the error varies, high = unsteady
    "drift_ms_per_beat",  # error growing over time = speeding up / slowing down
    "similarity",  # analise_ritmica: 1 - normalised Euclidean distance of the grids
    "evenness_diff",  # analise_ritmica: user evenness - reference evenness
    "average_confidence",
]


""" Features """


def _times(events):
    return np.array([event["time"] for event in events])


def _nearest(reference_beats, beats):
    """Index of the closest reference attack for each beat and the distance to it"""
    right = np.clip(np.searchsorted(reference_beats, beats), 1, len(reference_beats) - 1)
    left = right - 1
    use_left = np.abs(beats - reference_beats[left]) <= np.abs(reference_beats[right] - beats)
    index = np.where(use_left, left, right)
    return index, np.abs(beats - reference_beats[index])


def _match(reference_beats, user_beats, tolerance=MATCH_TOLERANCE):
    """Pairs (reference index, user index), closest first, each attack used once"""
    candidates = sorted(
        (abs(user - reference), i, j)
        for i, reference in enumerate(reference_beats)
        for j, user in enumerate(user_beats)
        if abs(user - reference) <= tolerance
    )
    used_reference, used_user, pairs = set(), set(), []
    for _, i, j in candidates:
        if i not in used_reference and j not in used_user:
            used_reference.add(i)
            used_user.add(j)
            pairs.append((i, j))
    return sorted(pairs)


def align(reference_times, user_times, reference_bpm):
    """Finds the tempo and start of the user that pair the most attacks with the reference.
    The BPM detected by librosa is not used: 1% off already misaligns the end of the music.
    Returns the user attacks in reference beats and the pairs."""
    to_beats = reference_bpm / 60
    reference_beats = (reference_times - reference_times[0]) * to_beats
    if len(reference_beats) < 2:
        return (user_times - user_times[0]) * to_beats, _match(reference_beats, (user_times - user_times[0]) * to_beats)

    best = None
    for i in range(min(ANCHORS, len(reference_times))):
        for j in range(min(ANCHORS, len(user_times))):
            for ratio in TEMPO_RATIOS:
                beats = ((user_times - user_times[j]) / ratio + reference_times[i] - reference_times[0]) * to_beats
                index, distance = _nearest(reference_beats, beats)
                close = distance <= MATCH_TOLERANCE
                score = (len(np.unique(index[close])), -distance[close].sum())
                if best is None or score > best[0]:
                    best = (score, beats)

    return best[1], _match(reference_beats, best[1])


def extract_features(reference, user):
    """reference / user: {"execution", "BPM", "events"} already cleaned with filter_events"""
    reference_events, user_events = reference["events"], user["events"]
    if not reference_events or not user_events:
        raise ValueError("Execução sem ataques para comparar com a referência")

    reference_times, user_times = _times(reference_events), _times(user_events)
    to_beats = reference["BPM"] / 60
    reference_beats = (reference_times - reference_times[0]) * to_beats
    _, pairs = align(reference_times, user_times, reference["BPM"])

    # Pulse of the user: line through the attacks that fall on the beats of the reference
    # (all the pairs when there are few). Early / late = off that pulse.
    on_beat = [(i, j) for i, j in pairs if abs(reference_beats[i] - round(reference_beats[i])) <= ON_BEAT]
    pulse = on_beat if len(on_beat) >= 4 else pairs
    if len(pulse) > 1:
        tempo_ratio, start = np.polyfit([reference_times[i] for i, _ in pulse], [user_times[j] for _, j in pulse], 1)
        user_beats = ((user_times - start) / tempo_ratio - reference_times[0]) * to_beats
        pairs = _match(reference_beats, user_beats)
    else:
        tempo_ratio, user_beats = 1.0, (user_times - user_times[0]) * to_beats

    ms_per_beat = 1000 / to_beats
    errors = np.array([(user_beats[j] - reference_beats[i]) * ms_per_beat for i, j in pairs])
    matched_beats = np.array([reference_beats[i] for i, _ in pairs])
    comparison = analyse(reference, user)
    evenness = comparison["evenness"]

    return {
        "bpm_ratio": user["BPM"] / reference["BPM"],
        "tempo_ratio": float(tempo_ratio),
        "tempo_deviation": float(abs(tempo_ratio - 1)),
        "onset_ratio": len(user_events) / len(reference_events),
        "hit_rate": len(pairs) / len(reference_events),
        "extra_rate": (len(user_events) - len(pairs)) / len(reference_events),
        "mean_error_ms": float(errors.mean()) if len(errors) else 0.0,
        "mean_abs_error_ms": float(np.abs(errors).mean()) if len(errors) else 0.0,
        "error_std_ms": float(errors.std()) if len(errors) > 1 else 0.0,
        "drift_ms_per_beat": float(np.polyfit(matched_beats, errors, 1)[0]) if len(errors) > 2 else 0.0,
        "similarity": comparison["similarity"],
        "evenness_diff": (evenness["user"] or 0) - (evenness["reference"] or 0),
        "average_confidence": float(np.mean([event["confidence"] for event in user_events])),
    }


def auto_labels(features):
    return fuzzy.labels(features)


def _matrix(rows):
    return np.array([[row[name] for name in FEATURES] for row in rows], dtype=float)


""" Training """


def _classifier():
    # Few samples: a linear model with balanced classes overfits less than trees
    return make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=1000))


def _evaluate(X, y):
    """Cross-validated agreement with the automatic labels, each execution is predicted
    by a model that did not see it"""
    folds = min(5, int(y.sum()), int(len(y) - y.sum()))
    splitter = StratifiedKFold(n_splits=folds, shuffle=True, random_state=0)
    predicted = cross_val_predict(_classifier(), X, y, cv=splitter)
    return {
        "precision": float(precision_score(y, predicted, zero_division=0)),
        "recall": float(recall_score(y, predicted, zero_division=0)),
        "f1": float(f1_score(y, predicted, zero_division=0)),
    }


def train(samples):
    """samples: [(features, [error types])], labels from auto_labels. Returns the model saved by save_model."""
    if len(samples) < MIN_SAMPLES:
        raise ValueError(
            f"São necessárias pelo menos {MIN_SAMPLES} execuções para treinar, há {len(samples)}"
        )

    X = _matrix([features for features, _ in samples])
    classifiers, metrics, skipped = {}, {}, {}

    for error_type in ERROR_TYPES:
        y = np.array([error_type in errors for _, errors in samples], dtype=int)
        positives, negatives = int(y.sum()), int(len(y) - y.sum())
        if min(positives, negatives) < MIN_PER_CLASS:
            skipped[error_type] = (
                f"{positives} execuções com o erro e {negatives} sem, "
                f"precisa de pelo menos {MIN_PER_CLASS} de cada"
            )
            continue

        metrics[error_type] = {**_evaluate(X, y), "positives": positives}
        classifiers[error_type] = _classifier().fit(X, y)

    if not classifiers:
        raise ValueError("Nenhum tipo de erro tem execuções suficientes com e sem o erro para treinar")

    return {
        "features": FEATURES,
        "classifiers": classifiers,
        "metrics": metrics,
        "skipped": skipped,
        "samples": len(samples),
        "trainedAt": datetime.now().isoformat(timespec="seconds"),
    }


def save_model(model, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)


def load_model(path):
    return joblib.load(path) if path.exists() else None


def model_summary(model):
    if model is None:
        return None
    return {key: model[key] for key in ("samples", "trainedAt", "metrics", "skipped")}


""" Feedback """


def _message(error_type, features, reference_bpm):
    message = ERROR_TYPES[error_type]["message"]
    if error_type == "andamento":
        direction = "mais lento" if features["tempo_ratio"] > 1 else "mais rápido"
        message = message.format(direction=direction, reference_bpm=reference_bpm)
    return message


def _error(error_type, degree, probability, severity, term, features, reference_bpm):
    return {
        "type": error_type,
        "label": ERROR_TYPES[error_type]["label"],
        "degree": degree,  # fuzzy membership of the measured feature
        "probability": probability,  # classifier, None while the error type is not trained
        "severity": severity,  # defuzzified output of the inference
        "severityLabel": fuzzy.SEVERITY_LABELS[term],
        "message": _message(error_type, features, reference_bpm),
        "source": "model" if probability is not None else "fuzzy",
    }


def predict(model, features, reference_bpm):
    """Errors with severity above fuzzy.REPORT_SEVERITY, most serious first, each with its
    message. The certainty of the inference is the probability of the classifier; for the
    error types the model could not learn yet (or every type, without a model) it is the
    measured degree itself."""
    classifiers = model["classifiers"] if model else {}
    X = _matrix([features])
    errors = []
    for error_type, degree in fuzzy.degrees(features).items():
        probability = None
        if error_type in classifiers:
            probability = float(classifiers[error_type].predict_proba(X)[0, 1])
        certainty = degree if probability is None else probability
        severity, term = fuzzy.severity(degree, certainty)
        if severity > fuzzy.REPORT_SEVERITY:
            errors.append(_error(error_type, degree, probability, severity, term, features, reference_bpm))

    errors.sort(key=lambda error: error["severity"], reverse=True)
    return {"errors": errors, "message": NO_ERRORS_MESSAGE if not errors else None}
