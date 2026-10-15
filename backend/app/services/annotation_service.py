
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def create_annotated_image(
    original_path: Path,
    detections: list[dict],
    output_path: Path,
) -> Path:
    """
    Draw model detections on a copy of the original image.

    Roboflow bounding boxes use center coordinates (x, y)
    and dimensions (width, height).
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(original_path) as source:
        image = source.convert("RGB")

    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    for detection in detections:
        class_name = str(detection["class_name"])
        confidence = float(detection["confidence"])

        center_x = float(detection["x"])
        center_y = float(detection["y"])
        box_width = float(detection["width"])
        box_height = float(detection["height"])

        left = max(0, round(center_x - box_width / 2))
        top = max(0, round(center_y - box_height / 2))
        right = min(image.width - 1, round(center_x + box_width / 2))
        bottom = min(image.height - 1, round(center_y + box_height / 2))

        if right <= left or bottom <= top:
            continue

        # Draw a visible bounding box.
        draw.rectangle(
            (left, top, right, bottom),
            outline="#00E676",
            width=max(2, round(min(image.size) / 250)),
        )

        label = f"{class_name} {confidence * 100:.1f}%"
        text_box = draw.textbbox((left, top), label, font=font)
        text_width = text_box[2] - text_box[0]
        text_height = text_box[3] - text_box[1]

        label_top = max(0, top - text_height - 6)

        draw.rectangle(
            (
                left,
                label_top,
                left + text_width + 8,
                label_top + text_height + 6,
            ),
            fill="#00E676",
        )

        draw.text(
            (left + 4, label_top + 3),
            label,
            fill="#000000",
            font=font,
        )

    image.save(output_path, format="JPEG", quality=90, optimize=True)
    return output_path
