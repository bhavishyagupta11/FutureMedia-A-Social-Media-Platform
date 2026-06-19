import random

def generate_users(count=1000):
    personas = ['Heavy Creator', 'Casual User', 'Lurker', 'Influencer', 'Student', 'Developer']
    users = []
    for i in range(count):
        users.append({
            "user_id": f"u{i}",
            "persona": random.choice(personas),
            "engagement_score": random.uniform(0, 100)
        })
    return users

if __name__ == "__main__":
    print(f"Generated {len(generate_users())} users.")
