"""Hoja de comparación: referencia (recorte) a la izquierda + capturas a la derecha.
Uso: python3 -I hoja.py salida.jpg ref.png:x0,y0,x1,y1 cap1.png cap2.png ...  (ref opcional: '-')"""
import sys
from PIL import Image, ImageDraw
out, ref, caps = sys.argv[1], sys.argv[2], sys.argv[3:]
H = 900
tiles = []
if ref != '-':
    path, box = ref.split(':')
    im = Image.open(path).convert('RGB').crop(tuple(int(v) for v in box.split(',')))
    tiles.append(('REFERENCIA', im))
for c in caps:
    im = Image.open(c).convert('RGB')
    im = im.crop((0, 0, im.width, min(im.height, int(im.width * 2.2))))
    tiles.append((c.split('/')[-1], im))
scaled = [(n, i.resize((int(i.width * H / i.height), H))) for n, i in tiles]
W = sum(i.width for _, i in scaled) + 12 * len(scaled)
sheet = Image.new('RGB', (W, H + 26), (40, 40, 40))
d = ImageDraw.Draw(sheet)
x = 0
for n, i in scaled:
    sheet.paste(i, (x, 26)); d.text((x + 4, 6), n, fill=(255, 255, 0)); x += i.width + 12
sheet.save(out, quality=82)
