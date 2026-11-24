"""Prepara los recursos web a partir del Kit Maestro SIN modificar el kit.
- Copia/optimiza assets/ (webp calidad alta; no se recomprime en exceso oro, rostros ni bordes).
- Personajes: usa los derivados *-limpio.webp (halo residual eliminado) generados por limpiar_halo_personajes.py.
- Monedas/medallas (RGB sobre negro): genera alfa por relleno desde las esquinas.
- Sellos: se toman de originales_png/ (más detalle que los SVG simplificados).
- Escribe assets-manifest.json con origen, derivación, estado (listo/provisional) y SHA-256.
Uso: python3 -I preparar_assets.py <kit_dir> <limpio_dir> <salida_public_dir>
"""
import sys, os, json, hashlib, shutil
import numpy as np
import cv2
from PIL import Image

kit, clean, out = sys.argv[1], sys.argv[2], sys.argv[3]
A = os.path.join(out, "assets")
os.makedirs(A, exist_ok=True)
manifest = json.load(open(os.path.join(kit, "documentacion/MANIFEST.json"), encoding="utf-8"))
estado = {a["archivo"]: (a["estado"], a.get("notas", "")) for a in manifest["archivos"]}
items = []

def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()

def record(dest, origen, derivacion):
    st, notas = estado.get(origen, ("listo", ""))
    items.append({"archivo": os.path.relpath(dest, out).replace(os.sep, "/"), "origen_kit": origen,
                  "sha256_origen": sha(os.path.join(kit, origen)), "derivacion": derivacion,
                  "estado": st, "notas": notas, "sha256": sha(dest), "bytes": os.path.getsize(dest)})

def save_webp(img, dest, max_w=None, q=90):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if max_w and img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)), Image.LANCZOS)
    img.save(dest, "WEBP", quality=q, method=6)

def alpha_from_dark_bg(img):
    """Alfa por relleno desde las esquinas sobre fondo casi negro (monedas/medallas)."""
    rgb = np.array(img.convert("RGB"))
    lum = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    dark = (lum < 40).astype(np.uint8)
    h, w = dark.shape
    mask = np.zeros((h + 2, w + 2), np.uint8)
    bg = np.zeros_like(dark)
    for (x, y) in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if dark[y, x]:
            m = np.zeros((h + 2, w + 2), np.uint8)
            cv2.floodFill(dark.copy(), m, (x, y), 2, 0, 0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
            bg |= (m[1:-1, 1:-1] > 0).astype(np.uint8)
    fg = (1 - bg) * 255
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    fg = cv2.GaussianBlur(fg, (5, 5), 0)
    rgba = np.dstack([rgb, fg])
    im = Image.fromarray(rgba, "RGBA")
    return im.crop(im.getbbox())

# 1) assets generales
for root, _, files in os.walk(os.path.join(kit, "assets")):
    for f in files:
        src = os.path.join(root, f)
        rel = os.path.relpath(src, kit).replace(os.sep, "/")
        dest = os.path.join(out, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        mod = rel.split("/")[1]
        if f.endswith(".svg"):
            shutil.copyfile(src, dest)
            record(dest, rel, "copia exacta")
        elif mod == "personajes":
            name = f.rsplit(".", 1)[0]
            save_webp(Image.open(os.path.join(clean, name + "-limpio.webp")), dest, q=92)
            record(dest, rel, "halo residual eliminado (limpiar_halo_personajes.py)")
        elif mod == "monedas" and f != "cofre-recompensas.webp" or f in ("medalla-album.webp", "insignia-bienvenida.webp"):
            save_webp(alpha_from_dark_bg(Image.open(src)), dest, max_w=640, q=92)
            record(dest, rel, "alfa generado (fondo negro eliminado) y escalado a 640px")
        elif f.endswith(".png"):  # logo
            im = Image.open(src).convert("RGBA")
            im = im.crop(im.getbbox())
            save_webp(im, dest.replace(".png", ".webp"), max_w=1000, q=92)
            record(dest.replace(".png", ".webp"), rel, "recorte de márgenes transparentes, webp 1000px")
            im.thumbnail((512, 512))
            im.save(dest, "PNG", optimize=True)
            record(dest, rel, "png 512px para iconos y Open Graph")
        else:
            im = Image.open(src)
            save_webp(im, dest, max_w=1400 if mod != "monedas" else 640, q=88)
            record(dest, rel, "optimizado webp q88, máx 1400px")

# 2) sellos desde originales_png (mayor detalle que los SVG simplificados)
sellos = {
    "sello-cajamarca": "sello_turístico_de_cajamarca.png",
    "sello-banos-inca": "sello_andino_de_baños_del_inca.png",
    "sello-celendin": "sello_turístico_pasaporte_andino_de_celendín.png",
    "sello-bloqueado": "sello_gris_de_pasaporte_andino.png",
}
for name, orig in sellos.items():
    im = Image.open(os.path.join(kit, "originales_png", orig)).convert("RGBA")
    im = im.crop(im.getbbox())
    dest = os.path.join(A, "sellos", name + ".webp")
    save_webp(im, dest, max_w=480, q=90)
    record(dest, "originales_png/" + orig, "recorte y webp 480px")

# 3) maestros adicionales
extra = {
    "pasaporte/portada-detalle.webp": ("originales_png/portada_andina_de_lujo.png", 900, False),
    "album/album-parches.webp": ("originales_png/álbum_andino_de_parches_dorados.png", 900, False),
    "album/marco-polaroid.webp": ("originales_png/marco_polaroid_vintage_vacío.png", 600, False),
    "monedas/medallon.webp": ("originales_png/medallón_dorado_del_pasaporte_andino.png", 640, True),
}
for rel, (orig, w, dark) in extra.items():
    im = Image.open(os.path.join(kit, orig))
    if dark:
        im = alpha_from_dark_bg(im)
    dest = os.path.join(A, rel)
    save_webp(im, dest, max_w=w, q=90)
    record(dest, orig, "derivado webp" + (" con alfa" if dark else ""))

# 4) grabado inferior de la página de identidad (paisaje andino) para la tarjeta del pasaporte
src = os.path.join(kit, "assets/pasaporte/pagina-identidad.webp")
dest = os.path.join(A, "pasaporte/grabado-identidad.webp")
save_webp(Image.open(src).convert("RGB").crop((70, 1040, 1052, 1185)), dest, q=88)
record(dest, "assets/pasaporte/pagina-identidad.webp", "recorte del grabado inferior (ruinas y montañas)")

json.dump({"generado_desde": manifest["version"], "advertencias": manifest.get("advertencias", []), "archivos": items},
          open(os.path.join(out, "assets-manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(items), "recursos;", round(sum(i["bytes"] for i in items) / 1048576, 2), "MB")
