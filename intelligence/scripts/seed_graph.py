import random

def generate_graph(users):
    """Generates a DataFrame-like structure of follows"""
    follows = []
    user_ids = [u['user_id'] for u in users]
    
    for u in users:
        if u['persona'] == 'Influencer':
            # Influencers follow few, followed by many (handled naturally by others following them)
            num_following = random.randint(10, 50)
        elif u['persona'] == 'Lurker':
            num_following = random.randint(50, 300)
        else:
            num_following = random.randint(30, 100)
            
        following_ids = random.sample(user_ids, min(num_following, len(user_ids)))
        for f_id in following_ids:
            if f_id != u['user_id']:
                follows.append({"follower_id": u['user_id'], "followed_id": f_id})
                
    return follows
