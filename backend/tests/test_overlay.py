from PIL import Image

from app.utils import overlay


def test_scale_points_scales_to_destination():
    """TC-034: Verify annotation transformation sync - Point scaling"""
    points = [{"x": 10, "y": 5}, {"x": 30, "y": 15}]
    scaled = overlay.scale_points(points, src_w=40, src_h=20, dst_w=80, dst_h=40)
    assert scaled == [(20.0, 10.0), (60.0, 30.0)]


def test_draw_annotations_covers_all_shapes():
    """TC-025, TC-026, TC-027, TC-028: Verify annotation creation for all types"""
    img = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
    anns = [
        {
            "type": "rectangle",
            "coordinates": [{"x": 10, "y": 20}, {"x": 80, "y": 90}],
            "color": "#ff0000",
            "visible": True,
        },
        {
            "type": "circle",
            "coordinates": [{"x": 40, "y": 40}, {"x": 45, "y": 40}],
            "color": "#00ff00",
            "visible": True,
        },
        {
            "type": "freehand",
            "coordinates": [
                {"x": 0, "y": 0},
                {"x": 20, "y": 10},
                {"x": 40, "y": 0},
            ],
            "color": "#0000ff",
            "visible": True,
        },
        {
            "type": "text",
            "coordinates": [{"x": 50, "y": 60}],
            "name": "Label",
            "color": "#123456",
            "visible": True,
        },
        {
            "type": "measure",
            "coordinates": [{"x": 70, "y": 80}, {"x": 90, "y": 100}],
            "color": "#654321",
            "visible": True,
        },
        {
            "type": "rectangle",
            "coordinates": [{"x": 1, "y": 1}, {"x": 2, "y": 2}],
            "color": "#ffffff",
            "visible": False,
        },
    ]

    result = overlay.draw_annotations(
        img,
        anns,
        canvas_w=100,
        canvas_h=100,
        dst_w=200,
        dst_h=200,
    )

    assert result is img
    # Ensure something was drawn by checking bounding box exists
    assert result.getbbox() is not None
