from PIL import Image
import os

out_dir = "C:/Users/asobi/.gemini/antigravity/scratch/splendor-clone/public/cards"

jobs = [
    {
        "file": "C:/Users/asobi/.gemini/antigravity/brain/a53b4b23-32d5-4913-8d10-58678363520b/.user_uploaded/media_1789720335753.jpg",
        "level": 1,
        "cols": 8,
        "rows": 5,
        "colors": ["red", "black", "white", "blue", "green"],
        "top_margin": 77  # Precisely calculated from image edge analysis
    },
    {
        "file": "C:/Users/asobi/.gemini/antigravity/brain/a53b4b23-32d5-4913-8d10-58678363520b/.user_uploaded/media_1789720335756.jpg",
        "level": 3,
        "cols": 4,
        "rows": 5,
        "colors": ["red", "black", "white", "blue", "green"],
        "top_margin": 71
    },
    {
        "file": "C:/Users/asobi/.gemini/antigravity/brain/a53b4b23-32d5-4913-8d10-58678363520b/.user_uploaded/media_1789720335763.jpg",
        "level": 2,
        "cols": 6,
        "rows": 5,
        "colors": ["red", "black", "white", "green", "blue"],
        "top_margin": 79
    }
]

for job in jobs:
    img = Image.open(job["file"])
    w, h = img.size
    
    top_y = job["top_margin"]
    
    grid_w = w
    grid_h = h - top_y
    
    card_w = grid_w / job["cols"]
    card_h = grid_h / job["rows"]
    
    # Add an internal padding to crop out the ugly black gaps and neighboring card edges
    pad_x = 6
    pad_y = 8
    
    count = 0
    for r in range(job["rows"]):
        color = job["colors"][r]
        for c in range(job["cols"]):
            left = (c * card_w) + pad_x
            top = (top_y + r * card_h) + pad_y
            right = (left - pad_x + card_w) - pad_x
            bottom = (top - pad_y + card_h) - pad_y
            
            card_img = img.crop((left, top, right, bottom))
            card_img.save(f"{out_dir}/L{job['level']}_{color}_{c+1}.jpg")
            count += 1
    print(f"Level {job['level']} done. {count} cards saved with clean crop padding.")
