#!/usr/bin/env python3
"""Compare une capture CNPM à sa référence et produit une note sur 10.

Le calcul reste volontairement déterministe et ne dépend que de Pillow. La note
combine fidélité pixel, structure des contours, distribution colorimétrique et
proportion de pixels significativement différents. Elle complète, sans les
remplacer, la revue UX, les tests fonctionnels et les contrôles d'accessibilité.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageStat


MEANINGFUL_CHANNEL_DIFFERENCE = 16


def parse_mask(value: str) -> tuple[int, int, int, int]:
    """Parse un masque ``x,y,largeur,hauteur`` avec des valeurs positives."""

    try:
        x, y, width, height = (int(part.strip()) for part in value.split(","))
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError(
            "un masque doit suivre le format x,y,largeur,hauteur"
        ) from exc
    if min(x, y) < 0 or width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError(
            "les coordonnées doivent être positives et les dimensions strictement positives"
        )
    return x, y, width, height


def normalized_rms_difference(reference: Image.Image, actual: Image.Image) -> float:
    diff = ImageChops.difference(reference, actual)
    channel_rms = ImageStat.Stat(diff).rms
    rms = math.sqrt(sum(value * value for value in channel_rms) / len(channel_rms))
    return min(1.0, rms / 255.0)


def meaningful_changed_ratio(diff: Image.Image) -> float:
    flattened = getattr(diff, "get_flattened_data", None)
    pixels = flattened() if flattened is not None else diff.getdata()
    changed = sum(
        1 for pixel in pixels if max(pixel) > MEANINGFUL_CHANNEL_DIFFERENCE
    )
    return changed / (diff.width * diff.height)


def histogram_similarity(reference: Image.Image, actual: Image.Image) -> float:
    reference_histogram = reference.histogram()
    actual_histogram = actual.histogram()
    sample_count = reference.width * reference.height * len(reference.getbands())
    distance = sum(
        abs(reference_value - actual_value)
        for reference_value, actual_value in zip(
            reference_histogram, actual_histogram, strict=True
        )
    )
    return max(0.0, 1.0 - distance / (2 * sample_count))


def apply_masks(
    reference: Image.Image,
    actual: Image.Image,
    masks: Iterable[tuple[int, int, int, int]],
) -> None:
    """Neutralise de petites régions dynamiques dans les deux images."""

    for x, y, width, height in masks:
        right = min(reference.width, x + width)
        bottom = min(reference.height, y + height)
        if x >= right or y >= bottom:
            continue
        neutral = Image.new("RGB", (right - x, bottom - y), "white")
        reference.paste(neutral, (x, y, right, bottom))
        actual.paste(neutral, (x, y, right, bottom))


def compare(
    reference_path: Path,
    actual_path: Path,
    masks: Iterable[tuple[int, int, int, int]] = (),
) -> tuple[dict[str, object], Image.Image, Image.Image, Image.Image]:
    reference = Image.open(reference_path).convert("RGB")
    actual = Image.open(actual_path).convert("RGB")
    original_actual_size = actual.size
    resized_actual = reference.size != actual.size
    if resized_actual:
        actual = actual.resize(reference.size, Image.Resampling.LANCZOS)

    reference_for_score = reference.copy()
    actual_for_score = actual.copy()
    masks = tuple(masks)
    apply_masks(reference_for_score, actual_for_score, masks)

    diff = ImageChops.difference(reference_for_score, actual_for_score)
    rms_difference = normalized_rms_difference(reference_for_score, actual_for_score)
    changed_ratio = meaningful_changed_ratio(diff)

    reference_edges = reference_for_score.convert("L").filter(ImageFilter.FIND_EDGES)
    actual_edges = actual_for_score.convert("L").filter(ImageFilter.FIND_EDGES)
    edge_difference = normalized_rms_difference(reference_edges, actual_edges)
    color_similarity = histogram_similarity(reference_for_score, actual_for_score)

    pixel_similarity = 1.0 - rms_difference
    changed_similarity = 1.0 - changed_ratio
    structure_similarity = 1.0 - edge_difference
    fidelity = 10.0 * (
        0.45 * pixel_similarity
        + 0.25 * changed_similarity
        + 0.20 * structure_similarity
        + 0.10 * color_similarity
    )

    report: dict[str, object] = {
        "reference": str(reference_path),
        "actual": str(actual_path),
        "referenceSize": list(reference.size),
        "originalActualSize": list(original_actual_size),
        "resizedActual": resized_actual,
        "rms": round(rms_difference * 255.0, 3),
        "changedPixelRatio": round(changed_ratio, 6),
        "similarities": {
            "pixel": round(pixel_similarity, 6),
            "meaningfulPixels": round(changed_similarity, 6),
            "structure": round(structure_similarity, 6),
            "colorDistribution": round(color_similarity, 6),
        },
        "visualFidelityScore": round(fidelity, 4),
        "scoreScale": 10,
        "masks": [list(mask) for mask in masks],
        "note": (
            "Gate automatique indicatif. La fiche écran, la revue UX, Playwright, "
            "axe et les parcours fonctionnels restent obligatoires."
        ),
    }
    return report, reference, actual, diff


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("reference", type=Path)
    parser.add_argument("actual", type=Path)
    parser.add_argument("--out", type=Path, default=Path("visual-diff"))
    parser.add_argument(
        "--min-score",
        type=float,
        default=None,
        help="échoue si la note de fidélité sur 10 est inférieure à ce seuil",
    )
    parser.add_argument(
        "--mask",
        action="append",
        default=[],
        type=parse_mask,
        metavar="X,Y,LARGEUR,HAUTEUR",
        help="neutralise une petite zone réellement dynamique ; option répétable",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.min_score is not None and not 0 <= args.min_score <= 10:
        raise SystemExit("--min-score doit être compris entre 0 et 10")

    report, reference, actual, diff = compare(
        args.reference, args.actual, masks=args.mask
    )
    args.out.mkdir(parents=True, exist_ok=True)
    reference.save(args.out / "reference.png")
    actual.save(args.out / "actual.png")
    ImageEnhance.Contrast(diff).enhance(3).save(args.out / "diff.png")

    score = float(report["visualFidelityScore"])
    passed = args.min_score is None or score >= args.min_score
    report["minimumScore"] = args.min_score
    report["passed"] = passed
    (args.out / "report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
