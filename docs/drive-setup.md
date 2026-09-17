# ตั้งค่า Firebase สำหรับเว็บแอพ (เฟส 6) — ขั้นตอนที่ต้องทำเองในบัญชี Google

เอกสารนี้คือขั้นตอนที่**คุณต้องทำเอง**ในบัญชี Google/Firebase — ผมทำแทนไม่ได้เพราะต้องล็อกอินจริง
เมื่อทำครบแล้ว ส่งค่า config (ข้อ 5) กลับมาให้ผมใส่ในโค้ด

## เปลี่ยนแผนจากที่คุยกันตอนแรก

เดิมวางแผนให้ล็อกอินด้วย Google Identity Services (GIS) ตรงๆ แล้วอนุญาตทุกคนใน
`@planbmedia.co.th` เข้าได้เลย — แต่คุณต้องการระบบขอสิทธิ์เป็นรายบุคคล (ใครใหม่ต้องกดขอแล้วรอ
อนุมัติ) ซึ่งต้องมีที่เก็บสถานะที่ตรวจสอบได้ปลอดภัย จึงเปลี่ยนมาใช้ **Firebase Authentication**
(ไม่ใช่ GIS ตรงๆ) + **Firestore** เก็บสถานะคำขอ เพราะ Firestore Security Rules ต้องรู้ว่า
"ใครถามอยู่" ผ่าน Firebase Auth เท่านั้น — token ดิบจาก GIS ใช้กับ Firestore Rules ไม่ได้

**Client ID ที่คุณสร้างไว้แล้วยังใช้ได้** — ตอนเปิดใช้ Google เป็นวิธีล็อกอินใน Firebase Console
(ข้อ 3 ด้านล่าง) จะมีช่องให้ใส่ Client ID ที่มีอยู่แล้ว ไม่ต้องสร้างใหม่ ถ้าไม่ใส่ Firebase จะสร้าง
Client ID ใหม่ให้อัตโนมัติก็ได้เหมือนกัน — เลือกทางไหนก็ได้

---

## ขั้นตอน

### 1. เพิ่มโปรเจกต์ Firebase (ใช้โปรเจกต์ GCP เดิมที่มี OAuth Client ID อยู่แล้ว)
1. เข้า `https://console.firebase.google.com` ด้วยบัญชี `@planbmedia.co.th`
2. **Add project** → เลือกโปรเจกต์ GCP ที่คุณสร้าง OAuth Client ID ไว้แล้ว (อย่าสร้างโปรเจกต์ใหม่ —
   ต้องเป็นโปรเจกต์เดียวกันเพื่อให้ OAuth consent screen ที่ตั้ง Internal ไว้แล้วครอบคลุมแอปนี้ด้วย)
3. ปิด Google Analytics ได้ (ไม่จำเป็น ลดข้อมูลที่ส่งออก)

### 2. เปิด Firestore
1. เมนูซ้าย **Build → Firestore Database → Create database**
2. เลือก **Production mode** (กฎความปลอดภัยจะ deploy จาก `firestore.rules` ในโปรเจกต์ทีหลัง
   ไม่ใช่โหมด Test ที่เปิดกว้างทุกคน)
3. เลือก region ที่ใกล้ที่สุด เช่น `asia-southeast1` (สิงคโปร์)

### 3. เปิด Google เป็นวิธีล็อกอิน
1. เมนูซ้าย **Build → Authentication → Get started**
2. แท็บ **Sign-in method → Add new provider → Google → เปิดใช้**
3. **Web SDK configuration**: ถ้ามี Client ID จากขั้นตอนก่อนอยู่แล้ว ใส่ตรงนี้ได้ (ไม่ใส่ก็ได้
   Firebase จะสร้างให้เอง) → **Save**

### 4. ตั้งโดเมนที่อนุญาตให้ล็อกอิน (Authorized domains)
1. ในหน้า Authentication → แท็บ **Settings → Authorized domains**
2. `localhost`, `<project-id>.firebaseapp.com`, `<project-id>.web.app` ถูกเพิ่มให้อัตโนมัติแล้ว
3. ถ้าจะใช้โดเมนบริษัทเอง (เช่น `autostudio.planbmedia.co.th`) ให้กด **Add domain** เพิ่มเข้าไปด้วย

### 5. สร้างเว็บแอพเพื่อได้ค่า config (ไม่ใช่ความลับ ส่งมาในแชทได้)
1. หน้าแรกของโปรเจกต์ (Project Overview) → ไอคอน **</>​ (Web)**
2. ตั้งชื่อ เช่น `autostudio3d-web` → **Register app** (ไม่ต้องติ๊ก Firebase Hosting ในขั้นนี้)
3. จะเห็นก้อนโค้ดหน้าตาแบบนี้ — **คัดลอกทั้งก้อนส่งมาให้ผม**:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...firebaseapp.com",
     projectId: "...",
     storageBucket: "...appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   ค่าพวกนี้**ไม่ใช่ความลับ** — เหมือน OAuth Client ID เปิดเผยได้ ความปลอดภัยจริงมาจาก
   Firestore Security Rules (`firestore.rules` ในโปรเจกต์) และ OAuth consent screen ที่ตั้ง
   **Internal** ไว้แล้ว ไม่ได้มาจากการซ่อนค่าพวกนี้

### 6. ผู้ดูแลระบบ (แอดมิน)
ตอนนี้ตั้งเป็น `anusart@planbmedia.co.th` ไว้ 2 ที่ในโค้ด (ต้องตรงกันเสมอ):
- `firestore.rules` — บรรทัด `request.auth.token.email == "anusart@planbmedia.co.th"`
- `src/js/70-auth.web.js` — ค่า `ADMIN_EMAIL`

ถ้าจะเปลี่ยนคนดูแล แจ้งผมแก้ทั้งสองที่พร้อมกัน (ห้ามแก้แค่ที่เดียว — ถ้า `firestore.rules`
ไม่ตรงกับ `ADMIN_EMAIL` แอดมินจะกดอนุมัติคนอื่นไม่ได้เพราะ Firestore ปฏิเสธเอง)

### 7. ติดตั้ง Firebase CLI แล้ว deploy กฎ Firestore + เว็บ (ผมทำขั้นนี้เองได้เมื่อได้ค่า config แล้ว)
```bash
npm install -g firebase-tools
firebase login                          # เปิดเบราว์เซอร์ให้คุณล็อกอิน
firebase use --add                      # เลือกโปรเจกต์ที่สร้างไว้
node build.mjs --target=web             # สร้าง dist/web/ + firebase.json
firebase deploy --only firestore:rules,hosting
```

---

## สิ่งที่ผมต้องการจากคุณเพื่อทำงานต่อ

**ก้อนโค้ด `firebaseConfig` จากขั้นตอนที่ 5** (6 ค่า) — ส่งมาในแชทได้เลย ไม่ใช่ความลับ

หลังจากได้ค่านี้ ผมจะ:
1. แทนค่า `REPLACE_WITH_...` ใน `src/js/70-auth.web.js` ด้วยค่าจริง
2. `npm run build:web` แล้ว deploy ขึ้น Firebase Hosting preview channel ให้ทดสอบก่อนขึ้นจริง
3. ทดสอบล็อกอินจริง: บัญชี `@planbmedia.co.th` ต้องเข้าได้ (แล้วเจอหน้า "ขอสิทธิ์การใช้งาน"
   เพราะยังไม่มีใครอนุมัติ) — ล็อกอินด้วยบัญชี anusart แล้วเข้าเมนู "อนุมัติผู้ใช้" กดอนุมัติตัวเอง
   ได้เลยเพราะเป็นแอดมิน
