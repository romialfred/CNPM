#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

# Le dépôt interdit les répertoires de cache : importer pack_paths ne doit pas
# créer de __pycache__, que ce script signale lui-même comme une erreur.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pack_paths  # noqa: E402

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required: pip install pyyaml") from exc

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []
metrics: dict[str, int] = {}

required = [
    "README.md", "START_HERE.md", "CLAUDE.md", "AGENTS.md", "PLANS.md",
    "CONTRIBUTING.md", "SECURITY.md", "CHANGELOG.md", "NOTICE.md", "MANIFEST.md",
    "CLAUDE.local.md.example", ".env.example", ".editorconfig", ".gitignore", ".gitattributes",
    "docs/00-governance/final-validation-report.md",
    "MANIFEST_SHA256.txt", "docs/00-governance/file-inventory.csv",
    "docs/00-governance/reorganization-report.md", "docs/00-governance/duplicate-removal.csv",
    ".gitlab-ci.yml", ".nvmrc",
    ".claude/settings.json", "docs/00-governance/source-of-truth.md",
    "docs/00-governance/open-decisions.md",
    "docs/00-governance/implementation-readiness.md", "docs/00-governance/toolchain-validation.md",
    "docs/00-governance/root-markdown-placement.md",
    "docs/00-governance/source-preservation-audit.md",
    "docs/00-governance/final-structure.txt",
    "docs/00-sources/TDR_NTA_Digitalisation_Cotisations_CNPM.pdf",
    "docs/00-sources/Specifications_Fonctionnelles_CNPM_v1.1.docx",
    "docs/00-sources/Specifications_Fonctionnelles_CNPM_v1.1.pdf",
    "docs/00-sources/logo-CNPM.png",
    "docs/01-product/CNPM_Backlog_Traceabilite_Recette.xlsx",
    "docs/02-architecture/CNPM_DCTD_v1.0.docx",
    "docs/02-architecture/CNPM_DCTD_v1.0.pdf",
    "docs/03-data/CNPM_Dictionnaire_Donnees_PostgreSQL.xlsx",
    "docs/04-api/openapi.yaml", "docs/04-api/asyncapi.yaml",
    "docs/05-security/CNPM_RBAC_Matrice.xlsx",
    "backend/src/main/resources/db/migration/V1__create_schemas_and_tables.sql",
    "backend/src/main/resources/db/migration/V2__add_constraints_and_indexes.sql",
    "backend/src/main/resources/db/migration/V3__seed_roles_permissions_and_references.sql",
    "backend/src/main/resources/db/migration/V4__protect_append_only_tables.sql",
    "docs/ui-handoff/START_HERE.md",
    "docs/12-member-showcase/README.md", "docs/12-member-showcase/requirements.md",
    "docs/12-member-showcase/data-model.md", "docs/12-member-showcase/permissions.md",
    "docs/12-member-showcase/api-addendum.yaml", "docs/12-member-showcase/acceptance-tests.md",
    "docs/12-member-showcase/promotion-checklist.md",
    "docs/ui-handoff/design-tokens/tokens.source.json",
    "docs/ui-handoff/data/screen-inventory.json",
    "docs/ui-handoff/data/component-catalog.json",
    "docs/ui-handoff/assets/reference-screens/manifest.json",
    "web/src/styles/tokens.css", "web/src/app/ui-contracts/button.contract.ts",
    "web/playwright.config.ts", "web/package-lock.json", "web/package.ui-handoff.json", "web/.npmrc",
    "mobile/lib/design_system/cnpm_theme.dart",
]
for rel in required:
    target = ROOT / rel
    if not target.exists():
        errors.append(f"Missing {rel}")
    elif target.is_file() and target.stat().st_size == 0:
        errors.append(f"Empty file {rel}")

# Keep the repository root intentionally small and unambiguous for coding agents.
expected_root_markdown = {
    "AGENTS.md", "CHANGELOG.md", "CLAUDE.md", "CONTRIBUTING.md", "MANIFEST.md",
    "NOTICE.md", "PLANS.md", "README.md", "SECURITY.md", "START_HERE.md",
}
actual_root_markdown = {path.name for path in ROOT.glob("*.md") if path.is_file()}
if actual_root_markdown != expected_root_markdown:
    missing = sorted(expected_root_markdown - actual_root_markdown)
    unexpected = sorted(actual_root_markdown - expected_root_markdown)
    if missing:
        errors.append("Root Markdown files missing: " + ", ".join(missing))
    if unexpected:
        errors.append("Unexpected Markdown files at repository root: " + ", ".join(unexpected))

for name in ("CLAUDE.md", "AGENTS.md"):
    locations = sorted(path.relative_to(ROOT).as_posix() for path in ROOT.rglob(name))
    if locations != [name]:
        errors.append(f"Expected only root {name}, found: {locations}")

if len(required) != len(set(required)):
    errors.append("Duplicate entries in validator required-file list")

settings_path = ROOT / ".claude/settings.json"
if settings_path.exists():
    try:
        settings = json.loads(settings_path.read_text(encoding="utf-8"))
        if settings.get("$schema") != "https://json.schemastore.org/claude-code-settings.json":
            errors.append("Claude settings JSON schema declaration missing or incorrect")
        hook_args = (
            settings.get("hooks", {})
            .get("PreToolUse", [{}])[0]
            .get("hooks", [{}])[0]
            .get("args", [])
        )
        expected_hook = "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-command.py"
        if expected_hook not in hook_args:
            errors.append("Claude PreToolUse guard hook is not configured")
    except Exception as exc:
        errors.append(f"Invalid Claude settings structure: {exc}")

for forbidden in [
    "BRS", "Documents", "Maquettes", "Dossier Operatiionel",
    "Dossier de conception technique", "Specifications fonctionnelles",
    "CNPM_UI_UX_Handoff_v1.0", "deliverables",
    "docs/ui-handoff/repository-overlay",
    "docs/ui-handoff/docs/00-governance/source-material",
]:
    if (ROOT / forbidden).exists():
        errors.append(f"Obsolete or duplicated path still present: {forbidden}")

# Ce qui est proscrit, c'est de VERSIONNER un artefact généré — pas d'en avoir
# localement. `npm ci`, `mvn verify` et `flutter test`, tous prescrits par
# START_HERE.md, créent node_modules/, target/ et .dart_tool/ ; les signaler
# rendait le dépôt invalidable dès qu'on suivait ses propres instructions.
# On contrôle donc l'état versionné, en retombant sur une analyse du disque
# lorsque le pack est livré hors dépôt Git.
def versioned_files() -> set[str] | None:
    try:
        completed = subprocess.run(
            ["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    return {entry for entry in completed.stdout.decode("utf-8").split("\0") if entry}


TRACKED = versioned_files()


def is_versioned(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    if TRACKED is None:
        return pack_paths.included(path, ROOT)
    return rel in TRACKED


generated_directory_names = {"__pycache__", "node_modules", "target", "dist", "build", ".dart_tool"}
for path in ROOT.rglob("*"):
    if path.is_dir() and path.name in generated_directory_names:
        rel_dir = path.relative_to(ROOT).as_posix() + "/"
        if TRACKED is None or any(tracked.startswith(rel_dir) for tracked in TRACKED):
            errors.append(f"Generated or cache directory is versioned: {path.relative_to(ROOT)}")
    if not path.is_file() or not is_versioned(path):
        continue
    if path.suffix.lower() in {".pyc", ".pyo"}:
        errors.append(f"Python cache file present: {path.relative_to(ROOT)}")
    if path.suffix.lower() in {".zip", ".tar", ".gz", ".tgz", ".7z"}:
        errors.append(f"Nested archive present: {path.relative_to(ROOT)}")


# Verify the generated repository manifest against all versionable files.
manifest_path = ROOT / "MANIFEST_SHA256.txt"
if manifest_path.exists():
    manifest: dict[str, str] = {}
    for lineno, line in enumerate(manifest_path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            digest, rel = line.split("  ", 1)
        except ValueError:
            errors.append(f"Malformed manifest line {lineno}")
            continue
        manifest[rel] = digest

    expected: dict[str, str] = {}
    for path in ROOT.rglob("*"):
        if not pack_paths.included(path, ROOT):
            continue
        expected[path.relative_to(ROOT).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()

    missing_manifest = sorted(set(expected) - set(manifest))
    stale_manifest = sorted(set(manifest) - set(expected))
    mismatched_manifest = sorted(rel for rel in set(expected) & set(manifest) if expected[rel] != manifest[rel])
    if missing_manifest:
        errors.append("Manifest missing files: " + ", ".join(missing_manifest[:20]))
    if stale_manifest:
        errors.append("Manifest references absent files: " + ", ".join(stale_manifest[:20]))
    if mismatched_manifest:
        errors.append("Manifest checksum mismatch: " + ", ".join(mismatched_manifest[:20]))

for path in ROOT.rglob("*.json"):
    # TypeScript configuration files are JSONC and may legally contain comments.
    if path.name.startswith("tsconfig"):
        continue
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON {path.relative_to(ROOT)}: {exc}")

for path in [*ROOT.rglob("*.yaml"), *ROOT.rglob("*.yml")]:
    try:
        list(yaml.safe_load_all(path.read_text(encoding="utf-8")))
    except Exception as exc:
        errors.append(f"Invalid YAML {path.relative_to(ROOT)}: {exc}")

for path in ROOT.rglob("*.xml"):
    try:
        ET.parse(path)
    except Exception as exc:
        errors.append(f"Invalid XML {path.relative_to(ROOT)}: {exc}")

bpmn_files = sorted((ROOT / "docs/07-processes").glob("*.bpmn"))
for path in bpmn_files:
    try:
        tree = ET.parse(path)
        if not tree.getroot().tag.endswith("definitions"):
            warnings.append(f"Unexpected BPMN root element in {path.relative_to(ROOT)}")
    except Exception as exc:
        errors.append(f"Invalid BPMN XML {path.relative_to(ROOT)}: {exc}")
metrics["bpmn"] = len(bpmn_files)


def validate_ooxml(path: Path, expected_main: str) -> None:
    try:
        with zipfile.ZipFile(path) as archive:
            bad = archive.testzip()
            if bad:
                errors.append(f"Corrupt archive member {bad} in {path.relative_to(ROOT)}")
            names = set(archive.namelist())
            for member in {"[Content_Types].xml", "_rels/.rels", expected_main}:
                if member not in names:
                    errors.append(f"Missing {member} in {path.relative_to(ROOT)}")
    except Exception as exc:
        errors.append(f"Invalid OOXML archive {path.relative_to(ROOT)}: {exc}")

for path in ROOT.rglob("*.docx"):
    validate_ooxml(path, "word/document.xml")
for path in ROOT.rglob("*.xlsx"):
    validate_ooxml(path, "xl/workbook.xml")
for path in ROOT.rglob("*.pdf"):
    try:
        data = path.read_bytes()
        if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-4096:]:
            errors.append(f"Invalid PDF signature or EOF {path.relative_to(ROOT)}")
    except Exception as exc:
        errors.append(f"Unreadable PDF {path.relative_to(ROOT)}: {exc}")

for rel, limit in [("CLAUDE.md", 200), ("AGENTS.md", 220)]:
    lines = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    metrics[f"{rel}_lines"] = len(lines)
    if len(lines) > limit:
        errors.append(f"{rel} too long: {len(lines)} lines, limit {limit}")

migration_dir = ROOT / "backend/src/main/resources/db/migration"
versions: list[str] = []
for path in migration_dir.glob("V*__*.sql"):
    match = re.match(r"V([^_]+)__", path.name)
    if match:
        versions.append(match.group(1))
duplicates = [version for version, count in Counter(versions).items() if count > 1]
if duplicates:
    errors.append(f"Duplicate Flyway versions: {', '.join(duplicates)}")
if list((ROOT / "docs/03-data/migrations").glob("V*__*.sql")):
    errors.append("Executable migrations must not be duplicated under docs/03-data/migrations")

ci_files = [path for path in ROOT.rglob("*.gitlab-ci.yml")]
ci_files += [path for path in ROOT.rglob("gitlab-ci.yml")]
ci_rel = sorted({path.relative_to(ROOT).as_posix() for path in ci_files})
if ci_rel != [".gitlab-ci.yml"]:
    errors.append(f"Expected one root GitLab pipeline, found: {ci_rel}")

text_suffixes = {
    ".yaml", ".yml", ".json", ".md", ".xml", ".bpmn", ".sql",
    ".java", ".ts", ".scss", ".dart", ".sh", ".py", ".html",
}
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in text_suffixes:
        continue
    if path.resolve() == Path(__file__).resolve():
        continue
    # Les dépendances installées ne sont pas notre code : la documentation d'un
    # paquet npm peut légitimement contenir un exemple de clé, et le signaler
    # noyait le contrôle sous des faux positifs dès la première installation.
    if not is_versioned(path):
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    if re.search(r"image:\s*[^\s]+:latest\b", text):
        errors.append(f"Unpinned image in {path.relative_to(ROOT)}")
    if "BEGIN PRIVATE KEY" in text:
        errors.append(f"Private key in {path.relative_to(ROOT)}")

# Exact duplicates are rejected except for generated implementation copies.
allowed_duplicate_sets = {
    frozenset({
        "docs/ui-handoff/design-tokens/tokens.css",
        "web/src/styles/tokens.css",
    }),
    frozenset({
        "docs/ui-handoff/design-tokens/_tokens.scss",
        "web/src/styles/_tokens.scss",
    }),
    frozenset({
        "docs/ui-handoff/design-tokens/cnpm_theme.dart",
        "mobile/lib/design_system/cnpm_theme.dart",
    }),
    # Runners natifs générés par `flutter create`. Ces fichiers sont identiques
    # par construction dans le gabarit officiel Flutter : deux icônes de même
    # dimension effective, ou une configuration de build partagée entre variantes.
    # Les diverger manuellement casserait la régénération des runners.
    frozenset({
        "mobile/ios/Flutter/Debug.xcconfig",
        "mobile/ios/Flutter/Release.xcconfig",
    }),
    frozenset({
        "mobile/ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist",
        "mobile/ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist",
    }),
    frozenset({
        "mobile/ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings",
        "mobile/ios/Runner.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings",
    }),
    frozenset({
        "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png",
        "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png",
    }),
    frozenset({
        "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png",
        "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png",
    }),
    frozenset({
        "mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png",
        "mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png",
        "mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png",
    }),
    frozenset({
        "mobile/android/app/src/debug/AndroidManifest.xml",
        "mobile/android/app/src/profile/AndroidManifest.xml",
    }),
}
by_hash: dict[str, list[str]] = defaultdict(list)
for path in ROOT.rglob("*"):
    # Même règle d'inclusion que le manifeste : un artefact local ignoré par Git
    # (.env, .dart_tool, rapports) n'est pas un doublon versionné à signaler.
    if not pack_paths.included(path, ROOT):
        continue
    if path.name in {"MANIFEST.json", "MANIFEST.sha256"}:
        continue
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    by_hash[digest].append(path.relative_to(ROOT).as_posix())
for paths in by_hash.values():
    if len(paths) <= 1:
        continue
    path_set = frozenset(paths)
    if path_set not in allowed_duplicate_sets:
        errors.append("Unexpected exact duplicate files: " + ", ".join(sorted(paths)))

# Validate both the canonical OpenAPI contract and the R4 showcase addendum.
try:
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts/validate-openapi.py")],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        errors.append("OpenAPI validation failed:\n" + result.stdout + result.stderr)
    elif result.stdout.strip():
        print(result.stdout.strip())
except Exception as exc:
    errors.append(f"Unable to run OpenAPI validation: {exc}")


# Validate the integrated handoff using its own checks.
try:
    result = subprocess.run(
        [sys.executable, str(ROOT / "docs/ui-handoff/scripts/validate_handoff.py")],
        cwd=ROOT / "docs/ui-handoff",
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        errors.append("UI handoff validation failed:\n" + result.stdout + result.stderr)
    elif result.stdout.strip():
        print(result.stdout.strip())
except Exception as exc:
    errors.append(f"Unable to run UI handoff validation: {exc}")


def count_semicolon_rows(rel: str) -> int:
    with (ROOT / rel).open(encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.reader(stream, delimiter=";"))
    return max(0, len(rows) - 1)

metrics["backlog_rows"] = count_semicolon_rows("docs/01-product/product-backlog.csv")
metrics["test_catalog_rows"] = count_semicolon_rows("docs/09-testing/test-catalog.csv")
metrics["files"] = sum(1 for path in ROOT.rglob("*") if path.is_file())

if errors:
    for item in errors:
        print("ERROR:", item)
    for item in warnings:
        print("WARNING:", item)
    sys.exit(1)

print("Repository validation OK")
print(
    "Metrics: "
    f"files={metrics['files']}, claude_lines={metrics['CLAUDE.md_lines']}, "
    f"agents_lines={metrics['AGENTS.md_lines']}, bpmn={metrics['bpmn']}, "
    f"backlog_rows={metrics['backlog_rows']}, test_catalog_rows={metrics['test_catalog_rows']}"
)
for item in warnings:
    print("WARNING:", item)
