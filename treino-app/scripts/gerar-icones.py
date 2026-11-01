"""Gera os ícones PNG do app (rode: python3 scripts/gerar-icones.py)."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
BG = (11, 18, 32)
ACCENT = (52, 211, 153)


def desenhar(size: int, margem: float) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size * (1 - 2 * margem)
    ox = oy = size * margem
    u = s / 16  # grade de 16 unidades
    def r(x0, y0, x1, y1, rad=0.6):
        d.rounded_rectangle([ox + x0 * u, oy + y0 * u, ox + x1 * u, oy + y1 * u], radius=rad * u, fill=ACCENT)
    # haltere: barra + anilhas
    r(4.5, 7.3, 11.5, 8.7, 0.4)
    r(2.2, 4.5, 4.4, 11.5)
    r(0.6, 5.8, 2.4, 10.2)
    r(11.6, 4.5, 13.8, 11.5)
    r(13.6, 5.8, 15.4, 10.2)
    return img


OUT.mkdir(parents=True, exist_ok=True)
desenhar(192, 0.12).save(OUT / "icon-192.png")
desenhar(512, 0.12).save(OUT / "icon-512.png")
desenhar(512, 0.22).save(OUT / "icon-maskable-512.png")
desenhar(180, 0.12).save(OUT / "apple-touch-icon.png")
print("ícones gerados em", OUT)
