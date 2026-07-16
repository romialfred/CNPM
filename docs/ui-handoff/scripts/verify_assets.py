#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
import json, sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'assets/reference-screens/manifest.json').read_text())
errors=[]
for r in manifest:
    p=ROOT/'assets/reference-screens/full'/r['filename']
    try:
        im=Image.open(p); im.verify()
        if (r['width'],r['height']) != Image.open(p).size: errors.append(f'Size mismatch: {r["filename"]}')
    except Exception as e: errors.append(f'{r["filename"]}: {e}')
for e in errors: print('ERROR',e)
print(f'Checked {len(manifest)} reference assets')
if errors: sys.exit(1)
