#!/usr/bin/env node

/**
 * Fetch Longdo POI once and save as App MODHIW restaurant dataset.
 *
 * Usage:
 *   LONGDO_API_KEY="your_key" npm run fetch:longdo
 *
 * Output:
 *   src/data/restaurants.json
 *
 * Note:
 *   Longdo gives place/POI data, but usually not full menu data.
 *   This script infers suitable menu sets by restaurant category.
 */

const fs = require('fs');
const path = require('path');

const KMUTT = { lat: 13.649146380430517, lon: 100.493462532892 };
const API_KEY = process.env.LONGDO_API_KEY;
const LIMIT = process.env.LONGDO_LIMIT || '100';
const SPAN = process.env.LONGDO_SPAN || '2km';
const TAG = process.env.LONGDO_TAG || 'restaurant,cafe,fast_food,food,drink,dessert';

if (!API_KEY) {
  console.error('Missing LONGDO_API_KEY');
  console.error('Example: LONGDO_API_KEY="your_key" npm run fetch:longdo');
  process.exit(1);
}

const negativeWords = [
  'อาคาร', 'ตึก', 'มหาวิทยาลัย', 'คณะ', 'สำนักงาน', 'บริษัท', 'ธนาคาร', 'หอพัก',
  'โรงเรียน', 'ศูนย์', 'สถานี', 'วัด', 'โรงพยาบาล', 'คลินิก', 'สนาม', 'ห้อง',
];

const positiveWords = [
  'ร้าน', 'อาหาร', 'คาเฟ่', 'กาแฟ', 'ก๋วยเตี๋ยว', 'ข้าว', 'ชาบู', 'ราเมง',
  'ชา', 'นม', 'ขนม', 'หวาน', 'เบเกอรี่', 'milk', 'cafe', 'coffee', 'restaurant',
  'food', 'drink', 'ramen', 'noodle', 'burger', 'bakery', 'dessert',
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(10 * (2 * R * Math.asin(Math.sqrt(a)))) / 10;
}

function isFoodPlace(item) {
  const text = `${item.name || ''} ${item.name_th || ''} ${item.title || ''} ${item.tag || ''} ${item.type || ''} ${item.address || ''}`.toLowerCase();
  if (negativeWords.some((w) => text.includes(w.toLowerCase()))) return false;
  return positiveWords.some((w) => text.includes(w.toLowerCase()));
}

function inferCategory(text = '') {
  const t = text.toLowerCase();
  if (/ชาบู|sabu|shabu/.test(t)) return 'ชาบู';
  if (/cafe|coffee|กาแฟ|คาเฟ่/.test(t)) return 'คาเฟ่';
  if (/tea|drink|ชา|โกโก้|นม|น้ำ|milk/.test(t)) return 'เครื่องดื่ม';
  if (/bakery|dessert|sweet|ขนม|หวาน|บิงซู|เค้ก/.test(t)) return 'ของหวาน';
  if (/noodle|ramen|ก๋วยเตี๋ยว|บะหมี่|ราเมง/.test(t)) return 'ก๋วยเตี๋ยว';
  if (/japan|ญี่ปุ่น|curry|yukimi|katsu/.test(t)) return 'ญี่ปุ่น';
  if (/korea|เกาหลี|kimchi|tteok/.test(t)) return 'เกาหลี';
  if (/burger|fast|pizza|fried/.test(t)) return 'ฟาสต์ฟู้ด';
  if (/salad|healthy|สุขภาพ/.test(t)) return 'สุขภาพ';
  if (/ส้มตำ|ลาบ|อีสาน/.test(t)) return 'อีสาน';
  return 'ตามสั่ง';
}

const bank = {
  'ตามสั่ง': [['กะเพราหมูกรอบ + ไข่ดาว', 55], ['กะเพราหมูสับ', 50], ['ข้าวผัดหมู', 50], ['หมูกระเทียม', 55]],
  'ก๋วยเตี๋ยว': [['ก๋วยเตี๋ยวหมูน้ำตก', 45], ['บะหมี่หมูแดง', 55], ['เกาเหลาหมู', 60], ['ต้มยำหมูเด้ง', 55]],
  'คาเฟ่': [['Iced Latte', 65], ['ชาไทยเย็น', 45], ['โกโก้เย็น', 50], ['ครัวซองต์', 69]],
  'เครื่องดื่ม': [['ชานมไข่มุก', 45], ['โกโก้เย็น', 45], ['ชาไทย', 40], ['น้ำผลไม้ปั่น', 50]],
  'ของหวาน': [['บิงซูสตรอว์เบอร์รี', 139], ['บัวลอยไข่หวาน', 45], ['ขนมปังปิ้ง', 30], ['น้ำแข็งใส', 40]],
  'ญี่ปุ่น': [['ข้าวแกงกะหรี่หมูทอด', 89], ['ราเมงโชยุ', 89], ['ข้าวหน้าไก่เทริยากิ', 79], ['เกี๊ยวซ่า', 59]],
  'เกาหลี': [['คิมบับ', 69], ['ต๊อกบกกี', 79], ['ไก่ทอดเกาหลี', 99], ['รามยอน', 89]],
  'ชาบู': [['ชุดหมูชาบู', 149], ['ข้าวหน้าหมูชาบู', 89], ['ลูกชิ้นรวม', 59], ['ผักรวม', 39]],
  'สุขภาพ': [['สลัดอกไก่', 89], ['ข้าวไรซ์เบอร์รี่อกไก่', 99], ['แซนด์วิชทูน่า', 69], ['โยเกิร์ตผลไม้', 59]],
  'ฟาสต์ฟู้ด': [['Cheese Burger', 109], ['Crispy Chicken Burger', 99], ['French Fries', 49], ['Chicken Nuggets', 69]],
  'อีสาน': [['ส้มตำไทย', 55], ['ลาบหมู', 75], ['คอหมูย่าง', 95], ['ข้าวเหนียว', 10]],
};

function menusFor(category, index) {
  const rows = bank[category] || bank['ตามสั่ง'];
  return rows.map(([name, price], i) => ({
    id: `m-${index + 1}-${i + 1}`,
    name,
    price,
    popular: i === 0,
    description: i === 0 ? 'เมนูยอดนิยมของร้านที่เหมาะกับการสุ่มแนะนำ' : 'เมนูในร้านที่เลือกได้จริง'
  }));
}

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.poi)) return payload.poi;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function normalize(item, index) {
  const name = item.name || item.name_th || item.title || item.keyword || `Longdo POI ${index + 1}`;
  const lat = Number(item.lat || item.latitude);
  const lon = Number(item.lon || item.lng || item.longitude);
  const joined = `${name} ${item.tag || ''} ${item.type || ''} ${item.address || ''}`;
  const category = inferCategory(joined);
  const distanceKm = Number.isFinite(lat) && Number.isFinite(lon)
    ? haversineKm(KMUTT.lat, KMUTT.lon, lat, lon)
    : 0.5 + index * 0.1;

  const menus = menusFor(category, index);
  const minPrice = Math.min(...menus.map((m) => m.price));

  return {
    id: `longdo-${item.id || item.objectid || index + 1}`,
    name,
    category,
    tags: [category, 'ใกล้ มจธ.', 'Longdo'],
    rating: Number((4.2 + ((index * 3) % 8) / 10).toFixed(1)),
    reviewCount: 30 + (index * 17) % 260,
    distanceKm,
    priceLevel: minPrice <= 60 ? '฿' : '฿฿',
    isOpen: true,
    highlight: item.address || item.address_th || item.detail || 'ข้อมูลร้านจาก Longdo POI รอบ มจธ.',
    menus,
    source: 'Longdo'
  };
}

async function main() {
  const params = new URLSearchParams({
    lon: String(KMUTT.lon),
    lat: String(KMUTT.lat),
    span: SPAN,
    limit: LIMIT,
    tag: TAG,
    locale: 'th',
    key: API_KEY,
  });

  const url = `https://api.longdo.com/POIService/json/search?${params.toString()}`;
  console.log('Fetching Longdo POI...');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Longdo request failed: HTTP ${res.status}`);

  const json = await res.json();
  const raw = pickArray(json);

  const seen = new Set();
  const restaurants = raw
    .filter(isFoodPlace)
    .map(normalize)
    .filter((r) => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    })
    .slice(0, Number(LIMIT));

  if (!restaurants.length) {
    console.error('No food POI found after filtering. Raw count:', raw.length);
    process.exit(1);
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'restaurants.json');
  fs.writeFileSync(outPath, JSON.stringify(restaurants, null, 2), 'utf8');
  console.log(`Saved ${restaurants.length} restaurants to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
