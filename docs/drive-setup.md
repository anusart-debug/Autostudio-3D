# ตั้งค่า Firebase สำหรับเว็บแอพ (เฟส 6-7) — ขั้นตอนที่ต้องทำเองในบัญชี Google

เอกสารนี้คือขั้นตอนที่**คุณต้องทำเอง**ในบัญชี Google/Firebase — ผมทำแทนไม่ได้เพราะต้องล็อกอินจริง
เมื่อทำครบแล้ว ส่งค่า config (ข้อ 5) กลับมาให้ผมใส่ในโค้ด

## หลักการ: ตั้งฝั่ง Google ให้น้อยที่สุด แล้วให้ทุกอย่างจัดการในแอปนี้

ระบบสิทธิ์การใช้งานทั้งหมด (ใครเข้าได้/ไม่ได้) อยู่ที่ **Firestore** ไม่ได้อยู่ที่การตั้งค่า
Google Cloud/OAuth เลย — ไม่ต้องมีองค์กร Google Workspace ไม่ต้องตั้ง OAuth consent screen
เป็น "Internal" ไม่ต้องไปเพิ่มอีเมลผู้ใช้ที่หน้า Google Cloud Console ทีละคน

**บัญชี Google อะไรก็ล็อกอินเข้าหน้าแรกของแอปได้ทั้งนั้น** (แม้แต่ Gmail ส่วนตัว) — แต่จะเห็นแค่
หน้า **"ขอสิทธิ์การใช้งาน"** จนกว่าผู้ดูแลระบบจะกดอนุมัติอีเมลนั้นในแอปเอง (เมนู "อนุมัติผู้ใช้")
งานของคุณฝั่ง Google Cloud หลังจากตั้งครั้งแรกจบแล้ว **คือศูนย์** — อนุมัติ/ปฏิเสธคนใหม่ทำใน
แอปนี้ที่เดียวตลอดไป

แลกมาด้วยอะไรบ้าง (บอกตรงๆ):
- คนที่ยังไม่เคยเห็นแอปนี้จะเจอหน้าเตือนของ Google ว่า **"Google hasn't verified this app"**
  ตอนกดล็อกอินครั้งแรก (เพราะแอปขอ scope `drive.file` ซึ่ง Google จัดว่า sensitive แต่**ไม่ใช่**
  restricted — ไม่ต้องผ่านการตรวจสอบความปลอดภัยแบบเข้มของ Google) ต้องกด **Advanced → Go to
  [ชื่อแอป] (unsafe)** เพื่อผ่านไป เป็นแค่หน้าเตือนครั้งแรกต่อเบราว์เซอร์ ไม่ใช่ตัวบล็อกจริง
  และไม่ได้แปลว่าแอปไม่ปลอดภัย — Google แค่ยังไม่ได้ตรวจสอบแบรนด์/นโยบายความเป็นส่วนตัวเท่านั้น
- ถ้าอยากเอาหน้าเตือนนี้ออกในอนาคต ต้องส่งแอปให้ Google ตรวจสอบ (verification) ซึ่งต้องมี
  หน้านโยบายความเป็นส่วนตัวและใช้เวลาหลายวัน — เก็บไว้เป็นตัวเลือกทีหลังถ้าต้องการ ไม่ใช่ขั้นบังคับ

---

## ขั้นตอน

### 1. สร้างโปรเจกต์ Firebase (ใช้บัญชี Google อะไรก็ได้ ไม่ต้องมีองค์กร)
1. เข้า `https://console.firebase.google.com`
2. **Add project** → ตั้งชื่อ เช่น `autostudio3d` → ปิด Google Analytics ได้ (ไม่จำเป็น)

### 2. เปิด Firestore
1. เมนูซ้าย **Build → Firestore Database → Create database**
2. เลือก **Production mode** (กฎความปลอดภัยจะ deploy จาก `firestore.rules` ในโปรเจกต์ทีหลัง
   ไม่ใช่โหมด Test ที่เปิดกว้างทุกคน)
3. เลือก region ที่ใกล้ที่สุด เช่น `asia-southeast1` (สิงคโปร์)

### 3. เปิด Google เป็นวิธีล็อกอิน
1. เมนูซ้าย **Build → Authentication → Get started**
2. แท็บ **Sign-in method → Add new provider → Google → เปิดใช้ → Save**
   (ปล่อยให้ Firebase สร้าง OAuth Client ID ให้เองได้เลย ไม่ต้องมีของเดิมมาก่อน)
3. Firebase จะตั้ง OAuth consent screen ที่ Google Cloud Console ให้อัตโนมัติเป็น
   **User type: External** — **ไม่ต้องไปแก้เป็น Internal และไม่ต้องมีองค์กร Google Workspace**
   ปล่อย Publishing status ไว้เป็นค่าเริ่มต้นได้ (ถ้าเป็น "Testing" ให้เปลี่ยนเป็น
   **"In production"** ที่หน้า OAuth consent screen ใน Google Cloud Console — ไม่ต้องกด "Submit
   for verification" ก็ได้ ผู้ใช้จะเจอหน้าเตือน "unverified app" แค่กดผ่านตามที่อธิบายไว้ข้างบน)

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
   Firestore Security Rules (`firestore.rules` ในโปรเจกต์) ที่ตรวจอีเมลของทุกคำขอ
   ไม่ได้มาจากการซ่อนค่าพวกนี้หรือจากการตั้งค่า OAuth consent screen แต่อย่างใด

### 6. ผู้ดูแลระบบ (แอดมิน)
ตอนนี้ตั้งเป็น `anusart@planbmedia.co.th` ไว้ 2 ที่ในโค้ด (ต้องตรงกันเสมอ):
- `firestore.rules` — บรรทัด `request.auth.token.email == "anusart@planbmedia.co.th"`
- `src/js/70-auth.web.js` — ค่า `ADMIN_EMAIL`

ถ้าจะเปลี่ยนคนดูแล แจ้งผมแก้ทั้งสองที่พร้อมกัน (ห้ามแก้แค่ที่เดียว — ถ้า `firestore.rules`
ไม่ตรงกับ `ADMIN_EMAIL` แอดมินจะกดอนุมัติคนอื่นไม่ได้เพราะ Firestore ปฏิเสธเอง)

การอนุมัติ/ปฏิเสธผู้ใช้ใหม่ทุกคนหลังจากนี้ทำในแอปเองทั้งหมด (ปุ่ม "อนุมัติผู้ใช้" ที่แอดมิน
มองเห็นหลังล็อกอิน) — **ไม่ต้องกลับมาที่ Google Cloud/Firebase Console อีกเลย**

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
3. ทดสอบล็อกอินจริง: ล็อกอินด้วยบัญชี anusart (หรือบัญชีไหนก็ได้) → เจอหน้า "ขอสิทธิ์การใช้งาน"
   เพราะยังไม่มีใครอนุมัติ → ล็อกอินด้วยบัญชี anusart แล้วเข้าเมนู "อนุมัติผู้ใช้" กดอนุมัติตัวเอง
   ได้เลยเพราะเป็นแอดมิน (แอดมินเข้าใช้งานได้เสมอโดยไม่ต้องรออนุมัติตัวเอง — ดู `auIsApproved()`)
