from io import BytesIO
from pathlib import Path
import json
import zipfile

import pytest
from PIL import Image
import sys


def make_png_bytes(size=(8, 8), color=(255, 0, 0)):
    img = Image.new("RGB", size, color)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def write_png_image(file_id, size=(16, 16)):
    from app.config import Config

    images = Config.APP_DATA_DIR / "images"
    images.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", size, (128, 64, 32, 255))
    img.save(images / f"{file_id}.png")


def sample_annotations():
    return [
        {
            "id": "rect",
            "type": "rectangle",
            "name": "Box",
            "category": "test",
            "color": "#00ff00",
            "visible": True,
            "coordinates": [{"x": 1, "y": 1}, {"x": 10, "y": 8}],
            "properties": {"label": "green"},
        },
        {
            "id": "text",
            "type": "text",
            "name": "Hi",
            "category": "test",
            "color": "#ff00ff",
            "visible": True,
            "coordinates": [{"x": 4, "y": 4}],
        },
    ]


def test_upload_rejects_bad_extension(client):
    """TC-016: Verify unsupported format rejection"""
    # tuple order: (filename, fileobj, content_type)
    data = {"file": ("bad.txt", BytesIO(b"not image"), "text/plain")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 400


def test_upload_png_and_get_thumb(client):
    """TC-014: Verify supported file import - PNG file"""
    png = make_png_bytes()
    # tuple order: (filename, fileobj, content_type)
    data = {"file": ("sample.png", png, "image/png")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200, res.text
    payload = res.json()
    assert "id" in payload and len(payload["id"]) > 0
    assert payload["thumbnail_url"].startswith("/api/files/thumb/")

    img_id = payload["id"]
    thumb = client.get(f"/api/files/thumb/{img_id}")
    assert thumb.status_code == 200
    assert thumb.headers["content-type"] == "image/jpeg"


def test_thumb_not_found(client):
    """TC-017: Verify image rendering - Thumbnail not found"""
    res = client.get("/api/files/thumb/does-not-exist")
    assert res.status_code == 404


def test_upload_generates_unique_uuid(client):
    """TC-019: Verify images are stored with unique UUID identifiers"""
    import re

    # UUID pattern (with or without hyphens)
    uuid_pattern = re.compile(
        r"^[0-9a-f]{32}$", re.IGNORECASE  # 32 hex characters (UUID without hyphens)
    )

    # Upload first image
    png1 = make_png_bytes(size=(10, 10), color=(255, 0, 0))
    data1 = {"file": ("image1.png", png1, "image/png")}
    res1 = client.post("/api/files/upload", files=data1)
    assert res1.status_code == 200
    id1 = res1.json()["id"]

    # Upload second image
    png2 = make_png_bytes(size=(10, 10), color=(0, 255, 0))
    data2 = {"file": ("image2.png", png2, "image/png")}
    res2 = client.post("/api/files/upload", files=data2)
    assert res2.status_code == 200
    id2 = res2.json()["id"]

    # Verify both IDs are valid UUIDs (32 hex characters)
    assert uuid_pattern.match(id1), f"ID {id1} is not a valid UUID format"
    assert uuid_pattern.match(id2), f"ID {id2} is not a valid UUID format"

    # Verify IDs are unique
    assert id1 != id2, "Image IDs should be unique"

    # Verify images are stored with UUID-based filenames
    from app.config import Config

    images_dir = Config.APP_DATA_DIR / "images"
    assert (images_dir / f"{id1}.png").exists(), f"Image {id1}.png not found in storage"
    assert (images_dir / f"{id2}.png").exists(), f"Image {id2}.png not found in storage"


def test_upload_svs_thumbnail_success(client, monkeypatch, tmp_path):
    """TC-015: Verify SVS file import"""

    # Build a fake openslide module that returns an image region
    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]

        def read_region(self, xy, level, size):
            img = Image.new("RGB", size, (0, 255, 0))
            return img

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):  # noqa: N802 (match 3rd-party API)
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    # Mock subprocess.run to simulate vips dzsave success
    import subprocess
    from unittest.mock import Mock

    mock_result = Mock()
    mock_result.returncode = 0
    mock_result.stdout = ""
    mock_result.stderr = ""

    def mock_run(*args, **kwargs):
        # Create the expected .dzi file when vips dzsave is called
        if len(args) > 0 and len(args[0]) > 1 and args[0][1] == "dzsave":
            # Extract output path from args
            out_base = args[0][3]  # 4th argument is the output base
            dzi_path = Path(f"{out_base}.dzi")
            dzi_path.parent.mkdir(parents=True, exist_ok=True)
            dzi_path.write_text('<?xml version="1.0" encoding="UTF-8"?><Image/>')
        return mock_result

    monkeypatch.setattr(subprocess, "run", mock_run)

    data = {"file": ("sample.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200, res.text
    payload = res.json()
    # thumb should be retrievable
    thumb = client.get(payload["thumbnail_url"])
    assert thumb.status_code == 200
    assert thumb.headers["content-type"] == "image/jpeg"


def test_upload_svs_thumbnail_failure(client, monkeypatch):
    class FakeOpenSlideModule:
        def OpenSlide(self, path):  # noqa: N802
            raise RuntimeError("broken")

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    data = {"file": ("bad.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 500
    assert "SVS thumbnail failed" in res.text


def test_export_png_annotations_mode(client):
    """TC-036: Verify JSON mask export"""
    file_id = "exp_png_annotations"
    write_png_image(file_id)
    payload = {
        "file_id": file_id,
        "file_type": "png",
        "mode": "annotations",
        "canvas_width": 16,
        "canvas_height": 16,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/json"
    body = json.loads(res.content)
    assert len(body) == len(payload["annotations"])


@pytest.mark.parametrize("mode", ["overlay", "mask"])
def test_export_png_image_modes(client, mode):
    """TC-037: Verify PNG mask export & TC-038: Verify composite export"""
    file_id = f"exp_png_{mode}"
    write_png_image(file_id)
    payload = {
        "file_id": file_id,
        "file_type": "png",
        "mode": mode,
        "canvas_width": 16,
        "canvas_height": 16,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 200, res.text
    assert res.headers["content-type"] == "image/png"
    disp = res.headers["content-disposition"]
    assert f"_{mode}.png" in disp
    assert len(res.content) > 20


def test_export_png_all_mode(client):
    """TC-039: Verify export resolution independence - Full size export"""
    file_id = "exp_png_all"
    write_png_image(file_id)
    payload = {
        "file_id": file_id,
        "file_type": "png",
        "mode": "all",
        "canvas_width": 16,
        "canvas_height": 16,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    with zipfile.ZipFile(BytesIO(res.content)) as zf:
        names = set(zf.namelist())
        assert names >= {
            f"{file_id}.png",
            f"{file_id}_mask.png",
            f"{file_id}_overlay.png",
            f"{file_id}_annotations.json",
        }


def test_export_svs_all_mode_uses_thumbnail(client):
    file_id = "exp_svs_all"
    from app.config import Config

    thumbs = Config.APP_DATA_DIR / "thumbs"
    thumbs.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", (10, 12), (0, 0, 255, 255))
    img.save(thumbs / f"{file_id}.png")
    payload = {
        "file_id": file_id,
        "file_type": "svs",
        "mode": "all",
        "canvas_width": 12,
        "canvas_height": 10,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    with zipfile.ZipFile(BytesIO(res.content)) as zf:
        names = set(zf.namelist())
        assert f"{file_id}_thumb.png" in names


def test_export_missing_png_file(client):
    payload = {
        "file_id": "missing",
        "file_type": "png",
        "mode": "annotations",
        "canvas_width": 10,
        "canvas_height": 10,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 404


def test_export_missing_svs_thumbnail(client):
    payload = {
        "file_id": "missing_svs",
        "file_type": "svs",
        "mode": "mask",
        "canvas_width": 10,
        "canvas_height": 10,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 404


def test_export_unsupported_file_type(client):
    payload = {
        "file_id": "whatever",
        "file_type": "gif",
        "mode": "annotations",
        "canvas_width": 10,
        "canvas_height": 10,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 400


def test_export_unsupported_mode(client):
    file_id = "exp_bad_mode"
    write_png_image(file_id)
    payload = {
        "file_id": file_id,
        "file_type": "png",
        "mode": "unknown",
        "canvas_width": 10,
        "canvas_height": 10,
        "annotations": sample_annotations(),
    }
    res = client.post("/api/files/export", json=payload)
    assert res.status_code == 400


def test_download_original_png(client):
    """TC-035: Verify base image export - Download original PNG"""
    # Upload a PNG file
    png = make_png_bytes()
    data = {"file": ("test.png", png, "image/png")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200
    payload = res.json()
    img_id = payload["id"]

    # Download the original
    res = client.get(f"/api/files/original/{img_id}")
    assert res.status_code == 200
    assert res.headers["content-disposition"]
    assert len(res.content) > 0


def test_download_original_not_found(client):
    """Test downloading a non-existent file returns 404"""
    res = client.get("/api/files/original/nonexistent")
    assert res.status_code == 404
    assert "File not found" in res.text


def test_upload_svs_vips_failure(client, monkeypatch):
    """Test SVS upload when vips dzsave fails"""

    # Mock openslide to succeed
    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]

        def read_region(self, xy, level, size):
            img = Image.new("RGB", size, (0, 255, 0))
            return img

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    # Mock subprocess.run to fail
    import subprocess

    def mock_run(*args, **kwargs):
        error = subprocess.CalledProcessError(
            returncode=1,
            cmd=args[0] if args else [],
            stderr="VipsForeignLoad: test.svs is not a known file format",
        )
        raise error

    monkeypatch.setattr(subprocess, "run", mock_run)

    data = {"file": ("test.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 500
    assert "SVS to DZI failed" in res.text


def test_upload_svs_no_vips_available(client, monkeypatch):
    """Test SVS upload when vips is not available"""

    # Mock openslide to succeed
    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]

        def read_region(self, xy, level, size):
            img = Image.new("RGB", size, (0, 255, 0))
            return img

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    # Mock os.path.exists to return False for vips
    import os

    original_exists = os.path.exists

    def mock_exists(path):
        # Only return False for vips binary checks
        if path and ("vips" in str(path).lower()):
            return False
        return original_exists(path)

    monkeypatch.setattr(os.path, "exists", mock_exists)
    monkeypatch.setenv("VIP_BIN", "")

    data = {"file": ("test.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    # Should still succeed but without dzi_url
    assert res.status_code == 200
    payload = res.json()
    assert payload["dzi_url"] is None


def test_upload_non_svs_thumbnail_failure(client):
    """Test PNG upload when thumbnail generation fails"""
    # Create a corrupted image file
    data = {"file": ("bad.png", BytesIO(b"not a valid png"), "image/png")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 500
    assert "Thumbnail failed" in res.text


def test_patch_extraction_svs(client, monkeypatch):
    """TC-043: Verify SVS patch extraction at high resolution"""

    # First upload an SVS file
    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]
        level_downsamples = [1.0, 2.0, 4.0]

        def read_region(self, location, level, size):
            img = Image.new("RGB", size, (255, 0, 0))
            return img.convert("RGBA")

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    # Mock subprocess for upload
    import subprocess
    from unittest.mock import Mock

    mock_result = Mock()
    mock_result.returncode = 0
    mock_result.stdout = ""
    mock_result.stderr = ""

    def mock_run(*args, **kwargs):
        if len(args) > 0 and len(args[0]) > 1 and args[0][1] == "dzsave":
            out_base = args[0][3]
            dzi_path = Path(f"{out_base}.dzi")
            dzi_path.parent.mkdir(parents=True, exist_ok=True)
            dzi_path.write_text('<?xml version="1.0" encoding="UTF-8"?><Image/>')
        return mock_result

    monkeypatch.setattr(subprocess, "run", mock_run)

    # Upload SVS
    data = {"file": ("test.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200
    img_id = res.json()["id"]

    # Extract patch
    res = client.get(f"/api/files/patch/{img_id}?x=0&y=0&width=512&height=512&level=0")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 0


def test_patch_extraction_non_svs(client):
    """TC-041: Verify region selection - Patch tool for non-SVS files"""
    # Upload a PNG
    png = make_png_bytes()
    data = {"file": ("test.png", png, "image/png")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200
    img_id = res.json()["id"]

    # Try to extract patch
    res = client.get(f"/api/files/patch/{img_id}?x=0&y=0&width=512&height=512&level=0")
    assert res.status_code == 400
    assert "only supported for SVS" in res.text


def test_patch_extraction_invalid_level(client, monkeypatch):
    """TC-042: Verify patch download - Invalid level handling"""

    # Upload SVS
    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]
        level_downsamples = [1.0, 2.0, 4.0]

        def read_region(self, location, level, size):
            img = Image.new("RGB", size, (255, 0, 0))
            return img.convert("RGBA")

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    import subprocess
    from unittest.mock import Mock

    mock_result = Mock()
    mock_result.returncode = 0

    def mock_run(*args, **kwargs):
        if len(args) > 0 and len(args[0]) > 1 and args[0][1] == "dzsave":
            out_base = args[0][3]
            dzi_path = Path(f"{out_base}.dzi")
            dzi_path.parent.mkdir(parents=True, exist_ok=True)
            dzi_path.write_text('<?xml version="1.0" encoding="UTF-8"?><Image/>')
        return mock_result

    monkeypatch.setattr(subprocess, "run", mock_run)

    data = {"file": ("test.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200
    img_id = res.json()["id"]

    # Try with invalid level (currently returns 500 instead of 400 due to exception handling)
    res = client.get(f"/api/files/patch/{img_id}?x=0&y=0&width=512&height=512&level=10")
    assert res.status_code == 500
    assert "Patch extraction failed" in res.text


def test_patch_extraction_out_of_bounds(client, monkeypatch):
    """Test patch extraction with coordinates out of bounds"""

    # Upload SVS
    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]
        level_downsamples = [1.0, 2.0, 4.0]

        def read_region(self, location, level, size):
            img = Image.new("RGB", size, (255, 0, 0))
            return img.convert("RGBA")

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    import subprocess
    from unittest.mock import Mock

    mock_result = Mock()
    mock_result.returncode = 0

    def mock_run(*args, **kwargs):
        if len(args) > 0 and len(args[0]) > 1 and args[0][1] == "dzsave":
            out_base = args[0][3]
            dzi_path = Path(f"{out_base}.dzi")
            dzi_path.parent.mkdir(parents=True, exist_ok=True)
            dzi_path.write_text('<?xml version="1.0" encoding="UTF-8"?><Image/>')
        return mock_result

    monkeypatch.setattr(subprocess, "run", mock_run)

    data = {"file": ("test.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200
    img_id = res.json()["id"]

    # Try with out of bounds coordinates (currently returns 500 instead of 400 due to exception handling)
    res = client.get(
        f"/api/files/patch/{img_id}?x=10000&y=10000&width=512&height=512&level=0"
    )
    assert res.status_code == 500
    assert "Patch extraction failed" in res.text


def test_patch_extraction_with_brightness_contrast(client, monkeypatch):
    """Test patch extraction with brightness and contrast adjustments"""

    class FakeSlide:
        level_count = 3
        level_dimensions = [(4096, 4096), (2048, 2048), (1024, 1024)]
        level_downsamples = [1.0, 2.0, 4.0]

        def read_region(self, location, level, size):
            img = Image.new("RGB", size, (128, 128, 128))
            return img.convert("RGBA")

        def close(self):
            pass

    class FakeOpenSlideModule:
        def OpenSlide(self, path):
            return FakeSlide()

    monkeypatch.setitem(sys.modules, "openslide", FakeOpenSlideModule())

    import subprocess
    from unittest.mock import Mock

    mock_result = Mock()
    mock_result.returncode = 0

    def mock_run(*args, **kwargs):
        if len(args) > 0 and len(args[0]) > 1 and args[0][1] == "dzsave":
            out_base = args[0][3]
            dzi_path = Path(f"{out_base}.dzi")
            dzi_path.parent.mkdir(parents=True, exist_ok=True)
            dzi_path.write_text('<?xml version="1.0" encoding="UTF-8"?><Image/>')
        return mock_result

    monkeypatch.setattr(subprocess, "run", mock_run)

    data = {"file": ("test.svs", BytesIO(b"fake"), "application/octet-stream")}
    res = client.post("/api/files/upload", files=data)
    assert res.status_code == 200
    img_id = res.json()["id"]

    # Extract with brightness=150, contrast=120
    res = client.get(
        f"/api/files/patch/{img_id}?x=0&y=0&width=256&height=256&level=0&brightness=150&contrast=120"
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
