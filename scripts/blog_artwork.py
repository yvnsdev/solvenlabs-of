"""Topic-specific editorial SVG illustrations, using a common drawing vocabulary."""
from html import escape
import textwrap


class Canvas:
    def __init__(self, accent):
        self.parts = []
        self.accent = accent

    def add(self, markup):
        self.parts.append(markup)

    def rect(self, x, y, w, h, fill='#ffffff', radius=16, stroke='#d6e3eb'):
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>')

    def path(self, d, color=None, width=3, fill='none', dash=''):
        self.add(f'<path d="{d}" fill="{fill}" stroke="{color or self.accent}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="{dash}"/>')

    def circle(self, x, y, r, fill, stroke='none'):
        self.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')

    def text(self, value, x, y, size=20, color='#17364e', weight=400, wrap=40, anchor='start'):
        for line in textwrap.wrap(value, width=wrap):
            self.add(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{escape(line)}</text>')
            y += size*1.28
        return y

    def label(self, text, x, y, width=160):
        self.rect(x,y,width,40,'#eaf2f7',10,'none')
        self.text(text,x+width/2,y+26,15,weight=700,anchor='middle')

    def check(self,x,y):
        self.circle(x,y,14,self.accent)
        self.path(f'M{x-6} {y}l4 4 8-9','#fff',2.5)

    def arrow(self,x,y,length=40):
        self.path(f'M{x} {y}h{length}m-8-7 8 7-8 7')


def artwork(name, accent):
    c = Canvas(accent)
    # Each subject has its own topology; these are not interchangeable cards.
    if name == 'planilla-costos-cover':
        c.rect(18,62,484,335,'#fff',18,'none')
        c.rect(18,62,484,52,accent,16,'none')
        c.text('EL MONTO NECESITA UN CÁLCULO',38,95,17,'#fff',700)
        for x,t in [(38,'CANTIDAD'),(206,'VALOR'),(362,'SUBTOTAL')]: c.text(t,x,147,14,accent,700)
        for y,values in [(195,['24 h','$20.000','$480.000']),(248,['3 kits','$40.000','$120.000']),(301,['8 h','$20.000','$160.000'])]:
            for x,value in zip([38,206,362],values):c.text(value,x,y,19)
            c.path(f'M38 {y+15}h444','#dce6ec',1)
        c.text('TOTAL',38,364,18,accent,700);c.text('$760.000',362,364,22,accent,700)
        c.rect(93,424,334,57,'#d8eee7',12,'none')
        c.check(119,452);c.text('Ejemplo ilustrativo · CLP',146,459,18)
    elif name == 'costos-respaldo':
        c.rect(34,22,452,455,'#fff',18)
        c.text('REVISIÓN DE UNA FILA',58,65,19,accent,700)
        for i,(label,detail) in enumerate([('ACTIVIDAD','¿Qué trabajo permite realizar?'),('CÁLCULO','Cantidad × precio unitario'),('RESPALDO','Referencia, fecha y alcance'),('FINANCIAMIENTO','¿Quién cubre este gasto?')]):
            y=116+i*95
            c.check(66,y)
            c.text(label,96,y-4,16,accent,700)
            c.text(detail,96,y+25,19)
            if i<3:c.path(f'M58 {y+48}h400','#dce6ec',1)
    elif name == 'datos-control':
        c.rect(14,55,492,350)
        c.rect(14,55,492,56,'#17364e',12,'none')
        for x,t in [(36,'REGISTRO'),(195,'VALOR'),(350,'UNIDAD')]: c.text(t,x,90,15,'#fff',700)
        for i,(a,b,d) in enumerate([('A-01','0','min'),('A-02','—','min'),('A-03','12','s')]):
            y=157+i*88
            c.text(a,36,y); c.text(b,208,y,28,accent,700); c.text(d,367,y)
            c.path(f'M30 {y+26}h460','#e0e9ef',1)
        c.label('Cero ≠ sin dato',20,429,210)
        c.label('Revisa las unidades',250,429,250)
    elif name == 'datos-ruta':
        for i,(x,y,title) in enumerate([(24,26,'FUENTE'),(180,185,'REGLAS'),(324,347,'RESULTADO')]):
            c.rect(x,y,174,122)
            c.text(title,x+18,y+30,16,accent,700)
            for j in range(3): c.path(f'M{x+18} {y+55+j*17}h{115-j*20}','#b6cbd8',5)
        c.path('M111 148v68h55m-8-7 8 7-8 7')
        c.path('M267 307v68h44m-8-7 8 7-8 7')
        c.path('M411 469v18H8V87h12','#7b99ab',2,dash='5 7')
        c.text('Rastro de versiones',35,483,16)
    elif name == 'fondos-encaje':
        for y,w,label in [(40,480,'¿QUIÉN PUEDE POSTULAR?'),(180,370,'¿QUÉ BUSCA EL FONDO?'),(320,260,'¿QUÉ FINANCIA?')]:
            x=(520-w)/2
            c.path(f'M{x} {y}h{w}l-35 92H{x+35}Z',accent,1,'#e1f0ee')
            c.text(label,260,y+52,17,weight=700,anchor='middle')
            if y<320:c.path(f'M260 {y+100}v30m-6-6 6 6 6-6')
        c.label('Encaje con tu proyecto',115,441,290)
    elif name == 'fondos-presupuesto':
        c.text('DEL TRABAJO AL RESULTADO',20,38,18,accent,700)
        for i,(title,detail) in enumerate([('ACTIVIDAD','Realizar una prueba'),('RECURSO','Tiempo + materiales'),('EVIDENCIA','Registro de resultados')]):
            y=68+i*132
            c.rect(20,y,480,110,'#fff',12)
            c.text(f'0{i+1}',40,y+43,26,accent,700)
            c.text(title,106,y+36,16,weight=700)
            c.text(detail,106,y+72,22)
            if i<2:c.path(f'M65 {y+114}v14')
        c.text('Ejemplo ilustrativo de trazabilidad',20,487,15,'#5a7283')
    elif name == 'ia-comparar':
        c.rect(18,38,222,280); c.rect(280,38,222,280)
        for x,title in [(38,'PROCESO ACTUAL'),(300,'CON APOYO DE IA')]:
            c.text(title,x,77,16,accent,700)
            for i,label in enumerate(['Calidad','Tiempo','Errores']):
                c.text(label,x,130+i*66,19)
                c.path(f'M{x} {148+i*66}h170','#dae5eb',5)
                c.circle(x+168,126+i*66,8,'#fff',accent)
        c.path('M129 329v35h262v-35M260 364v34')
        c.rect(80,400,360,74,'#17364e',16,'none')
        c.text('Mismos casos. Mismo criterio.',260,444,20,'#fff',700,anchor='middle')
    elif name == 'ia-supervision':
        c.path('M260 18 390 85 260 152 130 85Z',accent,2,'#e5f1f4')
        c.text('Evaluar la solicitud',260,91,20,weight=700,anchor='middle')
        c.path('M260 152v33H58v204M58 278h42M58 389h42M58 185h42')
        for y,label,detail in [(164,'Responder','Información verificable'),(266,'Pedir contexto','Faltan antecedentes'),(368,'Escalar','Requiere revisión humana')]:
            c.rect(104,y,390,84)
            c.text(label,125,y+32,23,accent,700)
            c.text(detail,125,y+61,18)
    elif name == 'prototipo-alcance':
        for r,fill in [(205,'#e5edf7'),(145,'#d0e0f3'),(78,'#f9fcff')]:c.circle(260,242,r,fill)
        c.text('HIPÓTESIS',260,88,17,weight=700,anchor='middle')
        c.text('FUNCIÓN ESENCIAL',260,143,16,weight=700,anchor='middle')
        c.text('PRUEBA',260,238,24,accent,700,anchor='middle')
        c.text('ACOTADA',260,265,19,accent,700,anchor='middle')
        c.path('M318 300 410 408h70')
        c.label('Criterio de éxito',275,426,220)
        c.text('Reduce el alcance, conserva la pregunta.',260,489,18,anchor='middle')
    elif name == 'prototipo-realidad':
        for x,y,w,h,title in [(25,35,300,200,'USO'),(210,185,285,165,'CONTINUIDAD'),(45,325,320,145,'EVOLUCIÓN')]:
            c.rect(x,y,w,h,'#fff',18)
            c.text(title,x+22,y+35,17,accent,700)
            if title=='USO':
                c.rect(x+22,y+57,w-44,105,'#e8eff7',8,'none')
                c.rect(x+36,y+71,58,77,'#c8daed',5,'none')
                c.path(f'M{x+111} {y+85}h135M{x+111} {y+108}h100','#8da8bf',7)
            elif title=='CONTINUIDAD':
                c.text('Código / accesos',x+22,y+75,21);c.text('Documentación',x+22,y+110,21)
            else:
                c.path(f'M{x+24} {y+108}l54-12 46-34 45 8 78-24',accent,4)
    elif name == 'tesis-entrega':
        c.rect(38,52,444,400,'#e6edf5',20)
        c.rect(38,32,200,55,'#c6d7e8',12,'none')
        for i,(label,detail) in enumerate([('01 / GUÍA DE USO','Cómo ejecutar la tarea'),('02 / DOCUMENTACIÓN','Versiones y configuración'),('03 / CONTINUIDAD','Responsable y próximo hito')]):
            y=106+i*105
            c.rect(62,y,396,88,'#fff',9)
            c.text(label,82,y+31,16,accent,700)
            c.text(detail,82,y+60,19)
            c.check(433,y+25)
    elif name == 'tesis-puente':
        c.path('M36 275Q260 30 484 275',accent,7)
        c.path('M36 278h448','#17364e',9)
        for x in [60,140,220,300,380,460]:
            y=275-210*(1-((x-260)/224)**2)/2
            c.path(f'M{x} {y}V275','#8bb6c1',2)
        c.rect(22,287,112,100,'#d5e4ed',4,'none');c.rect(386,287,112,100,'#d5e4ed',4,'none')
        for x,label in [(26,'HALLAZGO'),(194,'APLICACIÓN'),(396,'PILOTO')]:c.text(label,x,426,16,accent,700)
        c.circle(260,181,26,'#fff',accent); c.path('M249 182l8 8 16-19',accent,3)
        c.text('Personas que conectan ambos lados',260,476,18,anchor='middle')
    elif name == 'datos-investigacion-cover':
        for i in range(3):
            x,y=18+i*25,62+i*43
            c.rect(x,y,156,180,'#fff',10)
            for j in range(5):c.path(f'M{x+18} {y+31+j*25}h108','#b7cbd8',4)
        c.path('M210 250h75m-9-8 9 8-9 8','#73d8cd',4)
        c.rect(307,100,190,285,'#fff',16)
        c.text('TRAZABILIDAD',327,136,15,accent,700)
        for i,t in enumerate(['Origen','Versión','Regla','Resultado']):
            c.check(335,179+i*50);c.text(t,361,185+i*50,18)
        c.text('Un resultado que puedes explicar',260,453,21,'#d0e6ee',anchor='middle')
    elif name == 'realidad-prototipo-cover':
        c.rect(28,60,460,326,'#fff',18)
        c.rect(28,60,460,42,'#d9e4f1',15,'none')
        for x in [50,69,88]:c.circle(x,81,4,'#7a94b2')
        c.rect(47,120,100,246,'#e9eff7',8,'none')
        for y in [143,173,203]:c.path(f'M62 {y}h66','#b2c6db',5)
        c.rect(169,121,296,126,'#ecf7f5',10,'none')
        c.path('M199 218l54-43 48 19 63-46 69 23',accent,4)
        c.rect(169,268,138,72,'#e8eef7',8,'none');c.rect(327,268,138,72,'#e8eef7',8,'none')
        c.path('M439 401v43H81v-40m-8 8 8-8 8 8','#8ed7cb',3)
        c.text('Construir · observar · ajustar',260,484,22,'#d1e6ed',anchor='middle')
    elif name == 'ia-investigacion-cover':
        for x,y in [(75,80),(80,245),(65,409)]:
            c.circle(x,y,31,'#264762','#6bb5ca')
            c.path(f'M{x+33} {y} 220 245','#6bb5ca',2)
        c.rect(220,181,125,128,'#fff',22)
        c.text('IA',282,261,43,accent,700,anchor='middle')
        c.path('M345 245h45','#82d7c9',3)
        c.path('M446 164 504 186v67q0 54-58 85-58-31-58-85v-67Z','#89ddd0',3,'#20485c')
        c.path('M421 247l18 18 34-42','#a4eee0',5)
        for x,y,t in [(16,137,'FUENTES'),(24,302,'CRITERIO'),(12,466,'REVISIÓN')]:c.text(t,x,y,15,'#cde4ec',700)
        c.text('Evidencia verificable',270,404,21,'#d1e6ed')
    elif name == 'mitos-fondos-cover':
        c.path('M32 136 260 30 488 136Z','#96c9d3',2,'#29495e')
        c.text('PROPUESTA I+D',260,110,25,'#fff',700,anchor='middle')
        for i,label in enumerate(['ENCAJE','PLAN','EVIDENCIA']):
            x=50+i*153
            c.rect(x,157,112,235,'#f4f8fb',10,'none')
            c.text(f'0{i+1}',x+56,210,32,accent,700,anchor='middle')
            c.text(label,x+56,271,14,accent,700,anchor='middle')
            c.path(f'M{x+24} 304h64M{x+24} 323h64','#b9cdd9',4)
        c.rect(28,413,464,42,'#6c9bad',5,'none')
        c.text('Una base sólida para postular',260,487,21,'#d1e6ed',anchor='middle')
    elif name == 'tesis-piloto-cover':
        c.path('M258 410Q160 370 42 402V85q112-30 216 16 104-46 216-16v317q-118-32-216 8Z','#9dbbcd',2,'#f4f9fc')
        c.path('M258 102v307','#b7cdd9',2)
        for y,w in [(145,140),(177,115),(209,140),(241,95)]:c.path(f'M75 {y}h{w}','#acc2d2',5)
        c.text('HALLAZGO',75,328,18,accent,700)
        c.rect(294,137,144,208,'#deeee9',12,'none')
        c.circle(366,192,25,'#fff',accent)
        c.path('M332 263q34-48 68 0',accent,4)
        c.text('USO REAL',366,315,17,accent,700,anchor='middle')
        c.path('M166 454h187m-10-8 10 8-10 8','#88d8c9',3)
    elif name == 'primer-contacto-cover':
        c.rect(18,34,360,122,'#fff',24,'none')
        c.path('M70 154v25l36-25','#fff',1,'#fff')
        c.text('¿Cómo lo resuelven hoy?',43,84,23,accent,700)
        c.text('Escuchar antes de proponer',43,120,18)
        c.rect(138,209,364,120,'#ccece5',24,'none')
        c.path('M447 327v25l-36-25','#ccece5',1,'#ccece5')
        c.text('Probemos un flujo concreto.',160,255,22,accent,700)
        c.text('Una demo con propósito',160,292,18)
        c.rect(54,392,416,88,'#fff',14,'none')
        c.check(87,435);c.text('Acción + responsable + fecha',115,443,21,weight=700)
    elif name == 'proteger-idea-cover':
        c.rect(50,88,272,340,'#d0ddea',16,'none')
        c.rect(76,64,272,340,'#fff',16,'none')
        c.text('REGISTRO DEL PROYECTO',100,109,15,accent,700)
        for y,w in [(148,212),(183,175),(218,205),(253,140)]:c.path(f'M100 {y}h{w}','#b8cad8',5)
        c.text('Versión / autor / fecha',100,356,17)
        c.path('M378 189 489 228v95q0 94-111 144-111-50-111-144v-95Z','#b9e9de',3,'#235b64')
        c.path('M350 307v-28a28 28 0 0 1 56 0v28','#d1f1e8',6)
        c.rect(337,306,82,68,'#d1f1e8',12,'none')
        c.circle(378,333,6,accent);c.path('M378 336v17',accent,4)
    elif name == 'fondos-20-dias-cover':
        c.rect(20,44,480,412,'#fff',20,'none')
        c.rect(20,44,480,65,accent,18,'none')
        c.text('RUTA DE POSTULACIÓN',45,86,20,'#fff',700)
        for i in range(20):
            x=44+(i%5)*91;y=132+(i//5)*61
            c.rect(x,y,72,45,'#e4f1ee' if i<10 else '#edf2f7',8,'none')
            c.text(str(i+1),x+36,y+29,20,accent,700,anchor='middle')
        c.text('ENCAJE',45,422,14,accent,700);c.text('EVIDENCIA',186,422,14,accent,700);c.text('REVISIÓN',360,422,14,accent,700)
        c.path('M128 416h40m-6-5 6 5-6 5M280 416h60m-6-5 6 5-6 5',accent,2)
    else:
        raise ValueError(f'No illustration for {name}')
    return ''.join(c.parts)


def render(name, data, mobile=False):
    width,height=(600,1400) if mobile else (1200,680)
    dark=data['cover']
    palette = '#258778' if name.startswith(('fondos','mitos','proteger')) else '#366ba2' if name.startswith(('prototipo','realidad','datos')) else '#476d92'
    bg,ink,muted=('#102c42','#fff','#b9d2df') if dark else ('#f4f7fa','#17364e','#506b7e')
    c=Canvas(palette)
    c.add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">{escape(data["title"])}</title><desc id="desc">{escape(data["subtitle"]+" "+". ".join(a+": "+b for a,b in data["steps"]))}</desc>')
    c.rect(0,0,width,height,bg,0,'none')
    c.add('<g font-family="Arial, Helvetica, sans-serif">')
    c.path(f'M40 43h34', '#79cfbf' if dark else palette,4)
    c.text(data['category'],40,77,15,'#8edaca' if dark else palette,700)
    title_end=c.text(data['title'],40,134,38 if mobile else 42,ink,700,25 if mobile else 23)
    c.text(data['subtitle'],40,title_end+14,21,muted,wrap=43 if mobile else 37)
    if mobile:
        c.add(f'<g transform="translate(40 330)">{artwork(name,palette)}</g>')
        step_y=900
    else:
        c.add(f'<g transform="translate(620 100)">{artwork(name,palette)}</g>')
        step_y=385
    for i,(heading,body) in enumerate(data['steps']):
        y=step_y+i*(123 if mobile else 73)
        c.circle(53,y-6,13,'#31556b' if dark else '#dce8ef')
        c.text(str(i+1),53,y-1,13,'#d5eee8' if dark else palette,700,anchor='middle')
        c.text(heading,80,y,21,ink,700)
        c.text(body,80,y+28,18,muted,wrap=45 if mobile else 43)
    c.path(f'M40 {height-57}H{width-40}','#345064' if dark else '#d2dfe7',1)
    c.text(data['footer'],40,height-29,14 if mobile else 16,muted,wrap=65 if mobile else 120)
    c.add('</g></svg>')
    return '\n'.join(c.parts)
