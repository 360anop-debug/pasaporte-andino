"""Limpia el halo opaco (degradado liso residual del recorte) de los personajes del kit.
Método: crecimiento de región desde los píxeles transparentes, avanzando solo por píxeles de baja
textura local (el halo es un degradado sin detalle; el personaje tiene contornos y textura).
Genera derivados *-limpio.webp; NO modifica los originales del kit (trazado en MANIFEST de entrega).
Uso: python3 -I limpiar_halo_personajes.py <dir_entrada> <dir_salida>
"""
import sys, os
import numpy as np
import cv2
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
PARAMS = {"atahualpa-delia": 7.0, "atahualpa-guia": 7.0, "delia-guia": 7.0, "llama-recompensas": 5.0}
for name, thr in PARAMS.items():
    im = np.array(Image.open(os.path.join(src, name + ".webp")).convert("RGBA"))
    a = im[:, :, 3]
    lab = cv2.cvtColor(im[:, :, :3], cv2.COLOR_RGB2LAB).astype(np.float32)
    # textura local: desviación típica en ventana 5x5 sobre L,a,b
    tex = np.zeros(a.shape, np.float32)
    for c in range(3):
        m = cv2.blur(lab[:, :, c], (5, 5))
        m2 = cv2.blur(lab[:, :, c] ** 2, (5, 5))
        tex += np.sqrt(np.maximum(m2 - m * m, 0))
    smooth = (tex < thr) & (a > 0)
    trans = a == 0
    # crecimiento iterativo desde lo transparente a través de píxeles lisos
    region = trans.copy()
    k = np.ones((3, 3), np.uint8)
    for _ in range(400):
        grown = cv2.dilate(region.astype(np.uint8), k).astype(bool) & (smooth | trans)
        if (grown == region).all():
            break
        region = grown
    fg = (~region).astype(np.uint8) * 255
    n, labs, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:
        keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        fg = np.where(labs == keep, 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, k, iterations=1)
    fg = cv2.GaussianBlur(fg, (3, 3), 0)
    out = im.copy()
    out[:, :, 3] = np.minimum(fg, a)
    Image.fromarray(out).save(os.path.join(dst, name + "-limpio.webp"), "WEBP", quality=92, method=6)
    print(name, round(float((out[:, :, 3] > 0).mean()) * 100, 1), "% opaco (antes", round(float((a > 0).mean()) * 100, 1), ")")
