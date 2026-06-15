import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "--break-system-packages"])
    from PIL import Image

def resize_and_crop(image_path, target_width, target_height):
    img = Image.open(image_path)
    
    width_ratio = target_width / img.width
    height_ratio = target_height / img.height
    scale_factor = max(width_ratio, height_ratio)
    
    new_width = int(img.width * scale_factor)
    new_height = int(img.height * scale_factor)
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    left = (new_width - target_width) / 2
    top = (new_height - target_height) / 2
    right = (new_width + target_width) / 2
    bottom = (new_height + target_height) / 2
    
    img = img.crop((left, top, right, bottom))
    img.save(image_path)
    print(f"Resized {image_path} to {target_width}x{target_height}")

for path in sys.argv[1:]:
    resize_and_crop(path, 1600, 840)
