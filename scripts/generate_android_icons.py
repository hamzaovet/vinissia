import os
from PIL import Image

logo_path = r"D:\Work\vinissia\public\logo.png"
res_path = r"D:\Work\vinissia\android\app\src\main\res"

if not os.path.exists(logo_path):
    print("Logo not found!")
    exit(1)

img = Image.open(logo_path).convert("RGBA")

# Mipmap densities & icon sizes
densities = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

for folder, (size, fg_size) in densities.items():
    folder_path = os.path.join(res_path, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # 1. Square icon
    sq = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    # resize logo maintaining aspect ratio with padding
    ratio = min((size * 0.85) / img.width, (size * 0.85) / img.height)
    new_w, new_h = int(img.width * ratio), int(img.height * ratio)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    pos = ((size - new_w) // 2, (size - new_h) // 2)
    sq.paste(resized, pos, resized)
    sq.save(os.path.join(folder_path, "ic_launcher.png"))
    
    # 2. Round icon
    sq.save(os.path.join(folder_path, "ic_launcher_round.png"))
    
    # 3. Foreground icon (centered with transparent bg)
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    fg_ratio = min((fg_size * 0.65) / img.width, (fg_size * 0.65) / img.height)
    new_fg_w, new_fg_h = int(img.width * fg_ratio), int(img.height * fg_ratio)
    resized_fg = img.resize((new_fg_w, new_fg_h), Image.Resampling.LANCZOS)
    fg_pos = ((fg_size - new_fg_w) // 2, (fg_size - new_fg_h) // 2)
    fg.paste(resized_fg, fg_pos, resized_fg)
    fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"))
    
    print(f"Generated icons for {folder}")

print("All Venice Android launcher icons generated successfully!")
