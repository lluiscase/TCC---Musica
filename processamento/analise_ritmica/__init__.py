import json
from pathlib import Path

import numpy as np

DATASET_DIR = Path(__file__).resolve().parents[2] / "assets" / "results" / "dataset"

MEDIAN_FACTOR = 0.8  # threshold = median of the recording * factor
MIN_GAP = 0.06  # seconds, closer onsets are the same note detected twice
STEPS_PER_BEAT = 4  # sixteenth notes
STEPS_PER_BAR = 16  # 4/4
MAX_SHIFT = 2  # steps tolerated when aligning reference and user


def load_reference():
    with open(DATASET_DIR / "output.json", "r", encoding="utf-8") as json_file:
        return json.load(json_file)


def load_datasets():
    reference = load_reference()

    with open(DATASET_DIR / "outputUser.json", "r", encoding="utf-8") as json_file:
        user = json.load(json_file)

    return reference, user


""" Cleaning """


def remove_duplicates(events, min_gap=MIN_GAP):
    """Keep only the strongest onset among those closer than min_gap"""
    result = []
    for event in sorted(events, key=lambda event: event["time"]):
        if result and event["time"] - result[-1]["time"] < min_gap:
            if event["confidence"] > result[-1]["confidence"]:
                result[-1] = event
            continue
        result.append(event)
    return result


def filter_events(item, factor=MEDIAN_FACTOR):
    """Keep the onsets above a threshold relative to the median of the recording"""
    events = remove_duplicates(item["events"])
    if not events:
        return {**item, "events": []}

    threshold = np.median([event["confidence"] for event in events]) * factor
    return {
        **item,
        "threshold": float(threshold),
        "events": [event for event in events if event["confidence"] >= threshold],
    }


def section_reference(reference, start_second=None, end_second=None):
    """Reference cut to the same section requested for the user"""
    start = start_second or 0
    end = end_second if end_second is not None else float("inf")
    events = [event for event in reference["events"] if start <= event["time"] <= end]
    if not events:
        raise ValueError("A referência não tem ataques no trecho selecionado")
    return filter_events({**reference, "events": events})


""" Rhythmic grid """


def to_grid(events, bpm, steps_per_beat=STEPS_PER_BEAT):
    """Binary vector with one position per sixteenth note, 1 = onset.
    Uses the BPM of the execution itself, so different tempos become comparable."""
    times = np.array([event["time"] for event in events])
    steps = np.round((times - times[0]) * bpm / 60 * steps_per_beat).astype(int)
    grid = np.zeros(steps[-1] + 1)
    grid[steps] = 1
    return grid


def split_bars(grid, steps_per_bar=STEPS_PER_BAR):
    size = int(np.ceil(len(grid) / steps_per_bar)) * steps_per_bar
    return np.pad(grid, (0, size - len(grid))).reshape(-1, steps_per_bar)


def pattern_text(bar):
    return "".join("x" if step else "." for step in bar)


""" Euclidean norm (distance between reference and user) """


def euclidean_distance(a, b):
    """||a - b|| = sqrt(sum((a_i - b_i)^2)), in a binary grid = sqrt(different steps)"""
    return float(np.linalg.norm(a - b))


def _align(a, b, shift):
    if shift > 0:
        b = np.concatenate([np.zeros(shift), b])
    elif shift < 0:
        a = np.concatenate([np.zeros(-shift), a])
    size = max(len(a), len(b))
    return np.pad(a, (0, size - len(a))), np.pad(b, (0, size - len(b)))


def compare_grids(reference_grid, user_grid, max_shift=MAX_SHIFT):
    """Smallest Euclidean distance trying small shifts at the start.
    similarity = 1 - distance / sqrt(onsets of both), from 0 (nothing matches) to 1 (equal)"""
    best = None
    for shift in range(-max_shift, max_shift + 1):
        a, b = _align(reference_grid, user_grid, shift)
        distance = euclidean_distance(a, b)
        if best is None or distance < best["distance"]:
            best = {"distance": distance, "shift": shift}

    max_distance = np.sqrt(reference_grid.sum() + user_grid.sum())
    best["similarity"] = float(1 - best["distance"] / max_distance)
    return best


""" Euclidean rhythms (Euclid algorithm / Bjorklund) """


def euclidean_rhythm(k, n):
    """E(k, n): k onsets spread as evenly as possible over n steps"""
    return np.array([1 if (i * k) % n < k else 0 for i in range(n)])


def nearest_euclidean(bar):
    """Compare the bar with every rotation of E(k, n), k = onsets in the bar.
    evenness = 1 when the bar is exactly a Euclidean rhythm"""
    k, n = int(bar.sum()), len(bar)
    if k == 0:
        return None

    pattern = euclidean_rhythm(k, n)
    distances = [euclidean_distance(bar, np.roll(pattern, r)) for r in range(n)]
    rotation = int(np.argmin(distances))

    return {
        "k": k,
        "n": n,
        "pattern": pattern_text(bar),
        "euclidean": pattern_text(np.roll(pattern, rotation)),
        "distance": distances[rotation],
        "evenness": float(1 - distances[rotation] / np.sqrt(2 * k)),
    }


def bars_evenness(grid):
    bars = [nearest_euclidean(bar) for bar in split_bars(grid)]
    bars = [bar for bar in bars if bar is not None]
    mean = float(np.mean([bar["evenness"] for bar in bars])) if bars else None
    return bars, mean


""" Analysis """


def analyse(reference_execution, user_execution):
    reference_grid = to_grid(reference_execution["events"], reference_execution["BPM"])
    user_grid = to_grid(user_execution["events"], user_execution["BPM"])

    comparison = compare_grids(reference_grid, user_grid)
    reference_bars, reference_evenness = bars_evenness(reference_grid)
    user_bars, user_evenness = bars_evenness(user_grid)

    return {
        "execution": user_execution["execution"],
        "onsetCount": {
            "reference": len(reference_execution["events"]),
            "user": len(user_execution["events"]),
        },
        "BPM": {
            "reference": reference_execution["BPM"],
            "user": user_execution["BPM"],
            "difference": user_execution["BPM"] - reference_execution["BPM"],
        },
        "euclideanDistance": comparison["distance"],
        "similarity": comparison["similarity"],
        "shift": comparison["shift"],
        "evenness": {"reference": reference_evenness, "user": user_evenness},
        "bars": {"reference": reference_bars, "user": user_bars},
    }


if __name__ == "__main__":
    reference, user = load_datasets()

    clean_reference = [filter_events(item) for item in reference]
    clean_user = [filter_events(item) for item in user if item["events"]]

    for user_execution in clean_user:
        result = analyse(clean_reference[0], user_execution)
        print(
            f"Execução {result['execution']}: "
            f"onsets ref/user {result['onsetCount']['reference']}/{result['onsetCount']['user']} | "
            f"BPM diff {result['BPM']['difference']:+.1f} | "
            f"distância {result['euclideanDistance']:.2f} | "
            f"similaridade {result['similarity']:.2f} | "
            f"uniformidade ref/user {result['evenness']['reference']:.2f}/{result['evenness']['user']:.2f}"
        )
        for bar in result["bars"]["user"][:4]:
            print(f"    {bar['pattern']}  ~  {bar['euclidean']}  E({bar['k']},{bar['n']})  {bar['evenness']:.2f}")
