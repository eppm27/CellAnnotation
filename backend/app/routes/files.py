# app/routes/files.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse, Response
from pathlib import Path
import uuid, shutil, os
from PIL import Image
from io import BytesIO
import json, zipfile, tempfile, subprocess
from typing import Optional
from app.config import Config
from app.utils.overlay import draw_annotations
from app.models.annotation import ExportRequest

TILES = Config.TILES_DIR
TILES.mkdir(parents=True, exist_ok=True)

from shutil import copyfileobj, which

# Determine VIP binary at runtime. Prefer environment variable VIP_BIN, then look on PATH.
# On Windows the binary may be 'vips.exe', on Unix it's usually 'vips'.
VIP_BIN = os.environ.get("VIP_BIN")
if not VIP_BIN:
    # try to find vips on PATH
    VIP_BIN = which("vips") or which("vips.exe")


def _ensure_vips_available_or_raise():
    """Return VIP_BIN if available, otherwise raise a RuntimeError with an actionable message."""
    if VIP_BIN and os.path.exists(VIP_BIN):
        return VIP_BIN
    raise RuntimeError(
        "Cannot find vips executable. Install libvips and ensure 'vips' is on PATH, or set the VIP_BIN environment variable to the full path of the vips binary."
    )


router = APIRouter(prefix="/api/files", tags=["files"])

DATA = Config.APP_DATA_DIR / "images"
DATA.mkdir(parents=True, exist_ok=True)
THUMBS = Config.APP_DATA_DIR / "thumbs"
THUMBS.mkdir(parents=True, exist_ok=True)
ORIGINALS = Config.APP_DATA_DIR / "originals"
ORIGINALS.mkdir(parents=True, exist_ok=True)
ORIGINALS_DIR = str(ORIGINALS)
IMAGES_DIR = str(DATA)
THUMBS_DIR = str(THUMBS)
ALLOWED = {".png", ".svs", ".jpg", ".jpeg", ".tif", ".tiff"}  # allowed file extensions


@router.post("/upload")
async def upload(request: Request, file: UploadFile = File(...)):
    """
    Accept png/jpg/svs:
      - Normal images: generate thumbnail and return
      - SVS: generate DeepZoom tiles, return dzi_url (for frontend OSD usage)
    """
    # Prepare directories
    DATA.mkdir(parents=True, exist_ok=True)
    THUMBS.mkdir(parents=True, exist_ok=True)

    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(
            400, f"Only .png/.svs/.jpg/.jpeg/.tif/.tiff supported (got {ext})."
        )

    # Save original file to DATA
    img_id = uuid.uuid4().hex
    # dest = DATA / file.filename
    dest = DATA / f"{img_id}{ext}"  # Use unique ID as filename
    with open(dest, "wb") as f:
        copyfileobj(file.file, f)

    thumb = THUMBS / f"{img_id}.jpg"

    # Key: dzi_url is initially None; only set to '/tiles/<id>.dzi' after successful SVS tiling
    dzi_url: Optional[str] = None

    if ext == ".svs":
        # First generate thumbnail using openslide
        try:
            import openslide

            slide = openslide.OpenSlide(str(dest))
            level = max(0, slide.level_count - 1)
            w, h = slide.level_dimensions[level]
            region = slide.read_region((0, 0), level, (w, h)).convert("RGB")
            # Use Image.Resampling.LANCZOS for Pillow 10+, fallback to Image.LANCZOS for older versions
            try:
                region.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            except AttributeError:
                region.thumbnail((1600, 1600), Image.LANCZOS)
            region.save(thumb, "JPEG", quality=85)
            slide.close()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SVS thumbnail failed: {e}")

        # Then generate DeepZoom using vips
        # Try to find vips at runtime; if not present we'll skip tile generation
        vips_candidate = os.environ.get("VIP_BIN") or which("vips") or which("vips.exe")

        out_base = TILES / img_id  # Note: no extension
        if vips_candidate and os.path.exists(vips_candidate):
            try:
                subprocess.run(
                    [
                        vips_candidate,
                        "dzsave",
                        str(dest),
                        str(out_base),
                        "--tile-size",
                        "256",
                        "--suffix",
                        ".jpg",
                    ],
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                # Success: tell frontend the .dzi relative path (served by FastAPI static /tiles)
                dzi_url = f"/tiles/{img_id}.dzi"
            except subprocess.CalledProcessError as e:
                stderr = getattr(e, "stderr", None)
                msg = stderr[:400] if isinstance(stderr, str) else str(e)
                # Log and continue: tiling failed but thumbnail exists
                raise HTTPException(status_code=500, detail=f"SVS to DZI failed: {msg}")
        else:
            # vips not available: skip creating DeepZoom tiles. The upload still succeeds
            # and the frontend can use the thumbnail for lightweight usage.
            dzi_url = None
    elif ext == ".png":
        try:
            im = Image.open(dest)
            try:
                im.thumbnail((4096, 4096), Image.Resampling.LANCZOS)
            except AttributeError:
                im.thumbnail((4096, 4096), Image.LANCZOS)
            thumb = THUMBS / f"{img_id}.jpg"
            im.convert("RGB").save(thumb, "JPEG", quality=85)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Thumbnail failed: {e}")

    else:
        # ✅ 其它（.jpg/.jpeg/.tif/.tiff）：生成 JPEG 缩略图
        try:
            im = Image.open(dest)
            try:
                im.thumbnail((4096, 4096), Image.Resampling.LANCZOS)
            except AttributeError:
                im.thumbnail((4096, 4096), Image.LANCZOS)
            thumb = THUMBS / f"{img_id}.jpg"
            im.convert("RGB").save(thumb, "JPEG", quality=85)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Thumbnail failed: {e}")
    # Unified return
    return {
        "id": img_id,
        "name": file.filename,
        "thumbnail_url": f"/api/files/thumb/{img_id}",
        "original_url": f"/api/files/original/{img_id}",
        "dzi_url": dzi_url,  # May be None (non-SVS), or '/tiles/<id>.dzi' for SVS
    }


@router.get("/thumb/{img_id}")
def thumb(img_id: str):
    p_png = THUMBS / f"{img_id}.png"
    if p_png.exists():
        return FileResponse(p_png, media_type="image/png")

    p_jpg = THUMBS / f"{img_id}.jpg"
    if p_jpg.exists():
        return FileResponse(p_jpg, media_type="image/jpeg")

    raise HTTPException(404, "thumbnail not found")


def _find_original_by_id(img_id: str) -> Path:
    matches = list(DATA.glob(f"{img_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")
    return matches[0]


def _first_existing_path(paths: list[Path]) -> Path | None:
    for path in paths:
        if path.exists():
            return path
    return None


@router.get("/original/{img_id}")
def download_original(img_id: str):
    src = _find_original_by_id(img_id)
    return FileResponse(
        path=src,
        filename=os.path.basename(src),
        media_type="application/octet-stream",
    )


@router.post("/export", response_class=StreamingResponse)
def export(req: ExportRequest):
    # 1) load base image
    if req.file_type == "png":
        img_path = _first_existing_path(
            [
                DATA / f"{req.file_id}.png",
                Path("app_data/images") / f"{req.file_id}.png",
            ]
        )
        if not img_path:
            raise HTTPException(404, "PNG image not found")
        base = Image.open(img_path).convert("RGBA")
    elif req.file_type == "svs":
        # only load the thumbnail
        thumb_path = _first_existing_path(
            [
                THUMBS / f"{req.file_id}.png",
                THUMBS / f"{req.file_id}.jpg",
                Path("app_data/thumbs") / f"{req.file_id}.png",
                Path("app_data/thumbs") / f"{req.file_id}.jpg",
            ]
        )
        if not thumb_path:
            raise HTTPException(404, "SVS thumbnail not found")
        base = Image.open(thumb_path).convert("RGBA")
    else:
        raise HTTPException(400, "Unsupported file_type")

    dst_w, dst_h = base.size

    # 2) output: annotations.json, mask.png, overlay.png
    # 2.1 annotations.json
    annotation_dicts = [a.model_dump() for a in req.annotations]
    annotations_json = json.dumps(annotation_dicts, ensure_ascii=False, indent=2)

    # 2.2 mask.png
    mask = Image.new("RGBA", (dst_w, dst_h), (0, 0, 0, 0))
    mask = draw_annotations(
        mask,
        annotation_dicts,
        req.canvas_width,
        req.canvas_height,
        dst_w,
        dst_h,
    )

    # 2.3 overlay.png
    overlay = Image.alpha_composite(base, mask)

    # 3) return according to mode
    if req.mode == "annotations":
        bio = BytesIO(annotations_json.encode("utf-8"))
        return StreamingResponse(
            bio,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="{req.file_id}_annotations.json"'
            },
        )
    elif req.mode in ("overlay", "mask"):
        img = overlay if req.mode == "overlay" else mask
        bio = BytesIO()
        img.convert("RGBA").save(bio, format="PNG")
        bio.seek(0)
        fn = f'{req.file_id}_{"overlay" if req.mode=="overlay" else "mask"}.png'
        return StreamingResponse(
            bio,
            media_type="image/png",
            headers={"Content-Disposition": f'attachment; filename="{fn}"'},
        )
    elif req.mode == "all":
        # zip includes: annotations.json, mask.png, overlay.png
        tmp = BytesIO()
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
            # original image
            src_name = (
                f"{req.file_id}.png"
                if req.file_type == "png"
                else f"{req.file_id}_thumb.png"
            )
            src_bio = BytesIO()
            base.convert("RGBA").save(src_bio, format="PNG")
            src_bio.seek(0)
            z.writestr(src_name, src_bio.read())

            # mask
            m_bio = BytesIO()
            mask.convert("RGBA").save(m_bio, format="PNG")
            m_bio.seek(0)
            z.writestr(f"{req.file_id}_mask.png", m_bio.read())

            # overlay
            o_bio = BytesIO()
            overlay.convert("RGBA").save(o_bio, format="PNG")
            o_bio.seek(0)
            z.writestr(f"{req.file_id}_overlay.png", o_bio.read())

            # annotations.json
            z.writestr(f"{req.file_id}_annotations.json", annotations_json)

        tmp.seek(0)
        return StreamingResponse(
            tmp,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{req.file_id}_export.zip"'
            },
        )
    else:
        raise HTTPException(400, "Unsupported mode")


@router.get("/patch/{img_id}")
def extract_patch(
    img_id: str,
    x: int,
    y: int,
    width: int,
    height: int,
    level: int = 0,
    brightness: int = 100,
    contrast: int = 100,
):
    """
    Extract a patch from an SVS file at specified coordinates and pyramid level.
    Coordinates are always in level 0 (full resolution) reference frame.
    """
    # Find the SVS file
    src = _find_original_by_id(img_id)

    # Only process SVS files
    if src.suffix.lower() != ".svs":
        raise HTTPException(400, "Patch extraction only supported for SVS files")

    try:
        from PIL import ImageEnhance
        import openslide

        # Open the slide
        slide = openslide.OpenSlide(str(src))

        # Validate level
        if level < 0 or level >= slide.level_count:
            raise HTTPException(
                400,
                f"Invalid level {level}. Available levels: 0-{slide.level_count - 1}",
            )

        # Get dimensions at the target level
        level_dims = slide.level_dimensions[level]

        # Validate coordinates at level 0
        level0_dims = slide.level_dimensions[0]
        if x < 0 or y < 0 or x >= level0_dims[0] or y >= level0_dims[1]:
            raise HTTPException(
                400, f"Coordinates out of bounds. Image size: {level0_dims}"
            )

        # Calculate downsample factor
        downsample = slide.level_downsamples[level]

        # Auto-downsample: Find the best level that fits within limits
        # Start with the requested level and go up if needed
        MAX_DIMENSION = 16384
        MAX_BYTES = 200 * 1024 * 1024  # 200 MB

        best_level = level
        actual_width = min(width, int((level0_dims[0] - x) / downsample))
        actual_height = min(height, int((level0_dims[1] - y) / downsample))

        # Check if we need to upgrade to a higher level (lower resolution)
        for test_level in range(level, slide.level_count):
            test_downsample = slide.level_downsamples[test_level]
            test_width = int(width / test_downsample)
            test_height = int(height / test_downsample)

            # Clamp to actual available dimensions at this level
            test_width = min(test_width, int((level0_dims[0] - x) / test_downsample))
            test_height = min(test_height, int((level0_dims[1] - y) / test_downsample))

            # Check dimension limits
            if test_width > MAX_DIMENSION or test_height > MAX_DIMENSION:
                continue

            # Check memory limits
            estimated_bytes = test_width * test_height * 3
            if estimated_bytes > MAX_BYTES:
                continue

            # This level works!
            best_level = test_level
            actual_width = test_width
            actual_height = test_height
            break

        # Update to use the best level found
        level = best_level
        downsample = slide.level_downsamples[level]

        # Final sanity check - if even the lowest resolution is too large, reject
        if actual_width > MAX_DIMENSION or actual_height > MAX_DIMENSION:
            raise HTTPException(
                400,
                f"Selection too large even at lowest resolution. Please select a smaller region.",
            )

        estimated_bytes = actual_width * actual_height * 3
        if estimated_bytes > MAX_BYTES:
            raise HTTPException(
                400,
                f"Selection too large even at lowest resolution. Please select a smaller region.",
            )

        # Extract region - OpenSlide handles coordinate transformation
        # location is always in level 0 coordinates, size is in target level coordinates
        region = slide.read_region(
            location=(x, y), level=level, size=(actual_width, actual_height)
        )

        # Convert to RGB (read_region returns RGBA)
        region = region.convert("RGB")

        # Apply brightness filter
        if brightness != 100:
            enhancer = ImageEnhance.Brightness(region)
            region = enhancer.enhance(brightness / 100.0)

        # Apply contrast filter
        if contrast != 100:
            enhancer = ImageEnhance.Contrast(region)
            region = enhancer.enhance(contrast / 100.0)

        # Convert to PNG
        bio = BytesIO()
        region.save(bio, format="PNG")
        bio.seek(0)

        # Close slide
        slide.close()

        # Return PNG with download headers including resolution info
        timestamp = int(uuid.uuid4().int % 10000000000)
        # Include dimensions and level in filename for transparency
        filename = f"patch_{actual_width}x{actual_height}_L{level}_{timestamp}.png"

        return StreamingResponse(
            bio,
            media_type="image/png",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except ImportError:
        raise HTTPException(500, "OpenSlide not available")
    except Exception as e:
        raise HTTPException(500, f"Patch extraction failed: {str(e)}")
