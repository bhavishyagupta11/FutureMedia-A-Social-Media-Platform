import random
import datetime

def generate_posts(users, count_per_user=10):
    posts = []
    pid = 0
    categories = ['Tech', 'Design', 'Lifestyle', 'Gaming', 'Education']
    
    for u in users:
        # Lurkers post rarely
        if u['persona'] == 'Lurker':
            num_posts = random.randint(0, 2)
        elif u['persona'] == 'Influencer':
            num_posts = random.randint(20, 50)
        else:
            num_posts = random.randint(5, 15)
            
        for _ in range(num_posts):
            posts.append({
                "post_id": f"p{pid}",
                "user_id": u["user_id"],
                "category": random.choice(categories),
                "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 30))
            })
            pid += 1
            
    return posts

if __name__ == "__main__":
    print("Run via seed_complete.py")
