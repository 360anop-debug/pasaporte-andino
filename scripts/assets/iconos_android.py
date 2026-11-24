"""Genera iconos adaptativos/legacy y splash de Android desde el logo aprobado (sin alterar el logo).
Uso: python3 -I iconos_android.py <logo.png> <res_dir>"""
import sys, os, glob
from PIL import Image, ImageDraw
logo = Image.open(sys.argv[1]).convert("RGBA"); logo = logo.crop(logo.getbbox())
res = sys.argv[2]
BG = (90, 10, 36, 255)
def fit(img, box):
    im = img.copy(); im.thumbnail((box, box), Image.LANCZOS); return im
def bg_square(n, round_=False):
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if round_: d.ellipse((0, 0, n - 1, n - 1), fill=BG)
    else: d.rounded_rectangle((0, 0, n - 1, n - 1), radius=n // 6, fill=BG)
    # filete dorado
    if round_: d.ellipse((n*.04, n*.04, n*.96, n*.96), outline=(224, 165, 46, 255), width=max(1, n // 40))
    else: d.rounded_rectangle((n*.04, n*.04, n*.96, n*.96), radius=n // 7, outline=(224, 165, 46, 255), width=max(1, n // 40))
    return im
for dens, legacy, fg in [("mdpi", 48, 108), ("hdpi", 72, 162), ("xhdpi", 96, 216), ("xxhdpi", 144, 324), ("xxxhdpi", 192, 432)]:
    d = os.path.join(res, "mipmap-" + dens); os.makedirs(d, exist_ok=True)
    f = Image.new("RGBA", (fg, fg), (0, 0, 0, 0)); l = fit(logo, int(fg * 0.62)); f.alpha_composite(l, ((fg - l.width) // 2, (fg - l.height) // 2))
    f.save(os.path.join(d, "ic_launcher_foreground.png"))
    for name, rnd in [("ic_launcher.png", False), ("ic_launcher_round.png", True)]:
        b = bg_square(legacy, rnd); l = fit(logo, int(legacy * 0.84)); b.alpha_composite(l, ((legacy - l.width) // 2, (legacy - l.height) // 2)); b.save(os.path.join(d, name))
for p in glob.glob(os.path.join(res, "drawable*", "splash.png")):
    w, h = Image.open(p).size
    s = Image.new("RGBA", (w, h), BG); l = fit(logo, int(min(w, h) * 0.62)); s.alpha_composite(l, ((w - l.width) // 2, (h - l.height) // 2))
    s.convert("RGB").save(p, optimize=True)
print("iconos y splash generados")
