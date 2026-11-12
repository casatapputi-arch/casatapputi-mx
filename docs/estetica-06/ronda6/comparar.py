from PIL import Image,ImageDraw
from pathlib import Path
import sys
p=Path('docs/estetica-06/ronda6')/sys.argv[1]
for w in [1440,390]:
 files=sorted(p.glob(f'*-{w}.png')); canvas=Image.new('RGB',(2400,1800),'#ddd'); d=ImageDraw.Draw(canvas)
 ref=Image.open('docs/estetica-06/maqueta-06-servicios.png');ref.thumbnail((440,1700));canvas.paste(ref,(0,35))
 for i,f in enumerate(files):
  im=Image.open(f);im.thumbnail((370,820));x=460+(i%5)*385;y=35+(i//5)*875;canvas.paste(im,(x,y));d.text((x,y-20),f.stem,fill='black')
 canvas.save(p/f'comparacion-{w}.jpg')
