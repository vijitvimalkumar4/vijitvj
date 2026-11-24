"""Photo list for the site: one generated photo per page hero and per text section, each written from that slot's copy.

  python3 alepo-site/build/copy/photos.py            # writes copy/photos.json (url -> slot -> file, alt, alt_es, prompt)

Slots: 'hero' is the page's hero photo (home and hub cards linking to the page reuse it); any other key is the
English H2 of the text section the photo sits beside. Photos were generated in Higgsfield (GPT Image 2.6, high, 3:2)
from the prompt plus STYLE, and saved as build/static/img/photos/<file>.
"""
import json, os, re

STYLE = ('High-end corporate advertising photograph in the style of a global telecom equipment brand campaign, shot by a commercial photographer '
         'on a medium-format camera. Professionally lit with a soft key light and subtle rim light, cinematic depth of field, rich contrast, '
         'a clean polished colour grade of deep blues and cool neutrals with a warm accent, crisp detail, elegant composition with generous negative space. '
         'Modern premium settings in the United States or Western Europe: glass-and-steel offices, immaculate data centres, contemporary homes and city skylines. '
         'Confident, well-dressed people of diverse backgrounds with natural expressions, not looking at the camera. Photorealistic and believable, no CGI look, no plastic skin. '
         'No text, logos or brand names anywhere: laptops, monitors, phones and clothing are plain and unbranded; screens show soft out-of-focus light.')

P = {}
def add(url, slot, prompt, alt, alt_es): P.setdefault(url, {})[slot] = {'prompt': prompt, 'alt': alt, 'alt_es': alt_es}

# ---------------- hubs, company and utility pages ----------------
add('/products/', 'hero', 'Wide view of a telecom operator\'s network operations centre at dusk: engineers at desks in front of a large video wall of network maps and graphs, out of focus.',
    'Engineers in a telecom operator\'s network operations centre', 'Ingenieros en el centro de operaciones de red de un operador')
add('/solutions/', 'hero', 'Aerial view of a European city at dusk: residential neighbourhoods, rooftop mobile masts and a stadium with its lights on.',
    'A city at dusk with homes, rooftop mobile masts and a stadium', 'Una ciudad al anochecer con viviendas, antenas móviles en las azoteas y un estadio')
add('/services/', 'hero', 'Two delivery engineers and a project manager standing by open server racks with a laptop, planning a production cutover together.',
    'Delivery engineers planning a cutover beside server racks', 'Ingenieros de implantación planificando una migración junto a los racks')
add('/products/ai-for-telecom/', 'hero', 'A contact-centre agent wearing a headset reads a suggested answer in a side panel on her monitor during an evening shift.',
    'A care agent using an AI assistant inside her console', 'Una agente de atención usando un asistente de IA en su consola')
add('/customers/', 'hero', 'An operator\'s management team in a glass meeting room with mobile masts visible on the skyline outside, smiling while reviewing results on a tablet.',
    'An operator\'s team reviewing results after go-live', 'El equipo de un operador revisando resultados tras la puesta en marcha')
add('/company/about/', 'hero', 'Telecom software engineers at a whiteboard covered in hand-drawn network architecture boxes and arrows, discussing the design, bright modern office.',
    'Telecom software engineers working through an architecture on a whiteboard', 'Ingenieros de software de telecomunicaciones trabajando una arquitectura en una pizarra')
add('/company/partners/', 'hero', 'A system integrator\'s solution engineer presenting on a laptop to an operator\'s team around a meeting table, everyone engaged.',
    'A partner\'s engineer presenting a solution to an operator\'s team', 'El ingeniero de un socio presentando una solución al equipo de un operador')
add('/company/security/', 'hero', 'A secure data-centre aisle of locked server cabinets, a card reader beside a glass door in the foreground, cool blue light.',
    'Locked server cabinets behind a card-controlled door in a data centre', 'Armarios de servidores cerrados tras una puerta con control de acceso en un centro de datos')
add('/company/careers/', 'hero', 'A young and an experienced software engineer pair-programming at one desk in a bright office, laughing, two monitors softly out of focus.',
    'Engineers pairing on code in a bright office', 'Ingenieros programando en pareja en una oficina luminosa')
add('/news/', 'hero', 'A conference hall during a telecom industry talk: a presenter at a lectern on a low stage, the audience seated in rows, seen from the back of the room.',
    'A speaker on stage at a telecom industry conference', 'Un ponente en el escenario de una conferencia del sector de las telecomunicaciones')
add('/resources/', 'hero', 'A network engineer reading a technical guide on a tablet by a window with a coffee, a notebook of hand-drawn network diagrams beside her.',
    'A network engineer reading a technical guide on a tablet', 'Una ingeniera de redes leyendo una guía técnica en una tableta')
add('/blog/', 'hero', 'A network engineer taking notes in a notebook beside an open rack of routers with blinking status lights, laptop on a cart.',
    'A network engineer taking notes beside a rack of routers', 'Un ingeniero de redes tomando notas junto a un rack de routers')
add('/contact-us/thank-you/', 'hero', 'A friendly solutions consultant with a headset at a tidy desk, reading a new enquiry on screen and getting ready to reply, warm daylight.',
    'A solutions consultant reading a new enquiry', 'Un consultor de soluciones leyendo una nueva consulta')
add('/privacy-policy/', 'hero', 'A privacy officer reviewing a printed data-protection policy at a quiet desk, laptop beside her, calm office.',
    'A privacy officer reviewing a data policy', 'Una responsable de privacidad revisando una política de datos')
add('/cookie-policy/', 'hero', 'Close-up of hands on a laptop trackpad adjusting browser settings, toggles on screen softly out of focus, home desk.',
    'A person adjusting browser settings on a laptop', 'Una persona ajustando la configuración del navegador en un portátil')
add('/accessibility/', 'hero', 'A blind man at a desk reading a website with his fingertips on a refreshable braille display placed in front of a laptop, wearing headphones, a white cane leaning against the desk.',
    'A person reading a website with a braille display and a screen reader', 'Una persona leyendo un sitio web con una línea braille y un lector de pantalla')

# ---------------- product group pages (their heroes also illustrate the Home cards) ----------------
add('/products/network-access-aaa/', 'hero', 'At dusk on a residential street in an American suburb: a grey fibre street cabinet in the foreground and a mobile mast above the rooftops behind.',
    'A mobile mast and a fibre cabinet where subscribers connect', 'Una antena móvil y un armario de fibra donde se conectan los abonados')
add('/products/billing-bss/', 'hero', 'A billing operations team of three reviewing the monthly invoice run together at a large monitor of charts, out of focus, open-plan office.',
    'A billing team reviewing the monthly invoice run', 'Un equipo de facturación revisando la facturación del mes')
add('/products/provisioning-devices/', 'hero', 'A subscriber at home plugging in a new fibre router whose lights come on, no technician present, living room.',
    'A subscriber plugging in a new router that sets itself up', 'Un abonado conectando un router nuevo que se configura solo')
add('/products/customer-care-channels/', 'hero', 'Inside a mobile operator\'s store, a staff member with a tablet helping an older customer at the counter, generic unbranded phones on the wall behind.',
    'Store staff helping a customer with a tablet', 'Personal de tienda atendiendo a un cliente con una tableta')

# ---------------- solutions ----------------
u = '/solutions/fibre-cable-isps/'
add(u, 'hero', 'A fibre technician working on an open street cabinet full of fibre splices in a residential neighbourhood, morning light.',
    'A technician working on a fibre cabinet in a residential street', 'Un técnico trabajando en un armario de fibra en una calle residencial')
add(u, 'What ISP software covers', 'An ISP\'s small operations room overlooking a town: one person watching the network, another handling billing, side by side.',
    'An ISP\'s team running the network and the business side by side', 'El equipo de un ISP gestionando la red y el negocio lado a lado')
add(u, 'Plan changes without a reconnect', 'A family on a sofa watching a film on a large TV while a teenager games online, a home router with small lights on the shelf.',
    'A family streaming at home after a speed upgrade', 'Una familia viendo contenido en casa tras ampliar su velocidad')
add(u, 'Billing day without flooding your OLTs', 'Rows of fibre network equipment in a small ISP equipment room in the evening, yellow fibre patch cords and green status lights.',
    'Optical line terminals in an ISP head-end at night', 'Terminales de línea óptica en la cabecera de un ISP por la noche')
add(u, 'Router complaints fixed without a truck roll', 'A helpdesk agent with a headset fixing a subscriber\'s Wi-Fi remotely from her desk, talking the customer through it.',
    'A helpdesk agent fixing a subscriber\'s Wi-Fi remotely', 'Una agente de soporte solucionando el wifi de un abonado a distancia')

u = '/solutions/mobile-operators/'
add(u, 'hero', 'A mobile mast silhouetted over a city skyline at sunset, antennas sharp against an indigo and amber sky.',
    'A mobile mast over a city at sunset', 'Una antena móvil sobre la ciudad al atardecer')
add(u, 'One BSS for prepaid and postpaid', 'A busy city street with people using their phones, a commuter, a student and a businesswoman, mobile subscribers of every kind.',
    'Mobile subscribers on a busy city street', 'Abonados móviles en una calle concurrida')
add(u, 'New bundles without a release', 'A product marketing team at a laptop launching a new data bundle, one colleague giving a quiet fist pump.',
    'A product team launching a new bundle', 'Un equipo de producto lanzando un nuevo paquete')
add(u, 'Subscribers stay connected where radio ends', 'A shopper on the lower level of a large indoor mall making a phone call, deep inside the building far from windows.',
    'A shopper making a call deep inside a mall', 'Una compradora haciendo una llamada en el interior de un centro comercial')

u = '/solutions/mvnos-mvnes/'
add(u, 'hero', 'The small team behind a new mobile brand in a creative office, colour swatches and blank SIM packaging mock-ups on the table.',
    'The team behind a new mobile brand', 'El equipo detrás de una nueva marca móvil')
add(u, 'Launch a brand, or host several', 'Several credit-card-sized SIM starter cards in plain sleeves of different colours fanned out on a desk next to a laptop.',
    'SIM packs for several brands run by one enabler', 'Paquetes SIM de varias marcas gestionadas por un mismo habilitador')
add(u, 'What is an MVNE?', 'An enabler\'s operations room: engineers at workstations with server racks behind a glass wall.',
    'An enabler\'s team running the systems behind several brands', 'El equipo de un habilitador gestionando los sistemas de varias marcas')
add(u, 'Ready to sell from day one', 'A pop-up stand on launch day, a staff member handing a new SIM pack to the first customer, both smiling.',
    'A new brand\'s first customer receiving a SIM', 'El primer cliente de una nueva marca recibiendo su SIM')

u = '/solutions/wifi-venues/'
add(u, 'hero', 'Fans on their phones in a modern stadium stand, Wi-Fi access points mounted under the roof canopy.',
    'Fans on their phones in a stadium with Wi-Fi access points', 'Aficionados con el móvil en un estadio con puntos de acceso wifi')
add(u, 'What captive portal software does', 'A café guest opening a laptop to sign in to the venue Wi-Fi, a small access point on the wall behind.',
    'A café guest signing in to the venue Wi-Fi', 'Un cliente de una cafetería conectándose al wifi del local')
add(u, 'Connected beyond radio coverage, by SIM', 'A traveller on a train-station concourse walking with his phone to his ear, ceiling access points above.',
    'A traveller staying connected on station Wi-Fi with his SIM', 'Un viajero conectado al wifi de la estación con su SIM')
add(u, 'Revenue from venue Wi-Fi', 'A hotel lobby where a guest buys a Wi-Fi pass on her phone at the sofa, an access point on the ceiling.',
    'A hotel guest buying a Wi-Fi pass', 'Una huésped de hotel comprando un pase wifi')

u = '/solutions/enterprise-government-networks/'
add(u, 'hero', 'A government data centre network room: rows of racks with core switches and firewalls, an engineer with a badge walking the aisle.',
    'Network racks in a government data centre', 'Racks de red en un centro de datos gubernamental')
add(u, 'Know who changed any device', 'An engineer at a rack of firewalls and core switches, laptop connected by console cable, focused.',
    'An engineer at a rack of firewalls and core switches', 'Un ingeniero ante un rack de cortafuegos y conmutadores troncales')
add(u, 'Cisco ACS replacement', 'Two engineers sliding an old access-control appliance out of a rack, a new server already installed above it.',
    'Engineers removing an end-of-life access appliance', 'Ingenieros retirando un equipo de control de acceso al final de su vida útil')
add(u, 'Evidence for every audit', 'An auditor and an IT manager reviewing an access report together in a meeting room, laptop and printed pages.',
    'An auditor reviewing access evidence with an IT manager', 'Una auditora revisando evidencias de acceso con un responsable de TI')

# ---------------- products: network access ----------------
u = '/products/aaa-server/'
add(u, 'hero', 'A home fibre router with steady green lights on a living-room shelf, a family streaming in soft focus behind it.',
    'A home fibre router online in a family living room', 'Un router de fibra conectado en el salón de una familia')
add(u, 'What an old AAA server costs you', 'A lone senior network engineer working late in an empty office, rubbing his eyes beside an old beige server, a pile of tickets.',
    'A lone network engineer working late on connection tickets', 'Un ingeniero de redes trabajando hasta tarde en incidencias de conexión')
add(u, 'Upgrades work the moment they\'re sold', 'A young woman on a sofa smiling at her phone as a film plays smoothly on the TV, router on the shelf.',
    'A subscriber enjoying a speed upgrade without reconnecting', 'Una abonada disfrutando de más velocidad sin reconectarse')
add(u, 'Care answers connection calls without escalating', 'A care agent with a headset resolving a connection call, looking at session details on her screen, relaxed.',
    'A care agent resolving a connection call from her own screen', 'Una agente resolviendo una llamada de conexión desde su pantalla')
add(u, 'RADIUS and Diameter on one server', 'A street corner with a fibre cabinet in front, a fixed-wireless antenna on a house and a mobile mast on a rooftop behind.',
    'Fibre, fixed wireless and mobile networks on one street', 'Redes de fibra, inalámbrica fija y móvil en una misma calle')

u = '/products/tacacs-server/'
add(u, 'hero', 'A network engineer logging in to a core router from a laptop on a rack shelf, ID badge on a lanyard, data-centre aisle.',
    'A network engineer logging in to a core router', 'Un ingeniero de redes accediendo a un router troncal')
add(u, 'Know who changed a production router', 'A dim data centre at 2 a.m., a single production router rack lit, an empty chair in the aisle.',
    'A production router rack at night', 'Un rack de routers de producción por la noche')
add(u, 'TACACS+ in brief', 'Close-up of a laptop connected by a blue console cable to a router port, status lights on.',
    'A laptop connected to a router\'s console port', 'Un portátil conectado al puerto de consola de un router')
add(u, 'Least-privilege access for every engineer', 'Several engineers in a network operations room, each at their own workstation wearing their own ID badge.',
    'Engineers each signing in with their own credentials', 'Ingenieros que acceden cada uno con sus propias credenciales')
add(u, 'Audit evidence where your security team works', 'A security analyst in a security operations centre reviewing an audit trail on large monitors of log timelines, out of focus.',
    'A security analyst reviewing an audit trail', 'Un analista de seguridad revisando un registro de auditoría')

u = '/products/subscriber-data-management/'
add(u, 'hero', 'A row of server racks in a mobile operator\'s core data centre, blue light, long perspective.',
    'Server racks in a mobile operator\'s core data centre', 'Racks de servidores en el centro de datos del núcleo de un operador móvil')
add(u, 'One subscriber database for both cores', 'Looking up at a telecom mast against a clear sky, with older flat antenna panels and newer compact antennas mounted on the same mast.',
    '4G and 5G antennas on the same mast', 'Antenas 4G y 5G en el mismo mástil')
add(u, 'Add 5G without replacing 4G', 'Two telecom engineers in hard hats and hi-vis vests on a rooftop beside a mast, fitting a new antenna next to the older antenna panels.',
    'Technicians adding a 5G antenna beside existing 4G equipment', 'Técnicos instalando una antena 5G junto al equipo 4G existente')

u = '/products/wifi-offload-calling/'
add(u, 'hero', 'Travellers in a bright airport terminal using their phones, a Wi-Fi access point on the ceiling.',
    'Travellers on their phones under a Wi-Fi access point', 'Viajeros con el móvil bajo un punto de acceso wifi')
add(u, 'Coverage where radio ends', 'A woman making a phone call on an underground metro platform with plain tiled walls, where mobile signal is weak.',
    'A subscriber calling over Wi-Fi in an underground station', 'Una abonada llamando por wifi en una estación subterránea')
add(u, 'One policy on Wi-Fi and mobile', 'A man walking from a sunny street into a café, still on a video call on his phone.',
    'A subscriber walking indoors without dropping his call', 'Un abonado entrando en un local sin que se corte su llamada')
add(u, 'Paid Wi-Fi on the access points venues own', 'A shopping-mall food court with an access point on a pillar, a shopper buying a Wi-Fi pass on her phone.',
    'A shopper buying a Wi-Fi pass at a mall', 'Una compradora adquiriendo un pase wifi en un centro comercial')

# ---------------- products: provisioning and devices ----------------
u = '/products/service-provisioning/'
add(u, 'hero', 'An optical line terminal chassis in a telecom exchange, rows of fibre patch cords and lit status LEDs, close perspective.',
    'An optical line terminal in a telecom exchange', 'Un terminal de línea óptica en una central de telecomunicaciones')
add(u, 'Telecom provisioning, done in one place', 'An operations engineer following service orders on a large monitor of order queues, out of focus, calm control room.',
    'An operations engineer following service orders to the network', 'Un ingeniero de operaciones siguiendo órdenes de servicio hasta la red')
add(u, 'Proof that every order landed', 'In a customer\'s home, a technician watches a new fibre ONT light turn green while holding a phone.',
    'A technician confirming a new fibre service is live', 'Un técnico confirmando que el nuevo servicio de fibra funciona')
add(u, 'Billing day without flooding the network', 'A telecom exchange at night, long rows of network equipment with steady status lights, nobody rushing.',
    'Network equipment handling a night of bulk orders', 'Equipos de red procesando una noche de órdenes masivas')
add(u, 'Keep pushing configuration to your OLTs', 'Close-up of an engineer\'s laptop connected to an OLT shelf, hands on the keyboard.',
    'An engineer pushing configuration to an OLT', 'Un ingeniero enviando configuración a una OLT')

u = '/products/device-management/'
add(u, 'hero', 'A home Wi-Fi router and fibre ONT on a living-room shelf, a child on a tablet on the rug in soft focus.',
    'A home router and fibre ONT in a subscriber\'s living room', 'Un router y una ONT de fibra en el salón de un abonado')
add(u, 'What TR-069 device management does', 'A helpdesk agent with a headset looking at a stylised router diagram on screen while on a call.',
    'A helpdesk agent checking a subscriber\'s router remotely', 'Un agente de soporte revisando el router de un abonado a distancia')
add(u, 'Router faults found in one click', 'An older man at home on the phone with support, standing beside his router, looking relieved.',
    'A subscriber on the phone with support beside his router', 'Un abonado al teléfono con soporte junto a su router')
add(u, 'Firmware updates without mass outages', 'Aerial view of a suburban street at dusk, a handful of homes lit among many.',
    'A neighbourhood of connected homes at dusk', 'Un barrio de hogares conectados al anochecer')

# ---------------- products: billing and BSS ----------------
u = '/products/digital-bss/'
add(u, 'hero', 'A billing analyst and a care manager at a mid-size operator reviewing a plan together on a laptop in a modern office.',
    'Billing and care staff reviewing a plan together', 'Personal de facturación y atención revisando juntos un plan')
add(u, 'A BSS you can take in parts', 'A team arranging sticky notes into phases on a glass-wall roadmap, planning a replacement step by step.',
    'A team planning a BSS replacement one module at a time', 'Un equipo planificando la sustitución del BSS módulo a módulo')
add(u, 'Start with the module you need', 'A CIO and an IT architect at a table pointing at a printed architecture diagram of plain boxes and lines.',
    'IT leaders choosing which module to replace first', 'Responsables de TI eligiendo qué módulo sustituir primero')
add(u, 'Unpaid bills chased without manual work', 'A woman at her kitchen table paying an overdue bill on her phone, a paper invoice beside her coffee.',
    'A customer paying an overdue bill from her phone', 'Una clienta pagando una factura vencida desde su móvil')

u = '/products/online-charging/'
add(u, 'hero', 'A young man on a busy European high street using mobile data on his phone, shoppers passing.',
    'A prepaid subscriber using data in a busy market', 'Un abonado prepago usando datos en un mercado concurrido')
add(u, 'What an online charging system does', 'A commuter sitting on a city bus looking at the phone in her hands, window light, the city passing outside.',
    'A commuter using mobile data on the bus', 'Una viajera usando datos móviles en el autobús')
add(u, 'New offers without a release', 'A marketing team around a table with blank cards and sketches, designing a new weekend data bundle.',
    'A marketing team designing a new data bundle', 'Un equipo de marketing diseñando un nuevo paquete de datos')
add(u, 'Keep your existing prepaid system', 'Packet-core equipment racks in a mobile operator\'s equipment room, neat cabling.',
    'Packet core equipment in a mobile operator\'s equipment room', 'Equipos del núcleo de paquetes en la sala de equipos de un operador móvil')

u = '/products/policy-control/'
add(u, 'hero', 'A young woman streaming video on her phone on a rooftop at golden hour, a mobile mast in the distance.',
    'A subscriber streaming video on a mobile data plan', 'Una abonada viendo vídeo con su plan de datos móviles')
add(u, 'PCRF policy control in telecom networks', 'A mobile mast on a hill serving houses with fixed-wireless antennas on their roofs.',
    'A mobile mast serving fixed-wireless homes', 'Una antena móvil que da servicio a hogares con inalámbrica fija')
add(u, 'Marketing launches plans itself', 'A marketing manager at her desk publishing a new mobile data plan on her laptop while a colleague leans in to look.',
    'A marketing manager launching a data plan herself', 'Una responsable de marketing lanzando un plan de datos ella misma')
add(u, 'Speed boosts and data passes on every plan', 'A gamer at home buying a speed boost on his phone, a game paused on the screen behind.',
    'A subscriber buying a speed boost from his phone', 'Un abonado comprando más velocidad desde su móvil')

u = '/products/prepaid-offers-vouchers/'
add(u, 'hero', 'A customer buying a mobile top-up at a London corner shop counter, the shopkeeper handing over a recharge card.',
    'A customer buying a mobile top-up at a corner shop', 'Un cliente comprando una recarga móvil en una tienda de barrio')
add(u, 'What mobile recharge software does', 'Close-up of a thumbnail scratching the panel of a plain prepaid recharge card next to a phone.',
    'A customer scratching a prepaid recharge card', 'Un cliente rascando una tarjeta de recarga prepago')
add(u, 'Promotions without IT', 'A marketing team pinning sketches of a recharge bonus campaign on a board, energetic.',
    'A marketing team planning a recharge bonus', 'Un equipo de marketing preparando una bonificación por recarga')
add(u, 'Vouchers tracked until they are used', 'A distributor in a small warehouse scanning the barcode on a box of recharge vouchers.',
    'A distributor scanning boxes of recharge vouchers', 'Un distribuidor escaneando cajas de tarjetas de recarga')

u = '/products/collections-dunning/'
add(u, 'hero', 'A postpaid customer at home reading a payment reminder notification on his phone, calm evening light.',
    'A postpaid customer reading a payment reminder', 'Un cliente pospago leyendo un recordatorio de pago')
add(u, 'What telecom collections software does', 'A collections team lead at her desk reviewing unpaid accounts on her monitor, charts out of focus, calm office.',
    'A collections team reviewing unpaid accounts', 'Un equipo de cobros revisando cuentas impagadas')
add(u, 'Barring and late fees without manual steps', 'A broadband customer at home noticing a service notice on her phone, laptop open on the table.',
    'A customer seeing a service notice on her phone', 'Una clienta viendo un aviso de servicio en su móvil')
add(u, 'Service back on payment', 'A man at his kitchen table paying an overdue phone bill on his phone, his home router lit on the counter behind him.',
    'A customer paying an overdue bill to restore service', 'Un cliente pagando una factura vencida para recuperar el servicio')

u = '/products/partner-mvno-settlement/'
add(u, 'hero', 'Wholesale managers from two operators reviewing a settlement report together across a table, printed pages and a laptop.',
    'Wholesale managers from two operators reviewing a settlement', 'Responsables mayoristas de dos operadores revisando una liquidación')
add(u, 'What telecom wholesale billing covers', 'A finance analyst at month end surrounded by stacks of printed spreadsheets, late afternoon.',
    'A finance analyst closing partner settlements at month end', 'Un analista financiero cerrando liquidaciones con socios a fin de mes')
add(u, 'Late usage records still billed', 'A billing analyst reviewing rates by destination on a large monitor showing a world map, out of focus.',
    'A billing analyst reviewing partner rates by destination', 'Una analista de facturación revisando tarifas por destino')
add(u, 'Shortfalls billed automatically', 'A wholesale account manager meeting a partner brand\'s manager in a modern office, shaking hands over a signed agreement.',
    'A wholesale manager meeting a partner brand', 'Un responsable mayorista reunido con una marca socia')

u = '/products/interconnect-roaming-settlement/'
add(u, 'hero', 'An international gateway exchange: racks of switching equipment and fibre cabling in a long equipment hall.',
    'An international gateway exchange that carries interconnect traffic', 'Una central de pasarela internacional que cursa tráfico de interconexión')
add(u, 'What an interconnect billing system does', 'A traveller at an airport arrivals hall switching on her phone after landing, suitcase beside her.',
    'A traveller switching on roaming after landing', 'Una viajera activando la itinerancia al aterrizar')
add(u, 'One vendor for BSS and settlement', 'An ageing beige settlement server beside a sleek modern rack in an equipment room.',
    'An ageing settlement server beside a modern rack', 'Un servidor de liquidación antiguo junto a un rack moderno')

u = '/products/mediation-revenue-assurance/'
add(u, 'hero', 'Close-up of network equipment in a data centre with fibre links lit, the source of the usage records that feed billing.',
    'Network equipment whose usage records feed billing', 'Equipos de red cuyos registros de uso alimentan la facturación')
add(u, 'What telecom mediation covers', 'A billing engineer checking usage files on two monitors of data rows, out of focus in a dim room.',
    'A billing engineer checking usage files before billing', 'Un ingeniero de facturación revisando ficheros de uso antes de facturar')
add(u, 'Duplicates caught before billing', 'An analyst comparing two record streams side by side on dual monitors, pointing at a match.',
    'An analyst catching duplicate usage records', 'Una analista detectando registros de uso duplicados')
add(u, 'Evidence for every disputed bill', 'A billing specialist on a call with an enterprise customer, a printed bill with one line highlighted on the desk.',
    'A billing specialist answering a disputed bill with evidence', 'Una especialista en facturación respondiendo una factura reclamada con pruebas')

u = '/products/bss-in-a-box/'
add(u, 'hero', 'A new MVNO founding team in a small office preparing for launch, unlabelled boxes of SIM starter packs on the table.',
    'A new MVNO team preparing for launch', 'El equipo de un nuevo OMV preparando el lanzamiento')
add(u, 'What the MVNO billing platform includes', 'Neatly arranged plain SIM starter packs, a phone and a laptop on a clean table, top-down.',
    'SIM starter packs ready for a new brand', 'Paquetes SIM listos para una nueva marca')
add(u, 'Package contents', 'A launch-day pop-up counter in a shopping centre where staff of a new mobile brand hand SIM packs to a queue of customers, plain unbranded signage.',
    'A new mobile brand selling its first SIMs', 'Una nueva marca móvil vendiendo sus primeras SIM')
add(u, 'No custom project before launch', 'A small team in their office on the launch day of a new mobile brand, smiling and clapping around a laptop.',
    'A brand team celebrating launch day', 'El equipo de una marca celebrando el día del lanzamiento')

# ---------------- products: care and channels ----------------
u = '/products/crm/'
add(u, 'hero', 'Care agents with headsets in a modern operator contact centre, daylight, focused but relaxed.',
    'Care agents answering calls in an operator\'s contact centre', 'Agentes atendiendo llamadas en el centro de contacto de un operador')
add(u, 'What a telecom CRM does', 'Over-the-shoulder view of a care agent working from a single customer page on her monitor, out of focus.',
    'A care agent working from a single customer page', 'Una agente trabajando desde una única página de cliente')
add(u, 'Everything about a customer on one page', 'A care agent smiling on a call, answering quickly without switching tools.',
    'A care agent answering without switching tools', 'Un agente respondiendo sin cambiar de herramienta')
add(u, 'Fewer process changes waiting on developers', 'A care operations manager adjusting a workflow on her laptop, a simple flowchart of boxes on screen.',
    'A care manager changing a process in settings', 'Una responsable de atención cambiando un proceso desde la configuración')

u = '/products/dealer-mobile-pos/'
add(u, 'hero', 'A field sales agent in a plain polo shirt signing up a customer on her smartphone at a pop-up stand in a European shopping centre.',
    'A field agent signing up a customer on her phone', 'Una agente de campo dando de alta a un cliente desde su móvil')
add(u, 'What a telecom POS does', 'A dealer in a small phone shop helping a customer activate a new SIM, phones on the wall.',
    'A dealer activating a SIM in a phone shop', 'Un distribuidor activando una SIM en una tienda de móviles')
add(u, 'One record for every dealer sale', 'A regional sales manager checking dealer sales on a tablet in the front seat of a parked car.',
    'A sales manager checking dealer sales on a tablet', 'Un responsable de ventas revisando las ventas de distribuidores en una tableta')
add(u, 'Offers sold at the point of sale', 'A door-to-door agent showing a customer a current offer on her phone at the doorstep.',
    'An agent showing a customer an offer at the doorstep', 'Una agente mostrando una oferta a un cliente en su puerta')

u = '/products/self-care-portal/'
add(u, 'hero', 'A woman at a laptop at home signing up for broadband online, mug of tea, bright window.',
    'A customer signing up for service online at home', 'Una clienta contratando un servicio en línea desde casa')
add(u, 'What self-service portal software does', 'A man at his kitchen table checking his account on a laptop, relaxed morning.',
    'A customer managing his account online', 'Un cliente gestionando su cuenta en línea')
add(u, 'Your brand in more than 30 languages', 'An Arabic-speaking woman in a Berlin apartment using a tablet on her sofa, the interface laid out right to left and out of focus.',
    'A customer using the self-care site in her own language', 'Una clienta usando el portal de autoservicio en su idioma')
add(u, 'Bills paid without a call', 'A young man paying a bill online with a bank card in one hand and a laptop in front of him.',
    'A customer paying a bill online by card', 'Un cliente pagando una factura en línea con tarjeta')

u = '/products/self-care-app/'
add(u, 'hero', 'A commuter on a train platform checking her balance in an app on her phone, the screen out of focus.',
    'A subscriber checking her balance in the operator\'s app', 'Una abonada consultando su saldo en la app del operador')
add(u, 'Fewer calls and shop visits', 'A student on a park bench changing her plan on her phone instead of visiting a shop.',
    'A student changing her plan from her phone', 'Una estudiante cambiando su plan desde el móvil')
add(u, 'Low-balance alerts in real time', 'A phone on a café table lighting up with a notification banner, a hand reaching for it.',
    'A low-balance alert lighting up a phone', 'Una alerta de saldo bajo iluminando un móvil')
add(u, 'Recharge and pay from the app', 'A man in the back of a taxi tapping to recharge his line with a mobile wallet.',
    'A subscriber recharging from the app with a mobile wallet', 'Un abonado recargando desde la app con un monedero móvil')

u = '/products/ai-virtual-agent/'
add(u, 'hero', 'A woman at home late at night chatting with an assistant on her phone, lamp light, the chat on her screen out of focus.',
    'A subscriber getting help from the AI assistant late at night', 'Una abonada recibiendo ayuda del asistente de IA por la noche')
add(u, 'What AI customer service should do', 'A calmer contact centre where agents work on a few complex cases, empty queue board in soft focus.',
    'Contact-centre agents free for complex cases', 'Agentes del centro de contacto libres para los casos complejos')
add(u, 'Account tasks done without an agent', 'A man on a commuter train changing his plan through a chat on his phone.',
    'A subscriber changing his plan through the assistant', 'Un abonado cambiando su plan a través del asistente')
add(u, 'Help in the customer\'s language, at any hour', 'An older Spanish-speaking woman in her American apartment chatting on her phone in the evening.',
    'A subscriber getting help in her own language', 'Una abonada recibiendo ayuda en su propio idioma')

u = '/products/ai-agent-assist/'
add(u, 'hero', 'A NOC engineer reading a suggested next step in a side panel of her console, network wall in soft focus behind.',
    'A NOC engineer reading a suggested next step in her console', 'Una ingeniera del NOC leyendo el siguiente paso sugerido en su consola')
add(u, 'What AI agent assist does', 'A care agent typing a question into an assistant panel beside a customer record on his monitor.',
    'A care agent asking the assistant about a bill', 'Un agente preguntando al asistente por una factura')
add(u, 'New staff answer like an expert', 'A new young care agent handling a call with confidence while a senior colleague nearby relaxes with a coffee.',
    'A new agent answering with confidence', 'Un agente nuevo respondiendo con seguridad')
add(u, 'Read-only access', 'Close-up of an engineer\'s hand on the keyboard making a change himself, the suggestion panel beside it.',
    'An engineer making the final change by hand', 'Un ingeniero aplicando él mismo el cambio final')


def slug(t): return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

def build():
    used, out = set(), {}
    for url, slots in P.items():
        for k, v in slots.items():
            base = '-'.join(slug(v['alt']).split('-')[:8])
            n, i = base, 2
            while n in used: n, i = f'{base}-{i}', i + 1
            used.add(n)
            v['file'] = n + '.webp'
            out.setdefault(url, {})[k] = v
    return out

if __name__ == '__main__':
    out = build()
    json.dump({'style': STYLE, 'pages': out}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(sum(len(v) for v in out.values()), 'photos on', len(out), 'pages')
