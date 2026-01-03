import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');
const filePath = path.join(dataDir, 'products.json');

const products = [
  // --- BLADES ---
  { "id": 1, "name": "Razer L1 5Ply 6.4mm 86g Blade", "price": 350, "category": "Blade", "brand": "Razer" },
  { "id": 2, "name": "Razer L9 Carbon 5+2 6.0mm 86g Blade", "price": 650, "category": "Blade", "brand": "Razer" },
  { "id": 3, "name": "Boer Kid Blue Red 5+2 Carbon 6.2mm 80g Blade", "price": 350, "category": "Blade", "brand": "Boer" },
  { "id": 19, "name": "Boli ES8 Hexagon CyberShape ALC Carbon 90g", "price": 1500, "category": "Blade", "brand": "Boli" },
  { "id": 37, "name": "Dawei Saviga DW01 Viscaria ALC Carbon 87g", "price": 1500, "category": "Blade", "brand": "Dawei" },
  { "id": 80, "name": "Sanwei F3 Pro ALC 5+2 Carbon 90g Blade", "price": 2100, "category": "Blade", "brand": "Sanwei" },
  
  // --- RUBBERS ---
  { "id": 500, "name": "Reactor Corbor Rubber", "price": 250, "category": "Rubber", "brand": "Reactor" },
  { "id": 501, "name": "Reactor V5 Tornado Rubber", "price": 300, "category": "Rubber", "brand": "Reactor" },
  { "id": 505, "name": "Palio AK47 Blue / Red / Yellow", "price": 550, "category": "Rubber", "brand": "Palio" },
  { "id": 510, "name": "Yinhe Mercury 2 Rubber", "price": 300, "category": "Rubber", "brand": "Yinhe" },
  
  // --- TABLES ---
  { "id": 1000, "name": "SpinPoint 15mm JR 6x3 Feet Table", "price": 7500, "category": "Table", "brand": "SpinPoint" },
  { "id": 1001, "name": "SpinPoint 18mm BlueWhite Standard Table", "price": 10500, "category": "Table", "brand": "SpinPoint" },
  { "id": 1005, "name": "Loki 25mm ITTF Approved Table", "price": 22000, "category": "Table", "brand": "Loki" }
];

if (!fs.existsSync(dataDir)){ fs.mkdirSync(dataDir, { recursive: true }); }
fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
console.log(`✅ Success! Generated ${products.length} items.`);