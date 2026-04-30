# App MODHIW v2

เวอร์ชันแก้จริงของ App MODHIW สำหรับสุ่มร้านและเมนูอาหารแถว มจธ.

## สิ่งที่แก้ใน v2

- เมนูไม่มั่วร้าน: สุ่มร้านก่อน แล้วสุ่มเฉพาะ `menus[]` ของร้านนั้น
- Emoji เปลี่ยนตามชนิดอาหาร เช่น ข้าว 🍛, ก๋วยเตี๋ยว 🍜, ของหวาน 🍰, เครื่องดื่ม 🥤
- เอาแผนที่ออกจาก UI
- UI สีส้ม-ขาว สดขึ้นกว่าเดิม
- เพิ่ม Mood filter เช่น งบประหยัด, กินอิ่ม, ของหวาน, เครื่องดื่ม, สายสุขภาพ, กินกับเพื่อน
- เพิ่มสุ่มใหม่แบบไม่ซ้ำร้านเดิมทันที
- เพิ่มเมนูยอดนิยม, งบประหยัด, ประวัติการสุ่มล่าสุด

## แก้ข้อมูลร้านในอนาคต

แก้ไฟล์:

```text
src/data/restaurants.json
```

รูปแบบร้าน:

```json
{
  "id": "r-001",
  "name": "ครัวบางมด",
  "category": "ตามสั่ง",
  "rating": 4.7,
  "distanceKm": 0.4,
  "priceLevel": "฿",
  "highlight": "ร้านยอดนิยมใกล้ มจธ.",
  "menus": [
    {
      "id": "m-001",
      "name": "กะเพราหมูกรอบ + ไข่ดาว",
      "price": 55,
      "popular": true,
      "description": "เมนูยอดนิยมของร้าน"
    }
  ]
}
```

## ใช้ข้อมูล Longdo ต่อ

ถ้าจะดึงข้อมูลใหม่จาก Longdo แล้วแปลงเป็น format นี้:

```bash
LONGDO_API_KEY="YOUR_KEY" npm run fetch:longdo
```

ถ้ามีไฟล์ Longdo เดิมอยู่แล้วและอยากแปลงเป็น format v2:

```bash
npm run convert:data
```

## Run locally

```bash
npm install
npm run web
```

ถ้า server เจอ ENOSPC watcher ให้ใช้:

```bash
npm run export:web
```

## Deploy GitHub Pages

```bash
git add .
git commit -m "Upgrade App MODHIW v2"
git push
```
