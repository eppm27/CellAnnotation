# app/utils/overlay.py
from PIL import Image, ImageDraw, ImageFont
import math


def scale_points(points, src_w, src_h, dst_w, dst_h):
    sx, sy = dst_w / src_w, dst_h / src_h
    return [(p["x"] * sx, p["y"] * sy) for p in points]


def draw_annotations(mask_img, anns, canvas_w, canvas_h, dst_w, dst_h):
    draw = ImageDraw.Draw(mask_img, "RGBA")
    for a in anns:
        if not a.get("visible", True):
            continue
        color = a.get("color", "#ff0000")
        pts = scale_points(a["coordinates"], canvas_w, canvas_h, dst_w, dst_h)

        if a["type"] == "rectangle" and len(pts) >= 2:
            (x1, y1), (x2, y2) = pts[0], pts[1]
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        elif a["type"] == "circle" and len(pts) >= 2:
            (cx, cy), (px, py) = pts[0], pts[1]
            r = math.dist((cx, cy), (px, py))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=3)
        elif a["type"] == "freehand" and len(pts) >= 2:
            draw.line(pts, fill=color, width=3, joint="curve")
        elif a["type"] == "text" and len(pts) >= 1:
            (x, y) = pts[0]
            draw.text((x, y), a.get("name") or "Text", fill=color)
        elif a["type"] == "measure" and len(pts) >= 2:
            draw.line([pts[0], pts[1]], fill=color, width=3)

    return mask_img
