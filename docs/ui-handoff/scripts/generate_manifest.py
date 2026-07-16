#!/usr/bin/env python3
from pathlib import Path
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
IGNORE_NAMES={'MANIFEST.sha256','MANIFEST.json','.DS_Store','Thumbs.db'}
IGNORE_SUFFIXES={'.pyc','.pyo'}
IGNORE_PARTS={'__pycache__','.git','.idea','.vscode'}


def included(p: Path) -> bool:
    if not p.is_file():
        return False
    rel=p.relative_to(ROOT)
    if p.name in IGNORE_NAMES or p.suffix.lower() in IGNORE_SUFFIXES:
        return False
    if any(part in IGNORE_PARTS for part in rel.parts):
        return False
    return True

rows=[]
for p in sorted(ROOT.rglob('*')):
    if included(p):
        rel=p.relative_to(ROOT).as_posix()
        rows.append({'path':rel,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'MANIFEST.json').write_text(json.dumps({'version':(ROOT/'VERSION').read_text().strip(),'files':rows},indent=2),encoding='utf-8')
(ROOT/'MANIFEST.sha256').write_text('\n'.join(f"{r['sha256']}  {r['path']}" for r in rows)+'\n',encoding='utf-8')
print(f'Generated manifest for {len(rows)} files')
