"""Exercise the real recognition API with local photos; never copy images into the repo.

Requires Pillow. Like the app, send an oriented JPEG at most 800px, quality 72.
Reports candidate IDs and latency, not inferred accuracy or recipe ingredients.
"""

import argparse
import base64
import concurrent.futures
import io
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image, ImageOps


def evaluate(path, endpoint):
    started = time.monotonic()
    result = {"file": path.name}
    try:
        with Image.open(path) as original:
            photo = ImageOps.exif_transpose(original).convert("RGB")
            photo.thumbnail((800, 800), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            photo.save(encoded, format="JPEG", quality=72)
        data = "data:image/jpeg;base64," + base64.b64encode(encoded.getvalue()).decode()
        url = urllib.parse.urlsplit(endpoint)
        request = urllib.request.Request(
            endpoint,
            data=json.dumps({"photo": data}).encode(),
            headers={"Content-Type": "application/json", "Origin": f"{url.scheme}://{url.netloc}", "User-Agent": "mogubiyori-recognition-evaluation/1.0"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            result.update(status=response.status, response=json.load(response))
    except urllib.error.HTTPError as error:
        try:
            response = json.loads(error.read())
        except (ValueError, UnicodeDecodeError):
            response = {"error": "non_json_error"}
        result.update(status=error.code, response=response)
    except Exception as error:
        result["error"] = type(error).__name__
    result["seconds"] = round(time.monotonic() - started, 2)
    print(json.dumps(result, ensure_ascii=False), flush=True)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=pathlib.Path)
    parser.add_argument("--endpoint", required=True)
    parser.add_argument("--output", required=True, type=pathlib.Path)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--workers", type=int, default=2, choices=range(1, 4))
    args = parser.parse_args()
    paths = sorted(path for path in args.directory.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    if args.limit:
        paths = paths[:args.limit]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda path: evaluate(path, args.endpoint), paths))
    args.output.write_text(json.dumps({"endpoint": args.endpoint, "results": results}, ensure_ascii=False, indent=2) + "\n")
