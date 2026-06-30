# Default Feed Ranking Configurations

RANKING_WEIGHTS = {
    "like_weight": 1.0,
    "comment_weight": 2.5,
    "bookmark_weight": 3.0,
    "share_weight": 4.0,
    "view_weight": 0.1,
    "creator_reputation_weight": 1.2,
    "follower_affinity_weight": 2.0,
    "interest_similarity_weight": 1.5,
    "popularity_weight": 0.8
}

TIME_DECAY_PARAMS = {
    "half_life_hours": 24, # Score halves every 24 hours
    "gravity": 1.8
}

NORMALIZATION_PARAMS = {
    "min_score": 0.0,
    "max_score": 1.0
}
