"""Draw the SizeRight icons as PNGs with only the standard library.

Motif: three price levels (target green, entry white, stop red) next to a sizing bar.
Usage: python tools/make_icons.py
"""
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "icons"
SS = 3  # supersampling factor for anti-aliasing

BG = (14, 17, 22)
GREEN = (63, 185, 80)
WHITE = (230, 237, 243)
RED = (248, 81, 73)


def rrect(x, y, x0, y0, x1, y1, r):
    """True if (x, y) lies inside a rounded rect (unit coords)."""
    if not (x0 <= x <= x1 and y0 <= y <= y1):
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def shapes(inset):
    """Foreground shapes in unit coords, scaled into the central (1 - 2*inset) area."""
    s = 1 - 2 * inset

    def m(x0, y0, x1, y1, r):
        return (inset + x0 * s, inset + y0 * s, inset + x1 * s, inset + y1 * s, r * s)

    return [
        (GREEN, m(0.20, 0.24, 0.62, 0.32, 0.04)),  # target
        (WHITE, m(0.20, 0.46, 0.62, 0.54, 0.04)),  # entry
        (RED, m(0.20, 0.68, 0.62, 0.76, 0.04)),    # stop
        (GREEN, m(0.70, 0.24, 0.80, 0.54, 0.05)),  # size bar (reward side)
        (RED, m(0.70, 0.58, 0.80, 0.76, 0.05)),    # size bar (risk side)
    ]


def render(size, maskable):
    n = size * SS
    inset = 0.14 if maskable else 0.0
    fg = shapes(inset)
    rows = []
    for py in range(size):
        row = bytearray([0])  # filter type 0
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(SS):
                for sx in range(SS):
                    x = (px * SS + sx + 0.5) / n
                    y = (py * SS + sy + 0.5) / n
                    if maskable:
                        inside = True  # full bleed; launcher applies its own mask
                    else:
                        inside = rrect(x, y, 0.0, 0.0, 1.0, 1.0, 0.22)
                    if not inside:
                        continue
                    col = BG
                    for c, (x0, y0, x1, y1, r) in fg:
                        if rrect(x, y, x0, y0, x1, y1, r):
                            col = c
                            break
                    acc[0] += col[0]
                    acc[1] += col[1]
                    acc[2] += col[2]
                    acc[3] += 255
            k = SS * SS
            a = acc[3] // k
            if a:
                cov = acc[3] / 255
                row += bytes([round(acc[0] / cov), round(acc[1] / cov), round(acc[2] / cov), a])
            else:
                row += b"\0\0\0\0"
        rows.append(bytes(row))
    return png(size, size, b"".join(rows))


def png(w, h, raw):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, size, maskable in [("icon-192.png", 192, False), ("icon-512.png", 512, False),
                                 ("maskable-512.png", 512, True)]:
        (OUT / name).write_bytes(render(size, maskable))
        print("wrote", OUT / name)
