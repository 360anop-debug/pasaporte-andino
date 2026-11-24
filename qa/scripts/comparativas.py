"""Genera, para cada referencia, la hoja lado a lado (referencia | implementación) y un mapa de diferencias
de luminancia/color entre cada pantalla de referencia recortada y la captura equivalente (393x852).
El mapa es INDICATIVO: las referencias son composiciones conceptuales (con marco de teléfono y datos ficticios),
por lo que no se calcula ni se declara un "porcentaje de similitud".
Uso: python3 -I comparativas.py <dir_referencias> <dir_capturas_393> <salida>"""
import sys, os
from PIL import Image, ImageChops, ImageOps, ImageDraw
R, C, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
# (referencia, recorte de la pantalla del teléfono en la referencia, captura equivalente)
PARES = [
    ('02-registro.png', (40, 60, 580, 1250), '00a-registro.png'),
    ('02-registro.png', (620, 60, 1160, 1250), '00b-bienvenido-pasaporte.png'),
    ('03-distritos.png', (40, 40, 580, 1260), '01-inicio.png'),
    ('03-distritos.png', (620, 40, 1165, 1260), '02-distritos.png'),
    ('04-historia-contenidos.png', (155, 30, 700, 1060), '03-distrito-portada.png'),
    ('04-historia-contenidos.png', (750, 30, 1295, 1060), '04-distrito-contenidos.png'),
    ('05-rutas-y-cultura.png', (820, 20, 1180, 690), '05-historia.png'),
    ('05-rutas-y-cultura.png', (10, 710, 300, 1290), '06-videos.png'),
    ('05-rutas-y-cultura.png', (315, 710, 590, 1290), '07-audios.png'),
    ('05-rutas-y-cultura.png', (600, 710, 880, 1290), '08-referencias.png'),
    ('05-rutas-y-cultura.png', (890, 710, 1180, 1290), '10-rutas.png'),
    ('06-album-y-sellos.png', (40, 40, 580, 1270), '15-album.png'),
    ('06-album-y-sellos.png', (620, 40, 1165, 1270), '14-sellos.png'),
    ('07-monedas.png', (40, 40, 580, 1270), '16-monedas.png'),
    ('07-monedas.png', (620, 40, 1165, 1270), '17-coleccion.png'),
]
H = 900
for i, (ref, box, cap) in enumerate(PARES, 1):
    a = Image.open(os.path.join(R, ref)).convert('RGB').crop(box)
    b = Image.open(os.path.join(C, cap)).convert('RGB')
    b = b.crop((0, 0, b.width, min(b.height, round(b.width * a.height / a.width))))
    a2 = a.resize((round(a.width * H / a.height), H)); b2 = b.resize((a2.width, H))
    diff = ImageChops.difference(a2, b2).convert('L')
    heat = ImageOps.colorize(ImageOps.autocontrast(diff), black='#08104a', white='#ffdd33', mid='#d0204a')
    sheet = Image.new('RGB', (a2.width * 3 + 24, H + 30), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    for j, (im, lab) in enumerate([(a2, 'REFERENCIA ' + ref), (b2, 'IMPLEMENTACIÓN ' + cap), (heat, 'MAPA DE DIFERENCIAS (indicativo)')]):
        sheet.paste(im, (j * (a2.width + 12), 30)); d.text((j * (a2.width + 12) + 4, 8), lab, fill=(255, 230, 120))
    name = f"{i:02d}_{ref[:2]}_{cap.replace('.png', '')}.jpg"
    sheet.save(os.path.join(OUT, name), quality=80)
    print(name)
