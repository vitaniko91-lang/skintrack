"""Карта для телефона-прототипа: вид сверху на окно вокруг маршрута.

map-base.webp  — отмывка (свет с северо-запада) + изолинии через 50 м, основные через 250 м.
map-slope.webp — RGBA-слой крутизны, швейцарские полосы 30/35/40/45°, как в сцене.
src/prototype/mapCrop.ts — точное окно кадра в UV всего тайла, чтобы SVG-маршрут лёг ровно.

Запуск: ~/.claude/imaging/bin/python scripts/build_map.py
"""
import json, math, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
TERRAIN = ROOT / "public" / "terrain"
TS_OUT = ROOT / "src" / "prototype" / "mapCrop.ts"
CROP = {"u0": 0.45, "u1": 0.93, "v0": 0.06, "v1": 0.70}  # портрет ~3:4 вокруг ROUTE_UV
OUT_W, OUT_H = 720, 960
UPSCALE = 4
CONTOUR_M, INDEX_M = 50, 250
BANDS = [(30, "#f4d35e"), (35, "#f08a24"), (40, "#d7263d"), (45, "#7b4fa3")]
SLOPE_ALPHA = 0.62
DARK, LIT = "#0d141b", "#3a4b58"
LINE = "#bfe0ee"


def rgb(hexstr):
    return np.array([int(hexstr[i:i + 2], 16) for i in (1, 3, 5)], float) / 255


def main():
    meta = json.loads((TERRAIN / "matterhorn.json").read_text())
    a = np.asarray(Image.open(TERRAIN / "matterhorn.png").convert("RGB")).astype(float)
    h = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    H, W = h.shape
    cell = meta["sizeMeters"] / (meta["width"] - 1)

    x0, x1 = int(CROP["u0"] * (W - 1)), int(math.ceil(CROP["u1"] * (W - 1)))
    y0, y1 = int(CROP["v0"] * (H - 1)), int(math.ceil(CROP["v1"] * (H - 1)))
    crop = h[y0:y1 + 1, x0:x1 + 1].astype("float32")
    up_w, up_h = crop.shape[1] * UPSCALE, crop.shape[0] * UPSCALE
    hu = np.asarray(Image.fromarray(crop).resize((up_w, up_h), Image.BICUBIC), float)
    cell_up = cell * (crop.shape[1] - 1) / (up_w - 1)

    gy, gx = np.gradient(hu, cell_up)          # gy растёт на юг (строки)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))

    # Отмывка: нормаль (восток, север, вверх) = (-gx, gy, 1); свет с СЗ под 45°.
    n = np.stack([-gx, gy, np.ones_like(gx)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    light = np.array([-math.sqrt(0.5) * math.cos(math.radians(45)),
                      math.sqrt(0.5) * math.cos(math.radians(45)),
                      math.sin(math.radians(45))])
    shade = np.clip(n @ light, 0, 1) ** 1.2
    base = rgb(DARK) + (rgb(LIT) - rgb(DARK)) * shade[..., None]

    def edges(step):
        lvl = np.floor(hu / step)
        e = np.zeros_like(lvl, bool)
        e[:, 1:] |= lvl[:, 1:] != lvl[:, :-1]
        e[1:, :] |= lvl[1:, :] != lvl[:-1, :]
        return e

    minor, major = edges(CONTOUR_M), edges(INDEX_M)
    major = major | np.roll(major, 1, 0) | np.roll(major, 1, 1)  # основные — толще
    base = np.where(minor[..., None], base * 0.78 + rgb(LINE) * 0.22, base)
    base = np.where(major[..., None], base * 0.5 + rgb(LINE) * 0.5, base)

    over = np.zeros((up_h, up_w, 4))
    for deg, col in BANDS:
        m = slope >= deg
        over[m, :3] = rgb(col)
        over[m, 3] = SLOPE_ALPHA

    def save(arr, name):
        # режим (RGB / RGBA) Pillow берёт из числа каналов массива
        im = Image.fromarray((arr * 255).round().astype("uint8")).resize((OUT_W, OUT_H), Image.LANCZOS)
        im.save(TERRAIN / name, quality=82, method=6)
        print(name, (TERRAIN / name).stat().st_size // 1024, "KB")

    save(base, "map-base.webp")
    save(over, "map-slope.webp")

    crop_uv = {"u0": x0 / (W - 1), "u1": x1 / (W - 1), "v0": y0 / (H - 1), "v1": y1 / (H - 1),
               "width": OUT_W, "height": OUT_H}
    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    TS_OUT.write_text("// Сгенерировано scripts/build_map.py — не править руками.\n"
                      "export const MAP_CROP = " + json.dumps(crop_uv, indent=2) + " as const\n")
    print(crop_uv)


if __name__ == "__main__":
    main()
