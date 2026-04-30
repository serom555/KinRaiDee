#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'restaurants.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const negativeWords = ['อาคาร', 'ตึก', 'มหาวิทยาลัย', 'คณะ', 'สำนักงาน', 'บริษัท', 'ธนาคาร', 'หอพัก', 'โรงเรียน', 'ศูนย์', 'สถานี', 'วัด', 'โรงพยาบาล', 'คลินิก'];

function inferCategory(text = '') {
  const t = text.toLowerCase();
  if (/ชาบู|sabu|shabu/.test(t)) return 'ชาบู';
  if (/cafe|coffee|กาแฟ|คาเฟ่/.test(t)) return 'คาเฟ่';
  if (/tea|drink|ชา|โกโก้|นม|น้ำ|milk/.test(t)) return 'เครื่องดื่ม';
  if (/bakery|dessert|sweet|ขนม|หวาน|บิงซู|เค้ก/.test(t)) return 'ของหวาน';
  if (/noodle|ramen|ก๋วยเตี๋ยว|บะหมี่|ราเมง/.test(t)) return 'ก๋วยเตี๋ยว';
  if (/japan|ญี่ปุ่น|curry|yukimi|katsu/.test(t)) return 'ญี่ปุ่น';
  if (/korea|เกาหลี/.test(t)) return 'เกาหลี';
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

function menusFor(category, old, index) {
  const rows = bank[category] || bank['ตามสั่ง'];
  const menus = rows.map(([name, price], i) => ({
    id: `m-${index + 1}-${i + 1}`,
    name,
    price,
    popular: i === 0,
    description: i === 0 ? 'เมนูยอดนิยมของร้านที่เหมาะกับการสุ่มแนะนำ' : 'เมนูในร้านที่เลือกได้จริง'
  }));
  if (old.menu && !menus.some(m => m.name === old.menu)) {
    menus.unshift({
      id: `m-${index + 1}-0`,
      name: old.menu,
      price: Number(old.price || rows[0][1]),
      popular: true,
      description: 'เมนูจากข้อมูลเดิมของร้าน'
    });
  }
  return menus.slice(0, 4);
}

const seen = new Set();
const converted = data
  .filter((r) => r && r.name)
  .filter((r) => !negativeWords.some((w) => String(r.name).includes(w)))
  .filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  })
  .map((r, i) => {
    const category = inferCategory(`${r.name || ''} ${r.category || ''} ${(r.tags || []).join(' ')} ${r.highlight || ''}`);
    const menus = menusFor(category, r, i);
    const minPrice = Math.min(...menus.map(m => m.price));
    return {
      id: r.id || `r-${String(i + 1).padStart(3, '0')}`,
      name: r.name,
      category,
      tags: [category, 'ใกล้ มจธ.', r.source === 'Longdo' ? 'Longdo' : 'Local'],
      rating: Number(r.rating || (4.2 + (i % 7) * 0.1).toFixed(1)),
      reviewCount: Number(r.reviewCount || (40 + (i * 13) % 220)),
      distanceKm: Number(r.distanceKm || 0.8),
      priceLevel: minPrice <= 60 ? '฿' : '฿฿',
      isOpen: r.isOpen !== false,
      highlight: r.highlight || 'ร้านอาหารรอบ มจธ. จากชุดข้อมูลท้องถิ่น',
      menus,
      source: r.source || 'Local dataset'
    };
  });

fs.writeFileSync(file, JSON.stringify(converted, null, 2), 'utf8');
console.log(`Converted ${converted.length} restaurants to MODHIW v2 format`);
