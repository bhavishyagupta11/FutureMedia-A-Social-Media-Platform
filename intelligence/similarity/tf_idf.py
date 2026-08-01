from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class ContentSimilarityEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.tfidf_matrix = None
        self.post_ids = []
        
    def fit(self, posts_df: pd.DataFrame):
        """
        Expects DataFrame with 'post_id' and 'text_content' (caption + hashtags).
        """
        self.post_ids = posts_df['post_id'].tolist()
        self.tfidf_matrix = self.vectorizer.fit_transform(posts_df['text_content'])
        
    def get_similar_posts(self, query_text: str, top_n: int = 5) -> list:
        """Returns top_n similar post IDs based on cosine similarity."""
        if self.tfidf_matrix is None:
            return []
            
        query_vec = self.vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        # Get top N indices
        related_indices = similarities.argsort()[::-1][:top_n]
        
        results = []
        for idx in related_indices:
            if similarities[idx] > 0.1: # Threshold
                results.append({
                    "post_id": self.post_ids[idx],
                    "similarity_score": similarities[idx]
                })
        return results
