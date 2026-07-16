#!/usr/bin/env python3
from pathlib import Path
import hashlib
import json
import re
import sys
import urllib.parse
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parents[1]
errors: list[str] = []
warnings: list[str] = []


def require(path: str) -> Path:
    target = ROOT / path
    if not target.exists():
        errors.append(f"Missing: {path}")
    elif target.is_file() and target.stat().st_size == 0:
        errors.append(f"Empty: {path}")
    return target


required = [
    "README.md", "START_HERE.md", "VERSION", "handoff.config.json",
    "RELEASE_NOTES.md", "VALIDATION_REPORT.md",
    "design-tokens/tokens.source.json", "design-tokens/tokens.css",
    "design-tokens/_tokens.scss", "design-tokens/tokens.ts",
    "design-tokens/cnpm_theme.dart", "data/screen-inventory.json",
    "data/screen-inventory.schema.json", "data/component-catalog.json",
    "data/demo-fixtures.json", "data/member-showcase.schema.json",
    "data/member-showcase-sample.json", "data/open-decisions.json",
    "data/viewports.json", "docs/00-governance/source-of-truth.md",
    "docs/01-foundations/design-principles.md",
    "docs/02-components/component-catalog.md",
    "docs/03-patterns/responsive-behavior.md",
    "docs/04-screens/screen-inventory.md",
    "docs/06-accessibility/accessibility-requirements.md",
    "docs/08-quality/visual-regression.md",
    "assets/reference-screens/manifest.json", "assets/brand/README.md",
    "prototype/index.html", "guide/CNPM_UI_UX_Handoff_Guide_v1.0.docx",
    "guide/CNPM_UI_UX_Handoff_Guide_v1.0.pdf",
    "validation/guide-docx-a11y.json", "validation/guide-pdf-preflight.txt",
    "workbooks/CNPM_UI_UX_Handoff_Matrix.xlsx",
]
for item in required:
    require(item)

for rel in [
    "CLAUDE.md", "AGENTS.md", ".claude/rules/ux-ui.md",
    ".claude/rules/accessibility.md", ".claude/rules/visual-regression.md",
    ".claude/rules/member-showcase.md", "web/src/styles/tokens.css",
    "mobile/lib/design_system/cnpm_theme.dart",
]:
    target = PROJECT_ROOT / rel
    if not target.exists():
        errors.append(f"Integrated repository file missing: {rel}")

if (ROOT / "repository-overlay").exists():
    errors.append("repository-overlay must not remain after integration")
if (ROOT / "docs/00-governance/source-material").exists():
    errors.append("duplicated source-material must not remain in the integrated handoff")

version_path = require("VERSION")
version = version_path.read_text(encoding="utf-8").strip() if version_path.exists() else ""
try:
    cfg = json.loads(require("handoff.config.json").read_text(encoding="utf-8"))
    if cfg.get("package", {}).get("version") != version:
        errors.append("handoff.config.json version does not match VERSION")
    if "repositoryOverlay" in cfg.get("paths", {}):
        errors.append("handoff.config.json still references repositoryOverlay")
except Exception as exc:
    errors.append(f"Handoff config invalid: {exc}")

try:
    screens = json.loads(require("data/screen-inventory.json").read_text(encoding="utf-8"))
    ids = [item["id"] for item in screens]
    if len(screens) != 101:
        errors.append(f"Expected 101 screens, got {len(screens)}")
    if len(ids) != len(set(ids)):
        errors.append("Duplicate screen IDs")
    for item in screens:
        if not re.match(r"^(PUB|AUTH|BO|MP|MOB)-\d{3}$", item["id"]):
            errors.append(f"Invalid screen ID {item['id']}")
        if item.get("priority") not in {"P0", "P1", "P2"}:
            errors.append(f"Invalid screen priority: {item.get('id')}")
except Exception as exc:
    screens = []
    errors.append(f"Screen inventory invalid: {exc}")

try:
    components = json.loads(require("data/component-catalog.json").read_text(encoding="utf-8"))
    ids = [item["id"] for item in components]
    if len(components) < 65:
        errors.append(f"Expected at least 65 components, got {len(components)}")
    if len(ids) != len(set(ids)):
        errors.append("Duplicate component IDs")
except Exception as exc:
    components = []
    errors.append(f"Component catalog invalid: {exc}")

try:
    refs = json.loads(require("assets/reference-screens/manifest.json").read_text(encoding="utf-8"))
    if len(refs) != 14:
        errors.append(f"Expected 14 reference images, got {len(refs)}")
    for ref in refs:
        full = require(f"assets/reference-screens/full/{ref['filename']}")
        require(f"assets/reference-screens/thumbnails/{ref['filename']}")
        if full.exists() and hashlib.sha256(full.read_bytes()).hexdigest() != ref["sha256"]:
            errors.append(f"Checksum mismatch: {ref['filename']}")
except Exception as exc:
    refs = []
    errors.append(f"Reference manifest invalid: {exc}")

ref_specs = list((ROOT / "docs/04-screens/reference-specs").glob("ref-*.md"))
if len(ref_specs) != 14:
    errors.append(f"Expected 14 visual reference specs, got {len(ref_specs)}")

link_pattern = re.compile(r"!?(?:\[[^\]]*\])\(([^)]+)\)")
for md in ROOT.rglob("*.md"):
    text = md.read_text(encoding="utf-8", errors="ignore")
    for match in link_pattern.finditer(text):
        target = match.group(1).strip().split()[0].strip("<>")
        if not target or target.startswith(("#", "http://", "https://", "mailto:", "tel:")):
            continue
        target = urllib.parse.unquote(target.split("#", 1)[0])
        if target and not (md.parent / target).resolve().exists():
            errors.append(f"Broken Markdown link in {md.relative_to(ROOT)}: {target}")

for office in [
    "guide/CNPM_UI_UX_Handoff_Guide_v1.0.docx",
    "workbooks/CNPM_UI_UX_Handoff_Matrix.xlsx",
]:
    target = ROOT / office
    if target.exists():
        try:
            with zipfile.ZipFile(target) as archive:
                bad = archive.testzip()
                if bad:
                    errors.append(f"Corrupt Office archive {office}: {bad}")
        except Exception as exc:
            errors.append(f"Cannot open Office archive {office}: {exc}")

font_extensions = {".ttf", ".otf", ".woff", ".woff2", ".eot"}
for item in ROOT.rglob("*"):
    if item.is_file() and item.suffix.lower() in font_extensions:
        errors.append(f"Font file must not be included: {item.relative_to(ROOT)}")

brand_files = [item.name for item in (ROOT / "assets/brand").iterdir() if item.is_file()]
if brand_files != ["README.md"]:
    warnings.append(f"Unexpected brand files present: {brand_files}")

ignored_parts = {"__pycache__", ".git", ".idea", ".vscode"}
count = sum(
    1 for item in ROOT.rglob("*")
    if item.is_file() and not any(part in ignored_parts for part in item.relative_to(ROOT).parts)
)
print(
    "CNPM UI/UX Handoff validation: "
    f"files={count}, screens={len(screens)}, components={len(components)}, references={len(refs)}"
)
for item in warnings:
    print("WARNING:", item)
for item in errors:
    print("ERROR:", item)
if errors:
    sys.exit(1)
print("VALIDATION OK")
