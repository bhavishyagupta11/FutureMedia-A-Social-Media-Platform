def normalize_score(score: float, min_val: float, max_val: float) -> float:
    """Min-max normalization."""
    if max_val - min_val == 0:
        return 0.5
    normalized = (score - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, normalized))

def z_score_normalize(score: float, mean: float, std_dev: float) -> float:
    """Z-score normalization for outlier resistance."""
    if std_dev == 0:
        return 0.0
    return (score - mean) / std_dev
