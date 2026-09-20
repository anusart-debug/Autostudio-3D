/* ---------------- data ---------------- */
const VEHICLES=[
 {id:"wrap",subj:"bus",th:"รถเมล์ Bus Wrap โฆษณา",en:"Ad Wrap Bus",p:"a modern Thai city bus fully covered in a seamless full-body vinyl advertising wrap, crisp printed graphics following the body panels and window line"},
 {id:"dd",subj:"double-decker coach",th:"รถบัส 2 ชั้น Double Decker",en:"Double Decker",p:"a double-decker advertising coach with a tall flat flank used as a billboard surface, glossy printed wrap across both decks"},
 {id:"bus3d",subj:"city bus",th:"รถเมล์ 3D ทั่วไป",en:"City Bus 3D",p:"a clean modern low-floor city bus, factory livery, precise panel gaps and chrome trim"},
 {id:"shelter",subj:"bus shelter",stat:1,th:"ป้ายรถเมล์ Bus Shelter",en:"Bus Shelter",p:"a premium illuminated bus shelter with a backlit vertical advertising lightbox, brushed steel frame and tempered glass"},
 {id:"muvmi",subj:"electric tuk-tuk",th:"ตุ๊กตุ๊กไฟฟ้า MuvMi",en:"E-Tuk Tuk",p:"a compact electric Thai tuk-tuk shuttle with a branded canopy and side panel advertising, modern rounded EV bodywork"},
 {id:"billboard",subj:"billboard",stat:1,th:"ป้ายบิลบอร์ด",en:"Billboard",p:"a large roadside advertising billboard raised on steel support columns beside the road, one flat printed poster face in a clean frame with a row of spotlights along its lower edge"},
 {id:"ledscreen",subj:"LED screen",stat:1,th:"จอ LED กลางแจ้ง",en:"Digital LED",p:"a large outdoor digital LED advertising screen mounted on a steel structure or building facade, bright emissive panel with fine pixel pitch glowing against the surroundings"}
];

const LOCATIONS=[
 {id:"sathorn",th:"ถนนสาทร",en:"Sathorn Rd",p:"Sathorn Road Bangkok, a canyon of glass office towers, elevated BTS track overhead, dense afternoon traffic",lat:13.722,lng:100.529,conf:"high",src:"transitbangkok.com",bus:["17 (4-3)","77 (3-45)","149 (4-53)","167 (4-26)","116","21E (4-7E)","173","BRT"]},
 {id:"sukhumvit",th:"สุขุมวิท",en:"Sukhumvit",p:"Sukhumvit Road Bangkok, BTS skytrain viaduct above, layered shop signage and billboards on both sides",lat:13.738,lng:100.56,conf:"high",src:"transitbangkok.com",bus:["2 (3-1)","25","38 (3-8)","40 (4-39)","48 (3-11)","501 (1-53)","508","511 (3-22E)","513","136","185","3-53"]},
 {id:"thonglor",th:"ทองหล่อ",en:"Thong Lo",p:"Thong Lo Bangkok, boutique cafes and designer concrete facades, tree-lined upscale street",lat:13.724,lng:100.5786,conf:"high",src:"route.in.th",bus:["2 (3-1)","25","38 (3-8)","40 (4-39)","48 (3-11)","98","501 (1-53)","508","511 (3-22E)","513","184","71 (1-39)"]},
 {id:"victory",th:"อนุสาวรีย์ชัยสมรภูมิ",en:"Victory Mon.",p:"Victory Monument Bangkok, the tall obelisk at the centre of a wide traffic circle, buses sweeping around the roundabout",lat:13.765,lng:100.5378,conf:"high",src:"transitbangkok.com",bus:["8 (2-38)","14","18","29","34","36","38 (3-8)","54","59 (1-8)","62","74","77 (3-45)"]},
 {id:"sanamluang",th:"สนามหลวง",en:"Sanam Luang",p:"Sanam Luang Bangkok, the vast open royal field with the white walls and golden spires of the Grand Palace behind",lat:13.7554,lng:100.493,conf:"medium",src:"transitbangkok.com",bus:["1 (3-35)","44 (2-42)","47 (3-41)","53 (2-9)","59 (1-8)","82 (4-15)","33","503"]},
 {id:"suthat",th:"วัดสุทัศน์",en:"Wat Suthat",p:"Wat Suthat Bangkok, the towering red Giant Swing and the temple's tiered roof in the background",lat:13.7515,lng:100.5013,conf:"medium",src:"transitbangkok.com",bus:["12 (3-37)","42","42L (4-10L)","42R (4-10R)","3 (2-37)","3-53","10","35 (4-8)"]},
 {id:"arun",th:"วัดอรุณฯ",en:"Wat Arun",p:"the riverside promenade opposite Wat Arun Bangkok, the porcelain-tiled prang rising over the Chao Phraya river",lat:13.7437,lng:100.4889,conf:"medium",src:"transitbangkok.com",bus:["47 (3-41)","82 (4-15)","25","48 (3-11)","508","1 (3-35)","44 (2-42)","53 (2-9)","32","512"]},
 {id:"golden",th:"ภูเขาทอง",en:"Golden Mount",p:"Wat Saket Golden Mount Bangkok, the gilded chedi on its green hill above old-town rooftops",lat:13.7539,lng:100.5069,conf:"high",src:"transitbangkok.com",bus:["8 (2-38)","15 (4-2)","35 (4-8)","37 (4-9)","47 (3-41)","49 (2-43)"]},
 {id:"yaowarat",th:"เยาวราช",en:"Yaowarat",p:"Yaowarat Chinatown Bangkok, dense stacked neon Chinese signage glowing over a narrow street",lat:13.74,lng:100.51,conf:"high",src:"transitbangkok.com",bus:["1 (3-35)","4 (3-36)","35 (4-8)","40 (4-39)","53 (2-9)","73 (2-45)","73ก","507 (3-13)","529 (4-28)","542","3-53"]},
 {id:"lanluang",th:"แยกหลานหลวง",en:"Lan Luang Jct",p:"Lan Luang intersection Bangkok, old-town shophouse rows and a wide signalised crossing",lat:13.757,lng:100.509,conf:"high",src:"transitbangkok.com",bus:["2 (3-1)","2E (3-2E)","8 (2-38)","44 (2-42)","59 (1-8)","60 (1-38)","79 (4-42)","183","511 (3-22E)","4-68","A4","S1"]},
 {id:"asoke",th:"แยกอโศกมนตรี 21",en:"Asok Jct",p:"Asok Montri intersection Sukhumvit 21 Bangkok, the skywalk ring and glass towers around the MRT-BTS interchange",lat:13.737,lng:100.56,conf:"high",src:"transitbangkok.com",bus:["2 (3-1)","25","38 (3-8)","40 (4-39)","48 (3-11)","136","185","501 (1-53)","508","511 (3-22E)","3-53","3-54"]},
 {id:"planb",th:"แยกมิตรสัมพันธ์ Plan B Tower",en:"Plan B Tower",p:"Mit Samphan junction Bangkok in front of a modern media-company office tower clad in large LED advertising screens",lat:13.7492,lng:100.5605,conf:"medium",src:"route.in.th",bus:["11","23","38","58","72","93","113","184","512"]},
 {id:"mahanakhon",th:"ตึกมหานคร",en:"Mahanakhon",p:"King Power Mahanakhon Bangkok, the pixelated stepped-glass skyscraper towering over Silom",lat:13.7226,lng:100.5285,conf:"medium",src:"route.in.th",bus:["15","77","115","163A","504","514","544","547","76","172","177"]},
 {id:"riverside",th:"ริมเจ้าพระยา",en:"Riverside",p:"the Chao Phraya riverside road Bangkok, water and long-tail boats on one side, city skyline on the other",lat:13.726,lng:100.514,conf:"medium",src:"route.in.th",bus:["1","35","75","15","504","547","544","163A","77","115","514"]},
 {id:"kpp2",th:"ถนนกำแพงเพชร 2",en:"Kamphaeng Phet 2",p:"Kamphaeng Phet 2 Road in the Chatuchak district of Bangkok, a wide multi-lane road lined with bus depots, wholesale market warehouses and railway land, the elevated rail viaduct running alongside",lat:13.808,lng:100.553,conf:"medium",src:"route.in.th",bus:["3","49","77","96","103","104","122","134","136","138","145","512"]},
 {id:"mochit2",th:"หมอชิต 2",en:"Mo Chit 2 Terminal",p:"Mo Chit 2 Northern Bus Terminal Bangkok, long-distance coaches lined up in the numbered departure bays under the vast terminal canopy, passengers with luggage on the concourse",lat:13.8135,lng:100.549,conf:"high",src:"prachachat.net",bus:["3","49","77","96","134","136","138","145","204","509","536","A1"]},
 {id:"chatuchak",th:"ป้ายรถเมล์จตุจักร",en:"Chatuchak Stop",p:"the roadside bus stop outside Chatuchak Weekend Market Bangkok, a covered shelter with advertising panels beside the park railings, market stalls and crowds behind, the elevated Mo Chit station overhead",lat:13.7995,lng:100.55,conf:"medium",src:"route.in.th",bus:["3","8","26","27","29","34","39","44","52","59","96","104"]},
 {id:"centralworld",th:"เซ็นทรัลเวิลด์",en:"CentralWorld",p:"the road in front of the CentralWorld shopping complex Bangkok, a huge curved glass facade with giant LED media screens above the open plaza, wide pedestrian crossing and skywalk",lat:13.7466,lng:100.5396,conf:"high",src:"transitbangkok + route.in.th + Moovit (หยุดที่ป้ายจริง)",bus:["2 (3-1)","13 (3-38)","14 (3-39)","17 (4-3)","54 (2-44)","73 (2-45)","73ก","74","77 (3-45)","79 (4-42)","204 (2-52)","504","504E (1-18E)","505 (2-24E)","511 (3-22E)","514 (1-54)","2-34L","2-34R","3-54","4-35","A3"]},
 {id:"ratchadamri",th:"ถนนราชดำริ",en:"Ratchadamri Rd",p:"Ratchadamri Road Bangkok, a broad boulevard lined with luxury hotels and shopping centres, the BTS viaduct running down the middle and mature trees along the pavement",lat:13.742,lng:100.54,conf:"high",src:"transitbangkok ระดับป้าย (ถ.ราชดำริ)",bus:["2 (3-1)","13 (3-38)","14 (3-39)","17 (4-3)","54 (2-44)","73 (2-45)","73ก","74","77 (3-45)","79 (4-42)","204 (2-52)","504","504E (1-18E)","505 (2-24E)","511 (3-22E)","514 (1-54)","2-34L","2-34R","3-54","4-35","A3"]},
 {id:"rama1",th:"ถนนพระรามที่ 1",en:"Rama I Rd",p:"Rama I Road Bangkok, the busy shopping artery through Siam with connected skywalks overhead, the BTS Siam interchange above and large billboards on both sides",lat:13.746,lng:100.534,conf:"medium",src:"transitbangkok ป้ายสยาม/รพ.ตำรวจ (ส่วนใหญ่วิ่งผ่าน ไม่ได้จอดหน้าเซ็นทรัลเวิลด์)",bus:["15 (4-2)","16","25","29 (1-1)","34 (1-3)","36 (2-40)","40 (4-39)","47 (3-41)","48 (3-11)","50 (2-7)","93 (1-40)","113","204 (2-52)","501 (1-53)","508","3-53"]},
 {id:"expressway",th:"บนทางด่วนพิเศษ",en:"Expressway",p:"high on an elevated toll expressway above Bangkok, a sweeping concrete viaduct carried on tall piers with steel crash barriers along both edges, large roadside billboards raised level with the deck, overhead direction sign gantries, a toll plaza and its canopy further ahead, the dense city skyline and rooftops spreading out far below",lat:13.764,lng:100.554,conf:"high",src:"thaibusroutes.com",bus:["510 (1-20E)","511 (3-22E)","522 (1-22E)","505 (2-24E)","536 (3-24E)","138 (4-22E)","145 (3-19E)","180 (3-20E)","504E (1-18E)","513E (3-23E)","529E (4-29E)","552E (3-25E)"]},
 {id:"motorway",th:"มอเตอร์เวย์",en:"Motorway",p:"a wide intercity motorway outside Bangkok, six open lanes of smooth asphalt with painted lane markings running straight to the horizon, a landscaped central median, green verges and utility poles along the shoulder, tall billboards standing back from the carriageway, big blue overhead sign gantries, wide open sky above and low hills in the distance",lat:13.71,lng:100.75,conf:"low",src:"ไม่พบสายรถเมล์ประจำทาง",bus:[]}
];

const ANGLES=[
 {id:"hero34",th:"3/4 หน้า ฮีโร่ช็อต",en:"3/4 Front Hero",p:"three-quarter front hero angle, camera at hood height, vehicle filling two thirds of frame"},
 {id:"low",th:"มุมต่ำ อลังการ",en:"Low Angle",p:"dramatic low camera angle close to the asphalt looking up, exaggerated presence and scale"},
 {id:"profile",th:"ด้านข้างเต็มคัน",en:"Side Profile",p:"perfectly perpendicular side elevation, entire flank flat to camera so the full wrap artwork reads"},
 {id:"rear34",th:"3/4 หลัง",en:"3/4 Rear",p:"three-quarter rear angle showing the tail panel and the receding flank"},
 {id:"drone",th:"มุมสูง โดรน",en:"Drone / Top",p:"elevated drone angle looking down at the street, roof and surrounding traffic visible"},
 {id:"street",th:"ระดับสายตาคนเดิน",en:"Street Level",p:"pedestrian eye level from the pavement, shallow depth of field, people out of focus in the foreground"},
 {id:"track",th:"แพนตามรถวิ่ง",en:"Tracking Pan",p:"tracking shot moving alongside the vehicle, motion-blurred background, wheels showing rotational blur"},
 {id:"detail",th:"โคลสอัพลายกราฟิก",en:"Wrap Detail",p:"tight macro detail of the printed wrap surface, vinyl texture and panel seam visible"}
];

/* v41: เพิ่ม time (ช่วงเวลาที่แสงแบบนี้เกิดจริง) · mood (โทนสีที่จะได้) · g1/g2 (ไล่เฉดบนการ์ด)
   เป็นข้อมูลไว้แสดงผลอย่างเดียว ไม่แตะ p ซึ่งเป็นข้อความที่ส่งให้ AI จริง — ของเดิม 8 แบบครบเหมือนเดิม */
const LIGHTS=[
 {id:"golden",th:"แสงสีทอง บ่ายคล้อย",en:"Golden Hour Sunset",time:"16:30 - 17:45 น.",
  mood:"ส้มทองอบอุ่น, เงายาวนุ่ม",g1:"#F59E0B",g2:"#EA580C",
  p:"golden hour sunlight raking across the body, long warm shadows, glowing rim light on the roofline"},
 {id:"blue",th:"ค่ำทไวไลท์ ฟ้าสีน้ำเงินเข้ม",en:"Blue Hour Twilight",time:"18:15 - 19:00 น.",
  mood:"น้ำเงินโคบอลต์, ไฟเมืองเริ่มติด",g1:"#2563EB",g2:"#1E1B4B",
  p:"blue hour dusk, deep cobalt sky, city lights and headlights just switching on"},
 {id:"neon",th:"นีออนกรุงเทพฯ ยามราตรี",en:"Bangkok Neon Nightlife",time:"20:00 - 01:00 น.",
  mood:"ชมพูมาเจนตา, ฟ้าไซแอนสด",g1:"#DB2777",g2:"#7C3AED",
  p:"night scene lit by neon signage and sodium street lamps, saturated colour spill across the bodywork"},
 {id:"rain",th:"ฝนตกชุ่มฉ่ำ มรสุมกรุงเทพฯ",en:"Rainy Monsoon Street",time:"ช่วงมีฝนตกปรอยๆ",
  mood:"เงาสะท้อนผิวน้ำเป็นกระจก",g1:"#0E7490",g2:"#0F172A",
  p:"just after rain, wet mirror-like asphalt reflecting the vehicle and the signage above it"},
 {id:"noon",th:"แดดสว่างจัด เที่ยงวันคมกริบ",en:"Crisp Tropical Midday Sun",time:"11:00 - 14:00 น.",
  mood:"สีอิ่มชัดเจน, เงาเข้มใต้ท้องรถ",g1:"#FACC15",g2:"#F59E0B",
  p:"harsh tropical midday sun, hard specular highlights and crisp short shadows"},
 {id:"overcast",th:"เมฆครึ้ม แสงนุ่มแบบถ่ายโฆษณา",en:"Moody Diffused Overcast",time:"เช้าตรู่ หรือวันฟ้าครึ้ม",
  mood:"แสงนุ่มนวล, ไร้เงาแข็ง",g1:"#94A3B8",g2:"#475569",
  p:"soft overcast daylight, even diffused illumination, gentle gradients on the panels"},
 {id:"studio",th:"สตูดิโอ HDRI คุมแสงเอง",en:"Studio HDRI",time:"ในสตูดิโอ ไม่ขึ้นกับเวลา",
  mood:"ซอฟต์บ็อกซ์ไล่ยาว, พื้นหลังเกลี้ยง",g1:"#E2E8F0",g2:"#64748B",
  p:"studio HDRI lighting setup, large softbox reflections sliding down the flank, seamless gradient backdrop"},
 {id:"back",th:"ย้อนแสงดราม่า ขอบทอง",en:"Backlit Silhouette",time:"ก่อนตะวันขึ้น / ตะวันตกดิน",
  mood:"ซิลูเอตขอบทอง, หมอกฟุ้ง",g1:"#B91C1C",g2:"#581C87",
  p:"strong backlight behind the vehicle, atmospheric haze, glowing silhouette edge"}
];

const STYLES=[
 {id:"ue5",th:"Unreal Engine 5",en:"UE5",p:"rendered in Unreal Engine 5 with Lumen global illumination and Nanite geometry",on:true},
 {id:"octane",th:"Octane Render",en:"Octane",p:"Octane Render path tracing, physically based materials, accurate caustics",on:true},
 {id:"hdr",th:"HDR พรีเมียม",en:"HDR",p:"premium HDR tonemapping, deep blacks with retained highlight detail",on:true},
 {id:"hyper",th:"ไฮเปอร์เรียลลิสติก",en:"Hyperreal",p:"hyperrealistic, photographic realism, razor-sharp micro detail",on:true},
 {id:"auto",th:"โฆษณารถยนต์",en:"Auto Ad",p:"high-end automotive advertising photography, commercial key visual composition",on:true},
 {id:"clean",th:"สะอาดตา ไร้คนเดิน",en:"Clean Plate",p:"clean uncluttered composition, minimal pedestrians, tidy street furniture",on:false},
 {id:"cine",th:"โทนหนัง Cinematic",en:"Cinematic",p:"cinematic anamorphic colour grade, subtle film grain",on:false},
 {id:"ray",th:"Ray Tracing สะท้อน",en:"Ray Traced",p:"ray-traced reflections across glass and clearcoat paint",on:false},
 {id:"trails",th:"เส้นสายไฟวิ่งในภาพ",en:"Light Trails",p:"long-exposure light trails running through the scene: continuous unbroken ribbons of red tail-light and white head-light streaks sweeping along the road, glowing neon light lines tracing the buildings and signage, luminous energy lines flowing across the frame — while the advertising media itself stays perfectly sharp, still and fully readable with no motion blur on it whatsoever",on:false}
];

const LENSES=[
 {v:"ultra-wide 16mm lens, strong perspective on the bodywork",t:"16 mm — Ultra Wide (เร่งเพอร์สเปคทีฟ)",s:"16 MM"},
 {v:"24mm wide lens keeping the street context in frame",t:"24 mm — Wide (เห็นฉากรอบข้าง)",s:"24 MM"},
 {v:"35mm lens, natural reportage perspective",t:"35 mm — Natural (มุมมองธรรมชาติ)",s:"35 MM"},
 {v:"50mm prime lens, true-to-eye proportions",t:"50 mm — Standard (สัดส่วนตรงตา)",s:"50 MM"},
 {v:"85mm short telephoto, compressed flattering proportions",t:"85 mm — Portrait (บีบสัดส่วนสวย)",s:"85 MM"},
 {v:"200mm telephoto with heavy background compression",t:"200 mm — Telephoto (บีบฉากหลัง)",s:"200 MM"},
 {v:"tilt-shift lens with corrected verticals, architectural precision",t:"Tilt-Shift — เส้นตั้งตรงแบบสถาปัตย์",s:"TILT-SHIFT"}
];

const WEATHERS=[
 {v:"clear dry conditions, crisp tropical air",t:"แดดใส ถนนแห้ง / Clear & Dry"},
 {v:"wet asphalt with standing puddles throwing reflections",t:"ถนนเปียก มีน้ำสะท้อน / Wet Asphalt"},
 {v:"light humid haze softening the far background",t:"หมอกบางในเมือง / City Haze"},
 {v:"light rain with visible droplets on the bodywork",t:"ฝนตกปรอย / Light Rain"},
 {v:"thin mist and drifting exhaust at ground level",t:"ไอหมอกระดับพื้น / Ground Mist"}
];

/* v41: เพิ่ม ar/en/th ให้แต่ละอัตราส่วน — ใช้เขียนลงในคำสั่งจริง (30-prompt.js ratioClause())
   ก่อนหน้านี้มีแค่ w/h/t ที่ใช้แสดงผลอย่างเดียว ตัวเลขไม่เคยถูกส่งเข้าคำสั่งเลย */
const RATIOS=[
 {id:"16x9",w:1920,h:1080,t:"16:9 — Cinematic / คีย์วิชวล (1920×1080)",ar:"16:9",en:"widescreen",th:"จอกว้าง"},
 {id:"21x9",w:2016,h:864,t:"21:9 — Ultrawide / บิลบอร์ด (2016×864)",ar:"21:9",en:"ultra-widescreen",th:"จอกว้างพิเศษ"},
 {id:"3x2",w:1620,h:1080,t:"3:2 — Print / งานพิมพ์ (1620×1080)",ar:"3:2",en:"landscape",th:"แนวนอน"},
 {id:"1x1",w:1440,h:1440,t:"1:1 — Square / โซเชียล (1440×1440)",ar:"1:1",en:"square",th:"สี่เหลี่ยมจัตุรัส"},
 {id:"4x5",w:1152,h:1440,t:"4:5 — Feed / ฟีดแนวตั้ง (1152×1440)",ar:"4:5",en:"portrait",th:"แนวตั้ง"},
 {id:"9x16",w:1080,h:1920,t:"9:16 — Story / สตอรี่ (1080×1920)",ar:"9:16",en:"vertical story",th:"แนวตั้งสตอรี่"}
];

/* v41: คำคีย์เวิร์ดยอดนิยมสำหรับช่อง "โจทย์เพิ่มเติม" (#detail) — คลิกแล้วแทรกเข้าไปในช่องข้อความ
   ตรงๆ (ดู 31-inputs.js) เป็นแค่ข้อความไทยสั้นๆ ต่อท้ายกัน ไม่ใช่ state แยกใน S เหมือนชิปอื่น */
const DETAIL_TAGS=[
 "ผู้โดยสารเต็มคันยืนเกาะราว","ไฟหน้ารถเปิดสว่างส่องพื้นถนน","เงาสะท้อนกระจกเปียกน้ำ",
 "ป้ายโฆษณาคมชัดอ่านออก","สกายวอล์ค BTS ด้านบนถนน","มีแผงลอยสตรีทฟู้ดริมฟุตบาทข้างทาง",
 "คนรอรถเมล์ถือร่มหลากสี","ป้ายไฟบอกสายรถเมล์ดิจิทัล LED","มีผู้โดยสารก้าวขึ้นบันไดรถ",
 "บรรยากาศเมืองกรุงเทพฯ สมจริง","ละอองฝนโปรยปรายรอบไฟหน้ารถ","ต้นไม้ร่มรื่นริมถนน"
];

