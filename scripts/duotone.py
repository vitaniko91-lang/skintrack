"""Дуотон + зерно по спеке skintrack.

Тени #0A1220 -> света #CCE6F2, контраст x1.15, зерно overlay ~18%.
Зерно накладывается после ресайза, отдельно на каждую ширину: иначе на
640 px оно превращается в муть, а на 2048 — в крупу.

Запуск:
  ~/.claude/imaging/bin/python scripts/duotone.py assets-src/band.jpg band \
      --alt "..." --credit "Имя Автора" --credit-url "https://unsplash.com/@..."
Выход: public/photo/band-{640,1280,2048}.{avif,webp} и src/content/photo.ts
"""
import argparse, json, pathlib
import numpy as np
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "photo"
TS_OUT = ROOT / "src" / "content" / "photo.ts"
SHADOW = np.array([0x0A, 0x12, 0x20], float) / 255
LIGHT = np.array([0xCC, 0xE6, 0xF2], float) / 255
CONTRAST = 1.15
GRAIN = 0.18
WIDTHS = (640, 1280, 2048)


def duotone(img: Image.Image) -> np.ndarray:
    g = np.asarray(ImageOps.grayscale(img), float) / 255
    g = np.clip((g - 0.5) * CONTRAST + 0.5, 0, 1)
    return SHADOW + (LIGHT - SHADOW) * g[..., None]


def grain(rgb: np.ndarray, seed: int = 7) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = rng.normal(0.5, 0.18, rgb.shape[:2])[..., None].clip(0, 1)
    over = np.where(rgb < 0.5, 2 * rgb * n, 1 - 2 * (1 - rgb) * (1 - n))
    return rgb * (1 - GRAIN) + over * GRAIN


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("name")
    ap.add_argument("--alt", required=True)
    ap.add_argument("--credit", required=True)
    ap.add_argument("--credit-url", required=True)
    a = ap.parse_args()

    img = Image.open(a.src).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    size = None
    for w in WIDTHS:
        h = round(img.height * w / img.width)
        rgb = grain(duotone(img.resize((w, h), Image.LANCZOS)))
        out = Image.fromarray((rgb * 255).round().astype("uint8"))
        out.save(OUT / f"{a.name}-{w}.avif", quality=60)
        out.save(OUT / f"{a.name}-{w}.webp", quality=78, method=6)
        kb = [(OUT / f"{a.name}-{w}.{e}").stat().st_size // 1024 for e in ("avif", "webp")]
        print(f"{w}x{h}: avif {kb[0]} KB, webp {kb[1]} KB")
        size = (w, h)

    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    TS_OUT.write_text(
        "// Сгенерировано scripts/duotone.py — не править руками.\n"
        "export const PHOTO = " + json.dumps({
            "name": a.name, "width": size[0], "height": size[1], "widths": list(WIDTHS),
            "alt": a.alt, "credit": a.credit, "creditUrl": a.credit_url,
        }, ensure_ascii=False, indent=2) + " as const\n"
    )
    print("wrote", TS_OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
