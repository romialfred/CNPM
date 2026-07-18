from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from PIL import Image

from compare_images import compare


class CompareImagesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.directory = Path(self.temporary_directory.name)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def image(self, filename: str, color: str) -> Path:
        path = self.directory / filename
        Image.new("RGB", (32, 24), color).save(path)
        return path

    def test_identical_images_score_ten(self) -> None:
        reference = self.image("reference.png", "#273481")
        actual = self.image("actual.png", "#273481")

        report, *_ = compare(reference, actual)

        self.assertEqual(report["visualFidelityScore"], 10.0)
        self.assertEqual(report["changedPixelRatio"], 0.0)

    def test_different_images_reduce_score(self) -> None:
        reference = self.image("reference.png", "#273481")
        actual = self.image("actual.png", "#E40C20")

        report, *_ = compare(reference, actual)

        self.assertLess(report["visualFidelityScore"], 9.8)
        self.assertEqual(report["changedPixelRatio"], 1.0)

    def test_authorized_mask_neutralizes_dynamic_region(self) -> None:
        reference = self.image("reference.png", "white")
        actual = self.image("actual.png", "white")
        changed = Image.open(actual)
        changed.paste(Image.new("RGB", (8, 8), "black"), (0, 0, 8, 8))
        changed.save(actual)

        unmasked, *_ = compare(reference, actual)
        masked, *_ = compare(reference, actual, masks=[(0, 0, 8, 8)])

        self.assertLess(unmasked["visualFidelityScore"], 10.0)
        self.assertEqual(masked["visualFidelityScore"], 10.0)


if __name__ == "__main__":
    unittest.main()
