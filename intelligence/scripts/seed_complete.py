import json
from seed_users import generate_users
from seed_posts import generate_posts
from seed_graph import generate_graph

def run_seed(size_preset="1000"):
    sizes = {
        "100": 100,
        "1000": 1000,
        "10000": 10000
    }
    
    count = sizes.get(size_preset, 1000)
    print(f"Seeding dataset with {count} users...")
    
    users = generate_users(count)
    posts = generate_posts(users)
    graph = generate_graph(users)
    
    print(f"Generated {len(users)} users.")
    print(f"Generated {len(posts)} posts.")
    print(f"Generated {len(graph)} graph edges.")
    
    # Normally this would dump to MongoDB or CSV/Parquet. We'll just print for readiness.
    print("Dataset generation complete. Ready for ML pipelines.")

if __name__ == "__main__":
    run_seed("1000")
