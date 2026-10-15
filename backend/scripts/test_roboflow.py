
import json
from pathlib import Path

from app.services.ai_service import run_inference


def main():
    image_input = input(
        "Enter the full path to a test image: "
    ).strip().strip('"')

    image_path = Path(image_input)

    if not image_path.is_file():
        print("ERROR: Image file not found. Check the path.")
        return

    try:
        result = run_inference(image_path)
        print("\nRoboflow inference succeeded!")
        print(json.dumps(result, indent=2))

    except Exception as exc:
        print(f"\nInference test failed: {exc}")


if __name__ == "__main__":
    main()
