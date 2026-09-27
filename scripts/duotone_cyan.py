"""Дуотон «ледяной циан» для direction-прототипа skintrack.

Градиентная карта в три точки (тень → середина → свет), как у RideOn:
цвет — это поле, а не тонировка. Зерно после ресайза, на каждую ширину.

Запуск:
  ~/.claude/imaging/bin/python scripts/duotone_cyan.py assets-src/hero.jpg hero
Выход: public/photo/{name}-{640,1280,2048}.{avif,webp}
"""
import argparse, pathlib
import numpy as np
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "photo"
STOPS = [  # (позиция, цвет)
    (0.00, (0x02, 0x10, 0x16)),
    (0.45, (0x0B, 0x6F, 0x86)),
    (0.80, (0x3F, 0xD6, 0xF0)),
    (1.00, (0x9C, 0xF6, 0xFF)),
]
CONTRAST = 1.35
GAMMA = 2.2
GRAIN = 0.22
WIDTHS = (640, 1280, 2048)


def gradient_map(img: Image.Image, gamma: float = GAMMA) -> np.ndarray:
    g = np.asarray(ImageOps.grayscale(img), float) / 255
    g = g ** gamma  # снег сидит в верхних 15% — гамма опускает его в насыщенную середину
    g = np.clip((g - 0.55) * CONTRAST + 0.5, 0, 1)
    xs = [s[0] for s in STOPS]
    out = np.zeros(g.shape + (3,))
    for c in range(3):
        out[..., c] = np.interp(g, xs, [s[1][c] / 255 for s in STOPS])
    return out


def grain(rgb: np.ndarray, seed: int = 11, amount: float = GRAIN) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = rng.normal(0.5, 0.2, rgb.shape[:2])[..., None].clip(0, 1)
    over = np.where(rgb < 0.5, 2 * rgb * n, 1 - 2 * (1 - rgb) * (1 - n))
    return rgb * (1 - amount) + over * amount


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("name")
    ap.add_argument("--grain", type=float, default=GRAIN, help="доля зерна (по умолчанию как у hero)")
    ap.add_argument("--gamma", type=float, default=GAMMA)
    ap.add_argument("--widths", default=",".join(map(str, WIDTHS)), help="ширины через запятую")
    a = ap.parse_args()
    img = Image.open(a.src).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    for w in map(int, a.widths.split(",")):
        h = round(img.height * w / img.width)
        rgb = grain(gradient_map(img.resize((w, h), Image.LANCZOS), a.gamma), amount=a.grain)
        out = Image.fromarray((rgb * 255).round().astype("uint8"))
        out.save(OUT / f"{a.name}-{w}.avif", quality=62)
        out.save(OUT / f"{a.name}-{w}.webp", quality=80, method=6)
        kb = [(OUT / f"{a.name}-{w}.{e}").stat().st_size // 1024 for e in ("avif", "webp")]
        print(f"{w}x{h}: avif {kb[0]} KB, webp {kb[1]} KB")


if __name__ == "__main__":
    main()
