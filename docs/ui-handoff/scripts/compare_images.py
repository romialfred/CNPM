#!/usr/bin/env python3
"""Simple deterministic image difference report. Requires Pillow only."""
from PIL import Image, ImageChops, ImageStat, ImageEnhance
from pathlib import Path
import argparse, json, math
ap=argparse.ArgumentParser()
ap.add_argument('reference'); ap.add_argument('actual'); ap.add_argument('--out',default='visual-diff')
a=ap.parse_args(); out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
ref=Image.open(a.reference).convert('RGB'); act=Image.open(a.actual).convert('RGB')
if ref.size!=act.size: act=act.resize(ref.size,Image.Resampling.LANCZOS)
diff=ImageChops.difference(ref,act)
stat=ImageStat.Stat(diff); rms=math.sqrt(sum(v*v for v in stat.rms)/3); extrema=diff.getextrema();
# Ratio of pixels with meaningful difference > 16 per channel
pix=diff.load(); changed=0; total=diff.width*diff.height
for y in range(diff.height):
    for x in range(diff.width):
        if max(pix[x,y])>16: changed+=1
ratio=changed/total
ref.save(out/'reference.png'); act.save(out/'actual.png'); ImageEnhance.Contrast(diff).enhance(3).save(out/'diff.png')
report={'reference':str(a.reference),'actual':str(a.actual),'size':ref.size,'rms':round(rms,3),'changedPixelRatio':round(ratio,6),'note':'Indicative only; Playwright baseline remains the CI gate.'}
(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
