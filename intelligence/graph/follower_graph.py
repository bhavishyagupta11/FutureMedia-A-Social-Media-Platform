import networkx as nx

class SocialGraph:
    def __init__(self):
        self.G = nx.DiGraph()
        
    def build_from_dataframe(self, follows_df):
        """
        Expects a pandas DataFrame with 'follower_id' and 'followed_id'
        """
        edges = list(zip(follows_df['follower_id'], follows_df['followed_id']))
        self.G.add_edges_from(edges)
        
    def get_mutual_followers(self, user1: str, user2: str) -> set:
        """Find users that both user1 and user2 follow."""
        if user1 not in self.G or user2 not in self.G:
            return set()
        user1_follows = set(self.G.successors(user1))
        user2_follows = set(self.G.successors(user2))
        return user1_follows.intersection(user2_follows)

    def suggest_users_pagerank(self, top_n: int = 10) -> list:
        """Global PageRank-inspired creator ranking."""
        pr = nx.pagerank(self.G, alpha=0.85)
        sorted_pr = sorted(pr.items(), key=lambda x: x[1], reverse=True)
        return sorted_pr[:top_n]

    def get_people_you_may_know(self, user_id: str, max_depth: int = 2, top_n: int = 10) -> list:
        """
        Traverses the graph up to max_depth to find friends of friends.
        Ranks them by number of mutual connections.
        """
        if user_id not in self.G:
            return []
            
        follows = set(self.G.successors(user_id))
        candidates = {}
        
        for friend in follows:
            friends_of_friend = set(self.G.successors(friend))
            for candidate in friends_of_friend:
                if candidate != user_id and candidate not in follows:
                    candidates[candidate] = candidates.get(candidate, 0) + 1
                    
        # Sort by mutual connection count
        sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
        return sorted_candidates[:top_n]
