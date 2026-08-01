import math
from datetime import datetime
from .config import TIME_DECAY_PARAMS

def apply_time_decay(base_score: float, created_at: datetime) -> float:
    """
    Applies an exponential time decay to the base engagement score.
    Uses HackerNews-inspired gravity decay model.
    """
    now = datetime.utcnow()
    age_in_hours = (now - created_at).total_seconds() / 3600
    
    if age_in_hours <= 0:
        return base_score
        
    gravity = TIME_DECAY_PARAMS["gravity"]
    decay_factor = math.pow((age_in_hours + 2), gravity)
    
    return base_score / decay_factor
