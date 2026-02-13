import os
import json

# Use current working directory
base_path = os.getcwd()
assets_path = os.path.join(base_path, 'assets')
output_file = os.path.join(base_path, 'gallery_data.js')

all_assets = []

for root, dirs, files in os.walk(assets_path):
    for file in files:
        if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.pdf')):
            if '.DS_Store' in file:
                continue
            
            # Get relative path starting from 'assets'
            # We want "assets/..." format
            # os.path.relpath(full_path, start=base_path)
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, base_path)
            all_assets.append(rel_path)

# Sort for consistency
all_assets.sort()

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('const galleryAssets = ')
    f.write(json.dumps(all_assets, indent=2, ensure_ascii=False))
    f.write(';')

print(f"Updated {output_file} with {len(all_assets)} assets.")
