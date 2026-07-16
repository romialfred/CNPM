#!/usr/bin/env python3
"""Validate token source and remind maintainers to regenerate platform formats."""
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'design-tokens/tokens.source.json'
t=json.loads(p.read_text())
for key in ['color','font','space','radius','shadow','size','layout','breakpoint','motion']:
    if key not in t: raise SystemExit(f'Missing token group: {key}')
print('Token source valid. Generated files included: tokens.css, _tokens.scss, tokens.ts, cnpm_theme.dart, echarts-theme.json')
