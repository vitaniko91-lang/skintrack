"""Склеивает тайлы terrarium вокруг Маттерхорна в одно окно 512×512.

Выход: public/terrain/matterhorn.png — те же terrarium-RGB, что у тайлов
(h = R*256 + G + B/256 - 32768), и matterhorn.json с метаданными.
Запуск: ~/.claude/imaging/bin/python scripts/build_terrain.py
"""
import io, json, math, pathlib, urllib.request
import numpy as np
from PIL import Image

Z = 13
LAT, LON = 45.9763, 7.6586           # вершина Маттерхорна
SIZE = 512
URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "terrain"


def tile_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def fetch(x, y):
    data = urllib.request.urlopen(URL.format(z=Z, x=x, y=y), timeout=30).read()
    return np.asarray(Image.open(io.BytesIO(data)).convert("RGB"))


def main():
    fx, fy = tile_xy(LAT, LON, Z)
    x0, y0 = int(fx) - 1, int(fy) - 1
    rows = [np.concatenate([fetch(x, y) for x in range(x0, x0 + 3)], axis=1)
            for y in range(y0, y0 + 3)]
    rgb = np.concatenate(rows, axis=0)
    cx, cy = int((fx - x0) * 256), int((fy - y0) * 256)
    half = SIZE // 2
    crop = rgb[cy - half:cy + half, cx - half:cx + half]
    assert crop.shape == (SIZE, SIZE, 3), crop.shape

    h = crop[..., 0] * 256.0 + crop[..., 1] + crop[..., 2] / 256.0 - 32768
    meters_per_px = 156543.03392 * math.cos(math.radians(LAT)) / 2 ** Z
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(crop).save(OUT / "matterhorn.png", optimize=True)
    meta = {
        "width": SIZE, "height": SIZE,
        "minH": round(float(h.min()), 1), "maxH": round(float(h.max()), 1),
        "sizeMeters": round(meters_per_px * (SIZE - 1), 1),
        "source": "AWS Terrain Tiles (terrarium), Mapzen/Tilezen, z13",
    }
    (OUT / "matterhorn.json").write_text(json.dumps(meta, indent=2))
    print(meta)


if __name__ == "__main__":
    main()
