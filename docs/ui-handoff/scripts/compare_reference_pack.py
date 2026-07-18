#!/usr/bin/env python3
"""Compare le pack de captures Web CNPM aux références directionnelles.

Le rapport agrégé rend les itérations de reprise reproductibles : un écran Web
référencé manquant, redimensionné ou sous le seuil demandé fait échouer la commande.
La comparaison complète les gates Playwright, axe, clavier et responsive ; elle ne
les remplace pas.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from compare_images import compare


SCRIPT_DIR = Path(__file__).resolve().parent
HANDOFF_DIR = SCRIPT_DIR.parent
REFERENCE_MAP = HANDOFF_DIR / "tests" / "visual" / "reference-map.json"
REFERENCE_ROOT = HANDOFF_DIR / "assets" / "reference-screens" / "full"
MOBILE_SCOPES = {"mobile://member"}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("capture_root", type=Path)
    parser.add_argument("--out", type=Path, default=Path("visual-diff"))
    parser.add_argument("--min-score", type=float, default=9.8)
    parser.add_argument(
        "--allow-missing",
        action="store_true",
        help="rapporte les captures Web absentes sans faire échouer le pack",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not 0 <= args.min_score <= 10:
        raise SystemExit("--min-score doit être compris entre 0 et 10")

    references = json.loads(REFERENCE_MAP.read_text(encoding="utf-8"))
    args.out.mkdir(parents=True, exist_ok=True)
    reports: list[dict[str, object]] = []
    missing: list[str] = []

    for screen_id, metadata in references.items():
        route = str(metadata["route"])
        if route in MOBILE_SCOPES:
            continue

        reference = HANDOFF_DIR / str(metadata["reference"])
        actual = args.capture_root / screen_id / "1672x941.png"
        if not actual.is_file():
            missing.append(screen_id)
            continue

        report, reference_image, actual_image, diff = compare(reference, actual)
        report["id"] = screen_id
        report["minimumScore"] = args.min_score
        report["passed"] = (
            float(report["visualFidelityScore"]) >= args.min_score
            and not bool(report["resizedActual"])
        )
        screen_output = args.out / screen_id
        screen_output.mkdir(parents=True, exist_ok=True)
        reference_image.save(screen_output / "reference.png")
        actual_image.save(screen_output / "actual.png")
        diff.save(screen_output / "diff.png")
        (screen_output / "report.json").write_text(
            json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        reports.append(report)

    scores = [float(report["visualFidelityScore"]) for report in reports]
    failing = [str(report["id"]) for report in reports if not report["passed"]]
    summary = {
        "captureRoot": str(args.capture_root),
        "minimumScore": args.min_score,
        "screenCount": len(reports),
        "averageScore": round(sum(scores) / len(scores), 4) if scores else None,
        "minimumObservedScore": round(min(scores), 4) if scores else None,
        "maximumObservedScore": round(max(scores), 4) if scores else None,
        "missing": missing,
        "failing": failing,
        "passed": not failing and (args.allow_missing or not missing),
        "screens": reports,
    }
    (args.out / "summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0 if summary["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
