"""Fuzzy logic of the feedback.

1. Fuzzification: each error type has a membership function over the feature that
   measures it, giving how much the execution has that error (0 = not at all, 1 = fully).
   The degree above 0.5 is the label the classifiers learn from (weak supervision).
2. Mamdani inference: the degree ("intensidade") and the probability of the classifier
   ("certeza") go through the rule base and give the severity of the error.
3. Defuzzification: centroid of the aggregated output, from 0 (none) to 1 (serious).
"""

import numpy as np

LABEL_DEGREE = 0.5  # degree above which the execution is labeled with the error
REPORT_SEVERITY = 0.4  # severity above which the error is shown to the user


""" Membership functions """


def ramp(x, zero, full):
    """0 until `zero`, 1 from `full`, linear between them. Works in both directions
    (full < zero for errors measured by low values, like the hit rate)."""
    return float(np.clip((x - zero) / (full - zero), 0, 1))


def triangle(x, a, b, c):
    """0 outside [a, c], 1 at b. a == b or b == c make a shoulder."""
    x = np.asarray(x, dtype=float)
    left = np.ones_like(x) if a == b else (x - a) / (b - a)
    right = np.ones_like(x) if b == c else (c - x) / (c - b)
    return np.clip(np.minimum(left, right), 0, 1)


""" Fuzzification of the features """

# Each error: (feature, value with degree 0, value with degree 1). The middle of the
# ramp is the perceptual threshold of the error, so degree 0.5 = at the threshold.
ERROR_SETS = {
    "adiantado": ("mean_error_ms", -10, -40),  # threshold -25 ms, ~25 ms is already perceptible
    "atrasado": ("mean_error_ms", 10, 40),  # threshold 25 ms
    "faltando": ("hit_rate", 0.95, 0.65),  # threshold 80% of the reference attacks
    "extras": ("extra_rate", 0.05, 0.35),  # threshold 20% more attacks than the reference
    "andamento": ("tempo_deviation", 0.03, 0.13),  # threshold 8% faster or slower
    "irregular": ("error_std_ms", 20, 60),  # threshold 40 ms of variation
}


def degrees(features):
    """Membership degree of the execution in each error"""
    return {error: ramp(features[name], zero, full) for error, (name, zero, full) in ERROR_SETS.items()}


def labels(features):
    """Errors the execution has, used as labels for training"""
    return [error for error, degree in degrees(features).items() if degree > LABEL_DEGREE]


""" Mamdani inference """

# Linguistic terms of both inputs, over [0, 1]
INPUT_TERMS = {
    "baixa": (0, 0, 0.5),
    "media": (0, 0.5, 1),
    "alta": (0.5, 1, 1),
}

# Output "gravidade", over [0, 1]
SEVERITY = np.linspace(0, 1, 101)
SEVERITY_TERMS = {
    "nenhuma": (0, 0, 0.35),
    "leve": (0.15, 0.4, 0.65),
    "moderada": (0.4, 0.65, 0.9),
    "grave": (0.65, 1, 1),
}
SEVERITY_LABELS = {"leve": "Leve", "moderada": "Moderado", "grave": "Grave"}

# SE intensidade E certeza ENTÃO gravidade
RULES = {
    ("baixa", "baixa"): "nenhuma",
    ("baixa", "media"): "nenhuma",
    ("baixa", "alta"): "leve",
    ("media", "baixa"): "nenhuma",
    ("media", "media"): "leve",
    ("media", "alta"): "moderada",
    ("alta", "baixa"): "leve",
    ("alta", "media"): "moderada",
    ("alta", "alta"): "grave",
}


def _fuzzify(value):
    return {term: float(triangle(value, *points)) for term, points in INPUT_TERMS.items()}


def severity(intensity, certainty):
    """Mamdani: AND = min, implication = min, aggregation = max, centroid defuzzification.
    Returns the crisp severity and the output term with the highest membership in it."""
    intensity_terms, certainty_terms = _fuzzify(intensity), _fuzzify(certainty)

    aggregated = np.zeros_like(SEVERITY)
    for (intensity_term, certainty_term), output in RULES.items():
        strength = min(intensity_terms[intensity_term], certainty_terms[certainty_term])
        if strength > 0:
            clipped = np.minimum(strength, triangle(SEVERITY, *SEVERITY_TERMS[output]))
            aggregated = np.maximum(aggregated, clipped)

    if aggregated.sum() == 0:
        return 0.0, "nenhuma"

    value = round(float((SEVERITY * aggregated).sum() / aggregated.sum()), 3)
    term = max(SEVERITY_TERMS, key=lambda name: float(triangle(value, *SEVERITY_TERMS[name])))
    return value, term
