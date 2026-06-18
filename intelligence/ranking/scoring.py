from .config import RANKING_WEIGHTS
from .time_decay import apply_time_decay
from datetime import datetime

def calculate_engagement_score(post: dict) -> float:
    score = 0.0
    score += post.get('likes', 0) * RANKING_WEIGHTS['like_weight']
    score += post.get('comments', 0) * RANKING_WEIGHTS['comment_weight']
    score += post.get('bookmarks', 0) * RANKING_WEIGHTS['bookmark_weight']
    score += post.get('shares', 0) * RANKING_WEIGHTS['share_weight']
    score += post.get('views', 0) * RANKING_WEIGHTS['view_weight']
    return score

def calculate_final_ranking_score(post: dict, user_affinity: float = 1.0, interest_match: float = 0.5) -> float:
    """
    Computes the final personalized score for a post relative to a viewing user.
    """
    base_engagement = calculate_engagement_score(post)
    
    # Context multipliers
    affinity_multiplier = user_affinity * RANKING_WEIGHTS['follower_affinity_weight']
    interest_multiplier = interest_match * RANKING_WEIGHTS['interest_similarity_weight']
    reputation_multiplier = post.get('creator_reputation', 1.0) * RANKING_WEIGHTS['creator_reputation_weight']
    
    raw_score = base_engagement * affinity_multiplier * interest_multiplier * reputation_multiplier
    
    # Time decay
    created_at = post.get('created_at', datetime.utcnow())
    final_score = apply_time_decay(raw_score, created_at)
    
    return final_score
