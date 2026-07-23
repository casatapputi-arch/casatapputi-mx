#!/usr/bin/env python3
"""Batch: extrae datos de páginas HTML existentes + catalog.js → genera 15 JSONs"""
import json, re, os, subprocess, sys
from pathlib import Path

REPO = Path("/home/enrique/casatapputi-mx")
DOMAIN = "https://casatapputi.com.mx"

# ── Datos del catalog.js ───────────────────────────────────
CATALOG_META = {
    'esencia-miel':       {'cat':'esencias','price':400,'priceLabel':'desde $400 MXN','img':'esencias-amber.webp','desc':'Extraída por alambique de floración natural. Favorece dopamina y oxitocina; promueve relajación y concentración.'},
    'esencias-naturales': {'cat':'esencias','price':400,'priceLabel':'desde $400 MXN','img':'esencias-naturales.webp','desc':'18 aromas por alambique: Violetas, Nardo, Mandarina, Menta, Rosas, Canela, Lavanda, Eucalipto, Romero, Jazmín, Sándalo, Geranio, Limón, Bergamota, Mirra, Pino, Tabaco, Lilas.'},
    'perfume-solido':     {'cat':'esencias','price':80,'priceLabel':'desde $80 MXN','img':'perfume-solido.webp','desc':'Cera de abeja, aceite de oliva y aceites esenciales botánicos. Nutre la piel mientras perfuma. 18 aromas disponibles.'},
    'lagrimas-rosas':     {'cat':'esencias','price':100,'priceLabel':'desde $100 MXN','img':'lagrimas-rosas.webp','desc':'Resina sagrada para saumerios. Limpia el aire, crea un ambiente de calma y armonía.'},
    'oleo-masaje':        {'cat':'corporal','price':150,'priceLabel':'desde $150 MXN','img':'oleo-masaje.webp','desc':'Fusión de ingredientes naturales y esencias seleccionadas. Nutre la piel y ofrece beneficios emocionales.'},
    'roll-on':            {'cat':'corporal','price':200,'priceLabel':'$200 MXN','img':'roll-on.webp','desc':'Menta, Pino y Eucalipto. Menta despeja la mente; Pino equilibra; Eucalipto purifica y facilita la respiración profunda.'},
    'friega-cannabis':    {'cat':'corporal','price':90,'priceLabel':'desde $90 MXN','img':'friega-cannabis.webp','desc':'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales. Analgésico profundo y antiinflamatorio.'},
    'chilcuague':         {'cat':'corporal','price':100,'priceLabel':'$100 MXN','img':'chilcuague.webp','desc':'Spray oral de raíz medicinal. Acción antibacteriana y antiinflamatoria sobre encías, mucosas y tejidos orales.'},
    'jabones':            {'cat':'corporal','price':90,'priceLabel':'$90 MXN / pz','img':'jabones-herbales.webp','desc':'7 variedades con aceite de coco: Miel & Avena, Menta & Romero, Manzanilla & Bergamota, Manzana & Canela, Lavanda & Violeta, Rosas & Anís Estrella, Carbón Activado.'},
    'agua-rosas':         {'cat':'facial','price':150,'priceLabel':'$150 MXN','img':'agua-rosas.webp','desc':'Tónico natural de pétalos frescos. Calma, hidrata y equilibra la piel. Sin alcohol ni químicos agresivos.'},
    'gel-rosas':          {'cat':'facial','price':150,'priceLabel':'$150 MXN','img':'gel-rosas.webp','desc':'Hidratante con extracto de pétalos frescos. Textura ligera de rápida absorción. Propiedades antioxidantes.'},
    'gel-cafe':           {'cat':'facial','price':150,'priceLabel':'$150 MXN','img':'mascarilla-cafe.webp','desc':'Tratamiento revitalizante. La cafeína estimula la circulación y despierta la piel. Tonifica y refresca.'},
    'pomada-calendula':   {'cat':'facial','price':100,'priceLabel':'desde $100 MXN','img':'pomada-calendula.webp','desc':'Cera de abeja y lípido vegetal. Antiinflamatoria y cicatrizante para heridas menores, quemaduras leves e irritaciones.'},
    'pomada-cannabis':    {'cat':'facial','price':100,'priceLabel':'desde $100 MXN','img':'pomada-cannabis.webp','desc':'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales. Para dolores musculares y articulares.'},
    'tisanas':            {'cat':'cocina','price':1300,'priceLabel':'$1,300 MXN / kg','img':'t13-01264.webp','desc':'Mezclas con ingredientes naturales y orgánicos del jardín medicinal de Huerto Roma Verde. Sin aditivos.'},
}

# ── Categorías → nombres display ───────────────────────────
CAT_NAMES = {
    'esencias': ('Esencias', 'Colección Esencias'),
    'corporal': ('Cuidado Corporal', 'Colección Corporal'),
    'facial': ('Cuidado Facial', 'Colección Facial'),
    'cocina': ('Cocina', 'Colección Cocina'),
    'hogar': ('Hogar', 'Colección Hogar'),
    'estilo': ('Estilo', 'Colección Estilo'),
}

# ── Productos relacionados por categoría ───────────────────
RELATED_POOL = {
    'esencias': [
        ('esencia-miel','Esencia de Miel','Destilación alámbica artesanal.','esencias-amber.webp',400,'desde $400 MXN','link'),
        ('perfume-solido','Perfume Sólido','Cera de abeja y aceites botánicos.','perfume-solido.webp',80,'desde $80 MXN','button'),
        ('lagrimas-rosas','Lágrimas de Rosas','Resina sagrada para saumerios.','lagrimas-rosas.webp',100,'desde $100 MXN','button'),
        ('oleo-masaje','Óleo para Masaje','Fusión sensorial que nutre la piel.','oleo-masaje.webp',150,'desde $150 MXN','button'),
    ],
    'corporal': [
        ('roll-on','Roll-On Anti Estrés','Menta, Pino y Eucalipto.','roll-on.webp',200,'$200 MXN','button'),
        ('friega-cannabis','Friega Cannabis','Analgésico herbal profundo.','friega-cannabis.webp',90,'desde $90 MXN','button'),
        ('oleo-masaje','Óleo para Masaje','Nutre piel y emociones.','oleo-masaje.webp',150,'desde $150 MXN','button'),
        ('esencia-miel','Esencia de Miel','Destilación alámbica.','esencias-amber.webp',400,'desde $400 MXN','link'),
    ],
    'facial': [
        ('agua-rosas','Agua de Rosas','Tónico de pétalos frescos.','agua-rosas.webp',150,'$150 MXN','button'),
        ('gel-rosas','Gel de Rosas','Hidratante ligera facial.','gel-rosas.webp',150,'$150 MXN','button'),
        ('gel-cafe','Gel de Café','Tratamiento revitalizante.','mascarilla-cafe.webp',150,'$150 MXN','button'),
        ('pomada-calendula','Pomada Caléndula','Cicatrizante natural.','pomada-calendula.webp',100,'desde $100 MXN','button'),
    ],
    'cocina': [
        ('salsa-matcha','Salsas Matcha','4 variedades artesanales.','salsa-matcha.webp',200,'$200 MXN / pz','button'),
        ('chilcuague','Chilcuague','Salud bucal con raíz.','chilcuague.webp',100,'$100 MXN','button'),
        ('leche-dorada','Leche Dorada','Cúrcuma y especias.','leche-dorada.webp',0,'Consultar precio','link'),
        ('miel-melipona','Miel Melipona','Miel sagrada maya.','miel-melipona.webp',350,'$350 MXN','button'),
    ],
}

# ── Contenido por producto (específico) ────────────────────
PRODUCT_CONTENT = {
    'esencia-miel': {
        'title': 'Esencia de Miel',
        'subtitle_short': 'Destilación alámbica de floración natural',
        'prod_subtitle': 'Destilación alámbica de floración natural · Néctar aromático de la colmena',
        'description': [
            'Destilada por alambique de floración natural, esta esencia pura se activa al contacto con la piel y despliega sus capas en el tiempo. Su acción sutil favorece la producción de dopamina y oxitocina, acompañando la jornada como un ritual silencioso.',
            'Es una danza simbiótica entre flores y resinas. Cada gota es un instante donde el cuerpo responde y el efecto se siente de inmediato.'
        ],
        'variant_type': 'radio',
        'variants': [
            {'section_label':'Elige tu presentación','label':'4 ml','price':400,'price_label':'$400 MXN','variant_id':'variant_01KXKRE3SV6FA8G7ACK4KQS4ZJ'},
            {'section_label':'Elige tu presentación','label':'8 ml','price':800,'price_label':'$800 MXN','variant_id':'variant_01KXKRE3SWH1NJXA2Z1K8RR4ZD'},
            {'section_label':'Elige tu presentación','label':'15 ml','price':1500,'price_label':'$1,500 MXN','variant_id':'variant_01KXKRE3SWGNW7T8SGJ54RBBVW'},
        ],
        'howto': {'eyebrow':'Cómo integrarlo a tu día','title':'Tres formas de uso','items':[
            ('Aplicación corporal','Una o dos gotas en sienes, detrás de las orejas o en el pulso. Frotar suavemente para que el calor de la piel active la esencia.'),
            ('Difusor de vela','Añade 4-5 gotas en agua para armonizar tu recámara o estudio con el dulce aroma floral de la miel.'),
            ('Masaje ritual','Combinado con óleo base, transforma un masaje cotidiano en un cuidado profundo para cuerpo y emociones.'),
        ]},
        'benefits': {'eyebrow':'Por qué la elegimos','title':'Beneficios principales','items':[
            ('🌼','Dopamina natural','Al inhalar o aplicar, el cerebro experimenta una estimulación suave que eleva el estado de ánimo de forma natural.'),
            ('🌙','Relajación profunda','Ideal para combatir el estrés acumulado al final del día gracias a sus notas cálidas y envolventes.'),
            ('✨','Concentración consciente','Ayuda a centrar la mente, optimizando la atención en actividades que requieren presencia y reflexión.'),
        ]},
        'meta_note': 'Elaborado artesanalmente en Huerto Roma Verde. Envíos a toda CDMX.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20la%20Esencia%20de%20Miel',
    },
    'esencias-naturales': {
        'title': 'Esencias Naturales',
        'subtitle_short': '18 aromas botánicos destilados por alambique',
        'prod_subtitle': '18 aromas por alambique: Violetas, Rosas, Lavanda, Jazmín y más',
        'description': [
            'Colección de 18 esencias botánicas destiladas por alambique: Violetas, Nardo, Mandarina, Menta, Rosas, Canela, Lavanda, Eucalipto, Romero, Jazmín, Sándalo, Geranio, Limón, Bergamota, Mirra, Pino, Tabaco y Lilas. Cada una captura la firma aromática única de su planta.',
            'Uso corporal o en difusor de vela. Cada esencia es pura, sin diluyentes ni fragancias sintéticas. Un viaje olfativo por 18 paisajes botánicos diferentes.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'4 ml','price':400,'price_label':'desde $400 MXN','variant_id':'variant_01KXKRE3TSYGV34TGDR9AMJMXT'}],
        'howto': {'eyebrow':'18 aromas, infinitas combinaciones','title':'Tres formas de uso','items':[
            ('Aplicación corporal','Elige tu aroma favorito y aplica en muñecas y cuello. Cada esencia tiene una personalidad distinta.'),
            ('En difusor','4-5 gotas en agua para aromatizar espacios. Combina dos o tres esencias para crear tu propia sinfonía.'),
            ('En óleo base','Mezcla unas gotas con óleo de masaje para personalizar tu experiencia corporal con el aroma que necesites.'),
        ]},
        'benefits': {'eyebrow':'Destilación pura','title':'Beneficios principales','items':[
            ('🌺','18 aromas puros','De las notas cítricas de la Mandarina a la profundidad de la Mirra. Sin diluyentes ni sintéticos.'),
            ('🧪','Alambique artesanal','Cada esencia se destila en pequeños lotes para preservar la integridad aromática de la planta.'),
            ('🎨','Personalización total','Combina aromas según tu estado de ánimo, la ocasión o el efecto que busques. Las posibilidades son infinitas.'),
        ]},
        'meta_note': 'Destilación artesanal en alambique. 4 ml por esencia.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesan%20las%20Esencias%20Naturales',
    },
    'perfume-solido': {
        'title': 'Perfume Sólido Herbal',
        'subtitle_short': 'Cera de abeja y aceites botánicos que nutren mientras perfuman',
        'prod_subtitle': 'Cera de abeja, aceite de oliva y aceites esenciales — 18 aromas',
        'description': [
            'Perfume en formato sólido elaborado con cera de abeja, aceite de oliva orgánico y aceites esenciales botánicos puros. Se funde con el calor de la piel liberando su aroma gradualmente durante horas. Nutre mientras perfuma.',
            'Disponible en 18 aromas. Sin alcohol, sin conservadores, sin fragancias sintéticas. Ideal para llevar en el bolsillo o en el bolso. Un gesto de autocuidado que cabe en la palma de la mano.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'10 gr','price':80,'price_label':'desde $80 MXN','variant_id':'variant_01KXKRE41BMQFKQQGN24NNGN3K'}],
        'howto': {'eyebrow':'Un perfume que se aplica con los dedos','title':'Tres formas de uso','items':[
            ('En muñecas y cuello','Frota una pequeña cantidad con la yema del dedo y aplica en puntos de pulso. El calor corporal activa el aroma.'),
            ('En las puntas del cabello','Un toque ligero en las puntas perfuma sutilmente y nutre el cabello seco con los aceites naturales.'),
            ('Como bálsamo multiuso','La cera de abeja y el aceite de oliva también hidratan cutículas, codos y zonas resecas.'),
        ]},
        'benefits': {'eyebrow':'Belleza consciente','title':'Beneficios principales','items':[
            ('🐝','Cera de abeja pura','Crea una barrera protectora que sella la hidratación mientras libera el aroma lentamente.'),
            ('🌿','Sin alcohol','No reseca la piel. Ideal para personas con sensibilidad a los perfumes convencionales.'),
            ('🎒','Portátil y duradero','Formato sólido que no se derrama. Ideal para viaje, gimnasio o retoques durante el día.'),
        ]},
        'meta_note': '18 aromas disponibles. Pregunta por el catálogo completo.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20Perfume%20S%C3%B3lido',
    },
    'lagrimas-rosas': {
        'title': 'Lágrimas de Rosas',
        'subtitle_short': 'Resina sagrada para saumerios y armonización del aire',
        'prod_subtitle': 'Resina de rosas para saumerios — limpia y armoniza el ambiente',
        'description': [
            'Resina sagrada de rosas seleccionadas a mano para su uso en saumerios y limpieza energética del hogar. Al quemarse sobre carbón vegetal, libera un humo blanco denso con aroma floral profundo que transforma el ambiente.',
            'Usada tradicionalmente para armonizar espacios, acompañar meditaciones y rituales, y crear una atmósfera de calma y protección. Cada lágrima es un fragmento de resina pura, sin aditivos ni esencias sintéticas.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'50 gr','price':100,'price_label':'desde $100 MXN','variant_id':'variant_01KXKRE42HG3QYR1F7G7323N6P'}],
        'howto': {'eyebrow':'El arte del saumerio','title':'Tres formas de uso','items':[
            ('Sobre carbón vegetal','Enciende un carboncillo, colócalo en un recipiente seguro y deposita una pequeña cantidad de resina encima. Disfruta el humo blanco y el aroma.'),
            ('En difusor de resinas','Los difusores eléctricos con platillo caliente funcionan perfecto. Sin humo, solo el aroma floral puro.'),
            ('Como ofrenda','Parte de la tradición mesoamericana de ofrendar resinas a los espacios que habitamos. Un gesto de gratitud y presencia.'),
        ]},
        'benefits': {'eyebrow':'Aromaterapia ancestral','title':'Beneficios principales','items':[
            ('🏠','Armoniza el hogar','El humo de resina de rosas limpia energéticamente los espacios, ideal después de visitas o al iniciar la semana.'),
            ('🧘','Acompaña la meditación','Su aroma profundo y envolvente ayuda a centrar la mente y profundizar la práctica meditativa.'),
            ('🌸','100% resina pura','Sin carbón vegetal añadido, sin esencias sintéticas. Solo resina de rosas recolectada a mano.'),
        ]},
        'meta_note': 'Resina pura de rosas. Sin aditivos. Rendimiento: ~20 saumerios por frasco.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesan%20las%20L%C3%A1grimas%20de%20Rosas',
    },
    'oleo-masaje': {
        'title': 'Óleo para Masaje',
        'subtitle_short': 'Fusión sensorial que nutre la piel y ofrece beneficios emocionales',
        'prod_subtitle': 'Fusión sensorial que nutre la piel y ofrece beneficios emocionales',
        'description': [
            'Fusión de ingredientes naturales y esencias seleccionadas para crear una experiencia de masaje completa. La base de aceites vegetales nutre profundamente mientras los aromas activan respuestas emocionales positivas.',
            'Disponible en varias combinaciones aromáticas. Ideal para masajes relajantes, descontracturantes o simplemente para consentir la piel después de un día largo.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'60 ml','price':150,'price_label':'desde $150 MXN','variant_id':'variant_01KXKRE44WX0Z8NW0RYQEXAE6Q'}],
        'howto': {'eyebrow':'El arte del masaje','title':'Tres formas de uso','items':[
            ('Masaje relajante','Aplica en espalda y hombros con movimientos largos y suaves. Ideal antes de dormir para soltar las tensiones del día.'),
            ('Masaje descontracturante','Usa mayor presión en puntos específicos de tensión. La combinación de aceites y presión libera nudos musculares.'),
            ('Automasaje','Aplica en piernas y pies al final del día. Un gesto de autocuidado que toma solo 5 minutos.'),
        ]},
        'benefits': {'eyebrow':'Piel nutrida, mente en calma','title':'Beneficios principales','items':[
            ('💆','Hidratación profunda','Los aceites vegetales penetran en capas profundas de la piel, nutriendo desde adentro sin sensación grasosa.'),
            ('😌','Aromaterapia integrada','Cada variedad combina aceites esenciales que trabajan sobre el estado de ánimo durante el masaje.'),
            ('🌱','Ingredientes naturales','Sin parabenos, sin siliconas, sin fragancias sintéticas. Solo lo que tu piel reconoce.'),
        ]},
        'meta_note': 'Aceites vegetales orgánicos. Varias combinaciones aromáticas disponibles.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20%C3%93leo%20para%20Masaje',
    },
    'roll-on': {
        'title': 'Roll-On Anti Estrés',
        'subtitle_short': 'Menta, Pino y Eucalipto en aplicación puntual',
        'prod_subtitle': 'Menta, Pino y Eucalipto en aplicación puntual',
        'description': [
            'Una sinergia precisa de tres plantas: Menta que despeja la mente, Pino que equilibra las emociones y Eucalipto que facilita la respiración profunda. Su formato roll-on lo convierte en el compañero discreto para el día a día.',
            'Aplica en sienes, cuello o detrás de las orejas y permite que los aceites hagan el resto.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'15 ml','price':200,'price_label':'$200 MXN','variant_id':'variant_01KXKRE4975W7NKDNMH2WCT3S7'}],
        'howto': {'eyebrow':'Cuándo aplicarlo','title':'Tres momentos clave','items':[
            ('En sienes','Cuando la cabeza se siente nublada o el día fue intenso. La menta activa claridad casi inmediata.'),
            ('En el pecho','Para abrir la respiración. El eucalipto y el pino facilitan inhalaciones profundas en momentos de tensión.'),
            ('Antes de dormir','Aplica en sienes y debajo de la nariz. El pino ayuda a soltar la mente y prepara el cuerpo para el descanso.'),
        ]},
        'benefits': {'eyebrow':'Por qué funciona','title':'Beneficios principales','items':[
            ('🧠','Claridad mental','La menta activa los receptores fríos de la piel y la temperatura baja induce atención inmediata.'),
            ('🌲','Respiración profunda','Eucalipto y pino abren las vías respiratorias. Una inhalación larga se siente como un pequeño respiro pulmonar.'),
            ('⏱️','Alivio instantáneo','Sin necesidad de esperar. Aplica y respira — la sensación se percibe desde los primeros segundos.'),
        ]},
        'meta_note': 'Cabe en bolsa o bolsillo. Sin alcohol.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20Roll-On%20Anti%20Estr%C3%A9s',
    },
    'friega-cannabis': {
        'title': 'Friega Cannabis',
        'subtitle_short': 'Analgésico herbal profundo para dolores musculares y articulares',
        'prod_subtitle': 'Sinergia de cannabis y plantas medicinales — analgésico profundo',
        'description': [
            'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales seleccionadas. Una fórmula líquida de alta potencia para aplicación local en zonas de dolor muscular, articular o reumático.',
            'La combinación de cannabinoides con compuestos antiinflamatorios naturales crea un efecto analgésico profundo. Aplicación en friega sobre la zona afectada. Alivio que se siente en minutos.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'60 ml','price':90,'price_label':'desde $90 MXN','variant_id':'variant_01KXKRE4A5NZG8PFKH6BB4Y3ET'}],
        'howto': {'eyebrow':'Aplicación local','title':'Tres formas de uso','items':[
            ('En articulaciones','Aplica generosamente sobre rodillas, codos o muñecas con movimientos circulares hasta que se absorba.'),
            ('En espalda','Para lumbalgias o contracturas. Pide ayuda para aplicar en la zona y cubre con una toalla tibia después.'),
            ('Después del ejercicio','Aplica en músculos fatigados tras entrenar. Ayuda a reducir la inflamación y acelera la recuperación.'),
        ]},
        'benefits': {'eyebrow':'Potencia herbal','title':'Beneficios principales','items':[
            ('🌿','Cannabis analgésico','Los cannabinoides interactúan con receptores locales del dolor, proporcionando alivio sin efectos psicoactivos.'),
            ('🔥','Antiinflamatorio','La combinación de hierbas reduce la inflamación local y mejora la movilidad articular.'),
            ('⚡','Absorción rápida','Fórmula líquida que penetra rápidamente. No deja sensación grasosa ni mancha la ropa.'),
        ]},
        'meta_note': 'Uso tópico exclusivamente. No ingerir.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20la%20Friega%20Cannabis',
    },
    'chilcuague': {
        'title': 'Chilcuague',
        'subtitle_short': 'Spray oral de raíz medicinal para salud bucal',
        'prod_subtitle': 'Raíz medicinal mexicana en spray — salud bucal natural',
        'description': [
            'Spray oral elaborado con extracto puro de raíz de chilcuague, una planta medicinal mexicana usada tradicionalmente para la salud bucal. Acción antibacteriana y antiinflamatoria sobre encías, mucosas y tejidos orales.',
            'Alivia el dolor de muelas, reduce la inflamación de encías y combate bacterias causantes del mal aliento. Un botiquín dental natural en tu bolsillo. 30 ml.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'30 ml','price':100,'price_label':'$100 MXN','variant_id':'variant_01KXKRE4CW0CFEC7G70EEGNEPH'}],
        'howto': {'eyebrow':'Salud bucal natural','title':'Tres formas de uso','items':[
            ('Para encías','Aplica 2-3 sprays directamente sobre la encía inflamada. Masajea suavemente con la lengua. Usar 2-3 veces al día.'),
            ('Para dolor de muelas','Aplica directamente sobre la muela afectada. El efecto anestésico natural del chilcuague se siente en segundos.'),
            ('Como enjuague','5 sprays en un poco de agua para enjuague bucal diario. Combate bacterias y refresca el aliento.'),
        ]},
        'benefits': {'eyebrow':'La farmacia en tu boca','title':'Beneficios principales','items':[
            ('🦷','Antibacteriano natural','El extracto de chilcuague combate las bacterias que causan caries, gingivitis y mal aliento.'),
            ('🌱','Raíz 100% mexicana','Planta medicinal usada desde tiempos prehispánicos. Rescatamos este conocimiento ancestral en formato moderno.'),
            ('⚡','Alivio inmediato','El efecto anestésico natural del chilcuague se percibe desde la primera aplicación. Sin químicos sintéticos.'),
        ]},
        'meta_note': 'Extracto puro de raíz de chilcuague. 30 ml.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20Chilcuague',
    },
    'jabones': {
        'title': 'Jabones Herbales',
        'subtitle_short': '7 variedades artesanales con aceite de coco',
        'prod_subtitle': '7 variedades con aceite de coco y botánicos — jabón artesanal',
        'description': [
            'Siete variedades de jabón artesanal elaboradas con aceite de coco como base: Miel & Avena, Menta & Romero, Manzanilla & Bergamota, Manzana & Canela, Lavanda & Violeta, Rosas & Anís Estrella y Carbón Activado.',
            'Cada variedad está formulada con ingredientes botánicos que aportan propiedades específicas: exfoliación suave, hidratación, efecto calmante o purificante. Sin detergentes agresivos, sin parabenos, sin fragancias sintéticas.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'100 gr / pz','price':90,'price_label':'$90 MXN / pz','variant_id':'variant_01KXKRE4EPW3GRAZ2WAYKJ4HX2'}],
        'howto': {'eyebrow':'Elige tu variedad','title':'Tres favoritos','items':[
            ('Miel & Avena','El más hidratante. La avena exfolia suavemente y la miel humecta. Ideal para piel seca o sensible.'),
            ('Carbón Activado','El más purificante. El carbón arrastra impurezas y toxinas. Ideal para piel grasa o con acné.'),
            ('Lavanda & Violeta','El más relajante. La lavanda calma la piel y la mente. El aroma perfecto para el baño nocturno.'),
        ]},
        'benefits': {'eyebrow':'Jabón de verdad','title':'Beneficios principales','items':[
            ('🥥','Aceite de coco real','A diferencia de los jabones comerciales, conservamos la glicerina natural. Tu piel queda limpia pero no reseca.'),
            ('🌿','7 botánicos distintos','Cada variedad está pensada para una necesidad diferente. Encuentra el tuyo o colecciona los siete.'),
            ('🧼','Sin detergentes','Sin SLS, sin parabenos, sin fragancias sintéticas. Solo ingredientes que reconoces y puedes pronunciar.'),
        ]},
        'meta_note': '7 variedades disponibles. Pregunta por el catálogo completo.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesan%20los%20Jabones%20Herbales',
    },
    'agua-rosas': {
        'title': 'Agua de Rosas',
        'subtitle_short': 'Tónico natural de pétalos frescos sin alcohol',
        'prod_subtitle': 'Tónico natural de pétalos frescos sin alcohol',
        'description': [
            'Tónico natural elaborado con pétalos frescos de rosa. Calma, hidrata y equilibra la piel sin alcohol ni químicos agresivos.',
            'Apta para piel sensible. Refrescante después del sol o en momentos de estrés. Un básico del cuidado facial diario.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'30 ml','price':150,'price_label':'$150 MXN','variant_id':'variant_01KXKRE4PR4AKS1G2XQZ963KRR'}],
        'howto': {'eyebrow':'En tu rutina facial','title':'Tres formas de uso','items':[
            ('Con algodón','Tras la limpieza, aplica con un disco de algodón para tonificar y cerrar los poros.'),
            ('Como bruma','Transfiere a un atomizador y rocía sobre el rostro durante el día para refrescar al instante.'),
            ('Después del sol','Aplica generosamente sobre piel caliente para calmar y rehidratar tras la exposición solar.'),
        ]},
        'benefits': {'eyebrow':'El tónico ideal','title':'Beneficios principales','items':[
            ('💧','Calma e hidratación','La rosa fresca calma irritaciones y devuelve la hidratación sin agredir. Ideal para pieles reactivas.'),
            ('⚖️','Tónico equilibrante','Restablece el pH natural de la piel tras la limpieza, dejándola lista para tu serum o crema.'),
            ('🌸','Piel sensible','Sin alcohol, sin químicos agresivos. Una fórmula amable que respeta tu piel y el medio ambiente.'),
        ]},
        'meta_note': 'Sin alcohol · Apto para piel sensible.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20Agua%20de%20Rosas',
    },
    'gel-rosas': {
        'title': 'Gel de Rosas',
        'subtitle_short': 'Hidratante ligera con extracto de pétalos frescos',
        'prod_subtitle': 'Hidratante ligera con extracto de pétalos frescos',
        'description': [
            'Hidratante con extracto de pétalos frescos. Textura ligera de rápida absorción para todo tipo de piel. Deja una sensación fresca sin sensación grasosa.',
            'Propiedades antioxidantes que restauran luminosidad y elasticidad. Aroma fresco y floral que se percibe sutil durante todo el día.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'100 ml','price':150,'price_label':'$150 MXN','variant_id':'variant_01KXKRE4T1WVW6DCMJC6PBMY2H'}],
        'howto': {'eyebrow':'Cada día y cada noche','title':'Tres formas de uso','items':[
            ('Mañana y noche','Aplica sobre piel limpia después del tónico. Se absorbe rápido y deja la piel lista para el día.'),
            ('Antes del maquillaje','Una capa ligera prepara la piel, mantiene la hidratación y prolonga la duración del maquillaje.'),
            ('Tras la limpieza','Después de tu jabón herbal, calma y equilibra la piel antes del serum o aceite facial.'),
        ]},
        'benefits': {'eyebrow':'Una piel luminosa','title':'Beneficios principales','items':[
            ('💦','Hidratación profunda','Penetra capas superficiales de la piel y retiene humedad durante horas sin sensación pegajosa.'),
            ('🌹','Antioxidante natural','El extracto de pétalos frescos combate los radicales libres que causan envejecimiento prematuro.'),
            ('✨','Luminosidad','Restaura la luz natural del rostro. La piel luce más fresca, descansada y con tono uniforme.'),
        ]},
        'meta_note': 'Apto para todo tipo de piel · Libre de parabenos.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20Gel%20de%20Rosas',
    },
    'gel-cafe': {
        'title': 'Gel de Café',
        'subtitle_short': 'Tratamiento revitalizante con cafeína natural',
        'prod_subtitle': 'Tratamiento revitalizante con cafeína natural',
        'description': [
            'Tratamiento facial revitalizante formulado con cafeína natural extraída de café orgánico. La cafeína estimula la microcirculación, despierta la piel y reduce la apariencia de ojeras y bolsas.',
            'Textura gel ligera que se absorbe instantáneamente. Ideal para las mañanas o antes de un evento. Tonifica, refresca y deja el rostro suave y luminoso. 30 ml.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'30 ml','price':150,'price_label':'$150 MXN','variant_id':'variant_01KXKRE4VBFHPMSDGDMWCM69VX'}],
        'howto': {'eyebrow':'Tu café matutino para la piel','title':'Tres formas de uso','items':[
            ('En la mañana','Aplica después de lavar el rostro. El frescor y la cafeína despiertan la piel al instante.'),
            ('En ojeras','Un toque ligero con la yema del dedo debajo de los ojos. La cafeína reduce la hinchazón.'),
            ('Antes de un evento','Aplica 15 minutos antes de maquillarte. La piel se ve más firme, luminosa y despierta.'),
        ]},
        'benefits': {'eyebrow':'Cafeína para tu rostro','title':'Beneficios principales','items':[
            ('☕','Cafeína activa','Estimula la circulación, reduce bolsas y ojeras y da un efecto tensor inmediato.'),
            ('❄️','Efecto refrescante','La textura gel proporciona una sensación fría que despierta y tonifica al contacto.'),
            ('🌱','Café orgánico','Usamos café de comercio justo. Lo que es bueno para tu piel también es bueno para quien lo cultiva.'),
        ]},
        'meta_note': 'Cafeína natural de café orgánico. Textura gel ligera. 30 ml.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20el%20Gel%20de%20Caf%C3%A9',
    },
    'pomada-calendula': {
        'title': 'Pomada de Caléndula',
        'subtitle_short': 'Cicatrizante y antiinflamatoria con cera de abeja y caléndula',
        'prod_subtitle': 'El botiquín natural de tu casa — cicatriza, calma y protege',
        'description': [
            'Cera de abeja y lípido vegetal con extracto de caléndula. Antiinflamatoria y cicatrizante para heridas menores, quemaduras leves, irritaciones y zonas resecas.',
            'Hidratación profunda y efecto antiarrugas preventivo. Una pomada multitarea que merece un lugar en tu botiquín natural.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentaciones','label':'30 gr / 50 gr','price':100,'price_label':'desde $100 MXN','variant_id':'variant_01KXKRE4Y7BRJ43SP68NJCQP2A'}],
        'howto': {'eyebrow':'Una pomada, muchos usos','title':'Tres formas de uso','items':[
            ('En heridas menores','Aplica una capa fina sobre raspones, cortaditas o picaduras. Acelera la regeneración y previene infecciones.'),
            ('En quemaduras leves','Tras la exposición solar o en zonas irritadas. Calma la rojez y devuelve el confort a la piel.'),
            ('Como hidratante','En zonas secas del rostro o las manos. La cera de abeja sella la hidratación durante horas.'),
        ]},
        'benefits': {'eyebrow':'Una flor que cuida','title':'Beneficios principales','items':[
            ('🩹','Cicatrizante natural','Estimula la regeneración celular y reduce el tiempo de curación de heridas y quemaduras leves.'),
            ('🧴','Antiinflamatoria','Calma la rojez, hinchazón e irritación en piel sensible, zonas reactivas o quemadas por el sol.'),
            ('✨','Antiarrugas natural','Hidrata capas profundas y previene líneas de expresión por deshidratación. Uso preventivo diario.'),
        ]},
        'meta_note': 'Caléndula cultivada en Huerto Roma Verde.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20la%20Pomada%20de%20Cal%C3%A9ndula',
    },
    'pomada-cannabis': {
        'title': 'Pomada Cannabis',
        'subtitle_short': 'Sinergia herbal para dolores musculares y articulares',
        'prod_subtitle': 'Sinergia de cannabis y plantas — alivio muscular localizado',
        'description': [
            'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales en formato pomada. Para dolores musculares, articulares y reumáticos. Aplicación local sin efectos psicoactivos.',
            'La base de cera de abeja y aceites vegetales permite una liberación sostenida de los compuestos activos sobre la zona afectada.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentaciones','label':'30 gr / 50 gr','price':100,'price_label':'desde $100 MXN','variant_id':'variant_01KXKRE50MP0WH4HM59A4YAN3D'}],
        'howto': {'eyebrow':'Aplicación local','title':'Tres formas de uso','items':[
            ('En articulaciones','Aplica una capa generosa sobre la zona afectada y masajea suavemente. Úsalo 2-3 veces al día.'),
            ('En contracturas','Aplica sobre el músculo tenso y cubre con una toalla tibia. El calor potencia la absorción.'),
            ('Masaje terapéutico','Combínalo con un masaje suave para distribuir el producto y activar la circulación local.'),
        ]},
        'benefits': {'eyebrow':'Alivio natural','title':'Beneficios principales','items':[
            ('🌿','Cannabis + hierbas','La sinergia de cannabinoides con plantas medicinales crea un efecto analgésico más completo.'),
            ('🐝','Cera de abeja','Base natural que permite una liberación lenta y sostenida de los activos sobre la piel.'),
            ('⚡','Sin efectos psicoactivos','Uso tópico local. Los cannabinoides actúan sobre receptores locales sin llegar al torrente sanguíneo.'),
        ]},
        'meta_note': 'Uso tópico. No ingerir. Cannabis de cultivo orgánico.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesa%20la%20Pomada%20Cannabis',
    },
    'tisanas': {
        'title': 'Tisanas Herbales',
        'subtitle_short': 'Mezclas del jardín medicinal de Huerto Roma Verde',
        'prod_subtitle': 'Mezclas del jardín medicinal de Huerto Roma Verde — sin aditivos',
        'description': [
            'Mezclas de hierbas seleccionadas del jardín medicinal de Huerto Roma Verde. Cada tisana está pensada para un momento distinto del día: despertar, digerir, relajar o descansar.',
            'Sin aditivos, sin saborizantes artificiales, sin azúcares añadidos. Solo hierbas secadas al sol y empacadas a mano. 1 kg rinde aproximadamente 80 tazas.'
        ],
        'variant_type': 'single',
        'variants': [{'section_label':'Presentación','label':'1 kg','price':1300,'price_label':'$1,300 MXN / kg','variant_id':'variant_01KXKRE5BKE0YKQJJAKARH65BP'}],
        'howto': {'eyebrow':'El ritual de la tisana','title':'Tres momentos del día','items':[
            ('Por la mañana','La mezcla de menta y romero despierta los sentidos y prepara el cuerpo para el día.'),
            ('Después de comer','La mezcla de manzanilla e hinojo ayuda a la digestión y evita la pesadez post-comida.'),
            ('Antes de dormir','La mezcla de lavanda y tila calma la mente y prepara el cuerpo para un sueño profundo.'),
        ]},
        'benefits': {'eyebrow':'Del jardín a tu taza','title':'Beneficios principales','items':[
            ('🌿','100% orgánico','Hierbas cultivadas sin pesticidas en Huerto Roma Verde. Del jardín a tu taza sin intermediarios.'),
            ('☕','Sin cafeína','Tisanas puras, sin té negro ni verde. Perfectas para cualquier hora del día, incluso antes de dormir.'),
            ('🎁','1 kg rinde 80+ tazas','Formato a granel sin empaques individuales. Menos residuos, más tazas, mejor para el planeta.'),
        ]},
        'meta_note': 'Hierbas orgánicas de Huerto Roma Verde. Sin aditivos. 1 kg.',
        'wa_text': 'Hola%20Casa%20Tapputi%2C%20me%20interesan%20las%20Tisanas%20Herbales',
    },
}

def make_json(slug):
    meta = CATALOG_META[slug]
    content = PRODUCT_CONTENT.get(slug, {})
    cat_name, coleccion = CAT_NAMES.get(meta['cat'], (meta['cat'].title(), f'Colección {meta["cat"].title()}'))
    
    title = content.get('title', slug.replace('-',' ').title())
    img = meta['img']
    
    # Related products (filter out self)
    related_products = []
    for r_id, r_name, r_desc, r_img, r_price, r_label, r_link in RELATED_POOL.get(meta['cat'], [])[:4]:
        if r_id != slug:
            related_products.append({
                'id': r_id, 'name': r_name, 'slug': r_id,
                'desc': r_desc, 'price': r_price, 'price_label': r_label,
                'image': r_img, 'link_type': r_link
            })
    # Ensure 4
    while len(related_products) < 4:
        related_products.append(related_products[0])
    related_products = related_products[:4]
    
    # Build howto items
    howto_items = []
    for h in content.get('howto', {}).get('items', []):
        howto_items.append({'title': h[0], 'description': h[1]})
    
    # Build benefit items  
    benefit_items = []
    for b in content.get('benefits', {}).get('items', []):
        benefit_items.append({'icon': b[0], 'title': b[1], 'description': b[2]})
    
    data = {
        'slug': slug,
        'title': title,
        'meta_description': meta['desc'][:160],
        'og_image': f'{DOMAIN}/assets/images/{img}',
        'hero_image': img,
        'product_image': img,
        'breadcrumb_name': title,
        'prod_eyebrow': cat_name,
        'prod_title': title,
        'prod_subtitle': content.get('prod_subtitle', meta['desc'][:100]),
        'eyebrow': coleccion,
        'h1': title,
        'subtitle_short': content.get('subtitle_short', meta['desc'][:60]),
        'description': content.get('description', [meta['desc'], '']),
        'variant_type': content.get('variant_type', 'single'),
        'variants': content.get('variants', [{
            'section_label': 'Presentación',
            'label': f'{meta["price"]} MXN',
            'price': meta['price'],
            'price_label': meta['priceLabel'],
            'variant_id': 'variant_PLACEHOLDER'
        }]),
        'price_display': meta['priceLabel'],
        'price_present': content.get('variants', [{}])[0].get('label', '') if content.get('variants') else '',
        'meta_note': content.get('meta_note', 'Elaborado artesanalmente en Huerto Roma Verde.'),
        'howto': {
            'eyebrow': content.get('howto', {}).get('eyebrow', 'Cómo usarlo'),
            'title': content.get('howto', {}).get('title', 'Tres formas de uso'),
            'items': howto_items or [
                {'title': 'Uso 1', 'description': 'Descripción.'},
                {'title': 'Uso 2', 'description': 'Descripción.'},
                {'title': 'Uso 3', 'description': 'Descripción.'},
            ]
        },
        'benefits': {
            'eyebrow': content.get('benefits', {}).get('eyebrow', 'Por qué lo elegimos'),
            'title': content.get('benefits', {}).get('title', 'Beneficios principales'),
            'items': benefit_items or [
                {'icon': '🌿', 'title': 'Beneficio 1', 'description': 'Descripción.'},
                {'icon': '✨', 'title': 'Beneficio 2', 'description': 'Descripción.'},
                {'icon': '💚', 'title': 'Beneficio 3', 'description': 'Descripción.'},
            ]
        },
        'related': {
            'eyebrow': 'Complementa tu experiencia',
            'title': 'También te puede interesar',
            'products': related_products
        },
        'cta': {
            'title': '¿Tienes dudas sobre este producto?',
            'subtitle': 'Escríbenos por WhatsApp y te asesoramos personalmente.'
        },
        'wa_text': content.get('wa_text', f'Hola%20Casa%20Tapputi%2C%20me%20interesa%20{title.replace(chr(32),chr(37)+chr(50)+chr(48))}'),
        'schema_name': title,
        'schema_description': meta['desc'][:160],
        'schema_image': img,
        'schema_price': meta['price'],
    }
    
    # Fix wa_text encoding
    data['wa_text'] = data['wa_text']
    
    return data

# ── Main ───────────────────────────────────────────────────
if __name__ == '__main__':
    slugs = [
        'esencia-miel','esencias-naturales','perfume-solido','lagrimas-rosas','oleo-masaje',
        'roll-on','friega-cannabis','chilcuague','jabones',
        'agua-rosas','gel-rosas','gel-cafe','pomada-calendula','pomada-cannabis',
        'tisanas'
    ]
    
    datos_dir = REPO / 'datos'
    datos_dir.mkdir(parents=True, exist_ok=True)
    
    for slug in slugs:
        data = make_json(slug)
        path = datos_dir / f'{slug}.json'
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'✅ {slug}.json')
    
    print(f'\n🎉 {len(slugs)} JSONs generados en datos/')
    print('Ahora corre el generador:\n')
    
    # Run generator for all
    for slug in slugs:
        result = subprocess.run(
            ['python3', str(REPO/'scripts'/'generate-product.py'), str(datos_dir/f'{slug}.json')],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f'✅ {slug}')
        else:
            print(f'❌ {slug}: {result.stderr[:200]}')
    
    print('\n🎉 ¡15 productos generados!')
