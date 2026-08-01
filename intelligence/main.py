from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from ranking.scoring import calculate_final_ranking_score
from similarity.tf_idf import ContentSimilarityEngine
from graph.follower_graph import SocialGraph

app = FastAPI(title="SocialLoop Intelligence Engine")

# In-memory instantiations (In production, these load from disk/joblib)
similarity_engine = ContentSimilarityEngine()
social_graph = SocialGraph()

class PostScoringRequest(BaseModel):
    posts: List[Dict[str, Any]]
    user_affinity: float = 1.0
    interest_match: float = 0.5

class SimilarityRequest(BaseModel):
    query_text: str
    top_n: int = 5

class GraphRequest(BaseModel):
    user_id: str
    top_n: int = 10

@app.get("/")
def health_check():
    return {"status": "SLIP Engine Running", "version": "1.0.0"}

@app.post("/ranking/feed")
def rank_feed(req: PostScoringRequest):
    """
    Takes an array of raw post metadata and returns them sorted by intelligent score.
    """
    scored_posts = []
    for p in req.posts:
        score = calculate_final_ranking_score(p, req.user_affinity, req.interest_match)
        scored_posts.append({"post_id": p.get("post_id"), "score": score})
        
    scored_posts.sort(key=lambda x: x["score"], reverse=True)
    return {"success": True, "ranked_feed": scored_posts}

@app.post("/recommendation/related-posts")
def get_related_posts(req: SimilarityRequest):
    """
    Requires the Similarity Engine to be fitted beforehand via a background job.
    """
    results = similarity_engine.get_similar_posts(req.query_text, req.top_n)
    return {"success": True, "data": results}

@app.post("/recommendation/pymk")
def get_people_you_may_know(req: GraphRequest):
    """
    Returns suggested users based on FoF traversal.
    """
    results = social_graph.get_people_you_may_know(req.user_id, top_n=req.top_n)
    return {"success": True, "data": results}
