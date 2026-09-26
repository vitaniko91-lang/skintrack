"""Карта для телефона-прототипа: вид сверху на окно вокруг маршрута.

map-base.webp  — отмывка (свет с северо-запада) + изолинии через 50 м, основные через 250 м.
map-slope.webp — RGBA-слой крутизны, швейцарские полосы 30/35/40/45°, как в сцене.
src/prototype/mapCrop.ts — точное окно кадра в UV всего тайла, чтобы SVG-маршрут лёг ровно.

DEM квантован (terrarium-кодирование), и bicubic-апскейл 4× плюс np.gradient усиливают
ступеньки квантования в полосы/спекл. Перед апскейлом высоты сглаживаются гауссианом
(sigma ≈ 1.2 исходных px) — с запасом в несколько px реальных соседних данных по краям
кропа, чтобы свёртка не тянула краевую погрешность внутрь итогового кадра.

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
SMOOTH_SIGMA = 1.2  # исходных px, до апскейла
SLOPE_ALPHA = 0.62
SLOPE_ALPHA_ROCK = SLOPE_ALPHA / 2  # ≥45° — уже не лыжный рельеф, как в 3D-сцене
BANDS = [
    (30, "#f4d35e", SLOPE_ALPHA),
    (35, "#f08a24", SLOPE_ALPHA),
    (40, "#d7263d", SLOPE_ALPHA),
    (45, "#7b4fa3", SLOPE_ALPHA_ROCK),
]
DARK, LIT = "#0d141b", "#3a4b58"
LINE = "#bfe0ee"


def rgb(hexstr):
    return np.array([int(hexstr[i:i + 2], 16) for i in (1, 3, 5)], float) / 255


def gaussian_kernel(sigma):
    radius = int(math.ceil(3 * sigma))
    x = np.arange(-radius, radius + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2))
    return k / k.sum(), radius


def smooth2d(arr, sigma):
    """Разделимый гауссиан; края свёртки — edge-padding (реплика крайнего значения)."""
    k, r = gaussian_kernel(sigma)
    padded = np.pad(arr, ((0, 0), (r, r)), mode="edge")
    tmp = np.zeros_like(arr)
    for i, w in enumerate(k):
        tmp += w * padded[:, i:i + arr.shape[1]]
    padded = np.pad(tmp, ((r, r), (0, 0)), mode="edge")
    out = np.zeros_like(arr)
    for i, w in enumerate(k):
        out += w * padded[i:i + arr.shape[0], :]
    return out


def main():
    meta = json.loads((TERRAIN / "matterhorn.json").read_text())
    a = np.asarray(Image.open(TERRAIN / "matterhorn.png").convert("RGB")).astype(float)
    h = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    H, W = h.shape
    cell = meta["sizeMeters"] / (meta["width"] - 1)

    x0, x1 = int(CROP["u0"] * (W - 1)), int(math.ceil(CROP["u1"] * (W - 1)))
    y0, y1 = int(CROP["v0"] * (H - 1)), int(math.ceil(CROP["v1"] * (H - 1)))

    # Кроп с запасом в radius исходных px реальных соседних данных (edge-padding —
    # только если запас выходит за истинный край DEM), чтобы свёртка не смещала
    # результат у границ итогового окна. Сглаживаем, затем обрезаем запас обратно —
    # crop_uv ниже считается от исходных x0/x1/y0/y1, без запаса.
    _, radius = gaussian_kernel(SMOOTH_SIGMA)
    h_pad = np.pad(h, radius, mode="edge")
    crop_ext = h_pad[y0:y1 + 1 + 2 * radius, x0:x1 + 1 + 2 * radius].astype("float64")
    crop_smooth = smooth2d(crop_ext, SMOOTH_SIGMA)[radius:-radius, radius:-radius].astype("float32")

    up_w, up_h = crop_smooth.shape[1] * UPSCALE, crop_smooth.shape[0] * UPSCALE
    hu = np.asarray(Image.fromarray(crop_smooth).resize((up_w, up_h), Image.BICUBIC), float)
    cell_up = cell * (crop_smooth.shape[1] - 1) / (up_w - 1)

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

    def shift_down(a):
        # np.roll оборачивает по кругу (низ пришивает к верху); здесь вдвигаем False.
        out = np.zeros_like(a)
        out[1:, :] = a[:-1, :]
        return out

    def shift_right(a):
        out = np.zeros_like(a)
        out[:, 1:] = a[:, :-1]
        return out

    minor, major = edges(CONTOUR_M), edges(INDEX_M)
    major = major | shift_down(major) | shift_right(major)  # основные — толще
    base = np.where(minor[..., None], base * 0.78 + rgb(LINE) * 0.22, base)
    base = np.where(major[..., None], base * 0.5 + rgb(LINE) * 0.5, base)

    over = np.zeros((up_h, up_w, 4))
    for deg, col, alpha in BANDS:
        m = slope >= deg
        over[m, :3] = rgb(col)
        over[m, 3] = alpha

    def save(arr, name):
        # режим (RGB / RGBA) Pillow берёт из числа каналов массива
        im = Image.fromarray((arr * 255).round().astype("uint8")).resize((OUT_W, OUT_H), Image.LANCZOS)
        im.save(TERRAIN / name, quality=82, method=6)
        print(name, (TERRAIN / name).stat().st_size // 1024, "KB")

    save(base, "map-base.webp")
    save(over, "map-slope.webp")

    # Pillow resize покрывает кадр от края до края пикселя, не от центра к центру —
    # окно в UV должно описывать эти края (±0.5 px), иначе SVG-маршрут съезжает
    # на пол-пикселя относительно PNG на любом масштабе кадра.
    crop_uv = {"u0": (x0 - 0.5) / (W - 1), "u1": (x1 + 0.5) / (W - 1),
               "v0": (y0 - 0.5) / (H - 1), "v1": (y1 + 0.5) / (H - 1),
               "width": OUT_W, "height": OUT_H}
    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    TS_OUT.write_text("// Сгенерировано scripts/build_map.py — не править руками.\n"
                      "export const MAP_CROP = " + json.dumps(crop_uv, indent=2) + " as const\n")
    print(crop_uv)


if __name__ == "__main__":
    main()
