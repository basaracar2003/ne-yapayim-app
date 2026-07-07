import { useState, useMemo, useEffect } from "react";
import {
  Smartphone, Tv, Laptop, Tablet, Gamepad2, Wrench, Banknote,
  HeartHandshake, Recycle, Sparkles, Copy, Check,
  ExternalLink, ChevronLeft, AlertTriangle, Scale, TrendingDown,
  ArrowRight, Leaf, Search, Watch, Headphones, List, ChevronRight,
  Refrigerator, Plug, Bike, Armchair, Camera, Store, Hammer
} from "lucide-react";

/* ================================================================
   NE YAPAYIM? — Eşya Karar Alma Motoru (v7)
   13 kategori, 1236 ürün / 747 aile: telefon, TV, bilgisayar, tablet,
   konsol, saat, kulaklık & ses, kamera, beyaz eşya, küçük ev aleti,
   bisiklet & scooter, mobilya, el aletleri. Kapasite/boyut/konfig
   varyantları ayrı ürün; netleştirme ekranında çiple seçilir.
   Listede olmayan her ürünü yapay zekâ katmanı tanır.
   NOT: Fiyatlar ÖRNEK veridir; üretim öncesi güncellenmelidir.
   ================================================================ */

/* ---------------- VERİ KATMANI ---------------- */

const LOW_VALUE = 1500;
const MIN_BROKEN = 1000;

const CATEGORIES = {
  phone:     { label: "Telefon",            icon: Smartphone,   deprMonthly: 0.022, ewasteKg: 0.2 },
  tv:        { label: "Televizyon",         icon: Tv,           deprMonthly: 0.025, ewasteKg: 15 },
  laptop:    { label: "Bilgisayar",             icon: Laptop,       deprMonthly: 0.020, ewasteKg: 2.5 },
  tablet:    { label: "Tablet",             icon: Tablet,       deprMonthly: 0.020, ewasteKg: 0.5 },
  console:   { label: "Oyun Konsolu",       icon: Gamepad2,     deprMonthly: 0.015, ewasteKg: 3 },
  watch:     { label: "Akıllı Saat",        icon: Watch,        deprMonthly: 0.022, ewasteKg: 0.05 },
  headphone: { label: "Kulaklık & Ses",     icon: Headphones,   deprMonthly: 0.020, ewasteKg: 0.05 },
  camera:    { label: "Fotoğraf & Kamera",  icon: Camera,       deprMonthly: 0.015, ewasteKg: 0.8 },
  appliance: { label: "Beyaz Eşya",         icon: Refrigerator, deprMonthly: 0.015, ewasteKg: 55 },
  smallapp:  { label: "Küçük Ev Aleti",     icon: Plug,         deprMonthly: 0.020, ewasteKg: 3 },
  bike:      { label: "Bisiklet & Scooter", icon: Bike,         deprMonthly: 0.012, ewasteKg: 14 },
  furniture: { label: "Mobilya",            icon: Armchair,     deprMonthly: 0.015, ewasteKg: 0 },
  tool:      { label: "El Aletleri",        icon: Hammer,       deprMonthly: 0.008, ewasteKg: 2 },
};

// Marka → resmî yetkili servis / destek sayfası (haritada olmayanlar otomatik Google aramasına düşer)
const BRAND_SERVICE = {
  Apple:     "https://locate.apple.com/tr/tr",
  Beats:     "https://locate.apple.com/tr/tr",
  Samsung:   "https://www.samsung.com/tr/support/service-center/",
  LG:        "https://www.lg.com/tr/destek",
  Sony:      "https://www.sony.com.tr/electronics/destek",
  Microsoft: "https://support.xbox.com/tr-TR/",
  Xiaomi:    "https://www.mi.com/tr/support/",
  Lenovo:    "https://support.lenovo.com/tr/tr",
  Asus:      "https://www.asus.com/tr/support/",
  HP:        "https://support.hp.com/tr-tr",
  Dell:      "https://www.dell.com/support/home/tr-tr",
  Acer:      "https://www.acer.com/tr-tr/support",
  MSI:       "https://tr.msi.com/support",
  Huawei:    "https://consumer.huawei.com/tr/support/",
  Oppo:      "https://support.oppo.com/tr/",
  Vestel:    "https://www.vestel.com.tr/destek",
  Philips:   "https://www.philips.com.tr",
  Grundig:   "https://www.grundig.com.tr",
  "Arçelik": "https://www.arcelik.com.tr/destek",
  Beko:      "https://www.beko.com.tr/destek",
  Bosch:     "https://www.bosch-home.com.tr",
  Siemens:   "https://www.siemens-home.bsh-group.com/tr",
  Profilo:   "https://www.profilo.com",
  Dyson:     "https://www.dyson.com.tr",
  Tefal:     "https://www.tefal.com.tr",
  Fakir:     "https://www.fakir.com.tr",
  Nespresso: "https://www.nespresso.com/tr/",
  IKEA:      "https://www.ikea.com.tr",
  "İstikbal":"https://www.istikbal.com.tr",
  Decathlon: "https://www.decathlon.com.tr",
  Arzum:     "https://www.arzum.com.tr",
  Canon:     "https://www.canon.com.tr",
  Nikon:     "https://www.nikon.com.tr",
};
const serviceLink = (brand) =>
  BRAND_SERVICE[brand] || ("https://www.google.com/search?q=" + encodeURIComponent(brand + " yetkili servis"));

// Marka → resmî satış sitesi (sıfır fiyatı doğrulamak için)
const BRAND_STORE = {
  Apple:     "https://www.apple.com/tr/store",
  Samsung:   "https://www.samsung.com/tr/",
  Xiaomi:    "https://www.mi.com/tr/",
  Sony:      "https://www.sony.com.tr",
  Microsoft: "https://www.xbox.com/tr-TR/",
  Google:    "https://store.google.com",
  Huawei:    "https://consumer.huawei.com/tr/",
  Oppo:      "https://www.oppo.com/tr/",
  LG:        "https://www.lg.com/tr",
  Vestel:    "https://www.vestel.com.tr",
  Philips:   "https://www.philips.com.tr",
  Grundig:   "https://www.grundig.com.tr",
  Lenovo:    "https://www.lenovo.com/tr/tr/",
  Asus:      "https://www.asus.com/tr/",
  HP:        "https://www.hp.com/tr-tr/",
  Dell:      "https://www.dell.com/tr-tr",
  Acer:      "https://www.acer.com/tr-tr",
  MSI:       "https://tr.msi.com",
  Monster:   "https://www.monsternotebook.com.tr",
  Casper:    "https://www.casper.com.tr",
  Canon:     "https://www.canon.com.tr",
  Nikon:     "https://www.nikon.com.tr",
  GoPro:     "https://gopro.com",
  DJI:       "https://www.dji.com",
  JBL:       "https://tr.jbl.com",
  Dyson:     "https://www.dyson.com.tr",
  "Arçelik": "https://www.arcelik.com.tr",
  Beko:      "https://www.beko.com.tr",
  Bosch:     "https://www.bosch-home.com.tr",
  Tefal:     "https://www.tefal.com.tr",
  Nespresso: "https://www.nespresso.com/tr/",
  DeLonghi:  "https://www.delonghi.com/tr-tr",
  Arzum:     "https://www.arzum.com.tr",
  IKEA:      "https://www.ikea.com.tr",
  "İstikbal":"https://www.istikbal.com.tr",
  Bellona:   "https://www.bellona.com.tr",
  "Doğtaş":  "https://www.dogtas.com",
  Decathlon: "https://www.decathlon.com.tr",
  Salcano:   "https://www.salcano.com",
  Bianchi:   "https://www.bianchi.com.tr",
  Valve:     "https://store.steampowered.com",
  reeder:    "https://www.reeder.com.tr",
  "General Mobile": "https://www.generalmobile.com",
  Arnica:    "https://www.arnica.com.tr",
  Karaca:    "https://www.karaca.com",
};
const storeLink = (brand, model) =>
  BRAND_STORE[brand] || ("https://www.google.com/search?q=" + encodeURIComponent(brand + " " + model + " fiyat"));

// Ürünün sıfır satın alma sayfası: markanın kendi site içi araması → yoksa site: aramasıyla resmî sayfaya
const BUY_SEARCH = {
  Apple:   (q) => "https://www.apple.com/tr/search/" + encodeURIComponent(q),
  Samsung: (q) => "https://www.samsung.com/tr/search/?searchvalue=" + encodeURIComponent(q),
};
// Pazaryeri arama sayfaları — doğrudan satın alma listesine iner (Google yok)
const MARKETS = {
  hepsiburada: (q) => "https://www.hepsiburada.com/ara?q=" + encodeURIComponent(q),
  trendyol:    (q) => "https://www.trendyol.com/sr?q=" + encodeURIComponent(q),
  akakce:      (q) => "https://www.akakce.com/arama/?q=" + encodeURIComponent(q),
};
const buyLink = (brand, model) =>
  BUY_SEARCH[brand] ? BUY_SEARCH[brand](model) : MARKETS.hepsiburada(model);

/* Sıfır fiyatları ürün satırlarında (np alanı). Doğrulanmış çapalar (03.07.2026, Akakçe/Cimri/Apple TR):
   iPhone 17 → 77.999 · 17 Pro → 104.999 · 17 Pro Max → 121.999 · 17e → 53.999 · Air → 89.999 · 16 → 61.999
   Galaxy S26 Ultra → 87.999 · S25 Ultra → 72.999 · S25 → 47.999 · A56 → 23.999
   Watch Series 11 → 20.999 · Watch SE 3 → 12.499 · AirPods 4 → 6.499 · AirPods Pro 3 → 11.999 · PS5 → 34.999 */
const DEFECTS = {
  phone: [
    { id: "ekran",    label: "Ekran kırık",   mult: 0.45, repair: [3000, 7000],  kw: ["ekran", "kırık", "kirik", "cam", "çatlak", "catlak"] },
    { id: "batarya",  label: "Batarya zayıf", mult: 0.78, repair: [1500, 3000],  kw: ["batarya", "pil", "şarj tutm", "sarj tutm"] },
    { id: "sarj",     label: "Şarj soketi",   mult: 0.70, repair: [1000, 2200],  kw: ["soket", "şarj girişi", "şarj olmuyor", "sarj olmuyor"] },
    { id: "acilmiyor",label: "Açılmıyor",     mult: 0.25, repair: [2000, 6000],  kw: ["açılmıyor", "acilmiyor", "ölü", "olu", "anakart"] },
    { id: "yok",      label: "Sorunu yok",    mult: 1.00, repair: [0, 0],        kw: ["sorun yok", "çalışıyor", "calisiyor", "temiz", "sağlam", "saglam"] },
  ],
  tv: [
    { id: "ekran",    label: "Panel / ekran kırık",           mult: 0.20, repair: [8000, 16000], kw: ["ekran", "panel", "kırık", "kirik", "çatlak", "catlak", "çizgi"] },
    { id: "backlight",label: "Görüntü yok (arka aydınlatma)", mult: 0.45, repair: [2500, 5000],  kw: ["görüntü yok", "goruntu yok", "aydınlatma", "backlight", "karanlık"] },
    { id: "anakart",  label: "Anakart arızası",               mult: 0.40, repair: [2000, 4500],  kw: ["anakart"] },
    { id: "acilmiyor",label: "Açılmıyor",                     mult: 0.30, repair: [2000, 5000],  kw: ["açılmıyor", "acilmiyor"] },
    { id: "yok",      label: "Sorunu yok",                    mult: 1.00, repair: [0, 0],        kw: ["sorun yok", "çalışıyor", "calisiyor"] },
  ],
  laptop: [
    { id: "ekran",    label: "Ekran arızalı",  mult: 0.55, repair: [3000, 7000],  kw: ["ekran", "kırık", "kirik", "çatlak"] },
    { id: "batarya",  label: "Batarya bitik",  mult: 0.80, repair: [2000, 4000],  kw: ["batarya", "pil", "şarj tutm", "sarj tutm"] },
    { id: "klavye",   label: "Klavye sorunlu", mult: 0.75, repair: [1500, 3000],  kw: ["klavye", "tuş", "tus"] },
    { id: "acilmiyor",label: "Açılmıyor",      mult: 0.30, repair: [2500, 6000],  kw: ["açılmıyor", "acilmiyor", "anakart"] },
    { id: "yok",      label: "Sorunu yok",     mult: 1.00, repair: [0, 0],        kw: ["sorun yok", "çalışıyor", "calisiyor"] },
  ],
  tablet: [
    { id: "ekran",    label: "Ekran kırık",   mult: 0.40, repair: [3000, 6000], kw: ["ekran", "kırık", "kirik", "çatlak"] },
    { id: "batarya",  label: "Batarya zayıf", mult: 0.75, repair: [2000, 3500], kw: ["batarya", "pil"] },
    { id: "acilmiyor",label: "Açılmıyor",     mult: 0.25, repair: [2000, 5000], kw: ["açılmıyor", "acilmiyor"] },
    { id: "yok",      label: "Sorunu yok",    mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  console: [
    { id: "hdmi",     label: "HDMI / görüntü sorunu", mult: 0.60, repair: [1500, 2800], kw: ["hdmi", "görüntü verm", "goruntu verm"] },
    { id: "disk",     label: "Disk sürücüsü",         mult: 0.65, repair: [1500, 3000], kw: ["disk", "cd", "okumuyor"] },
    { id: "kol",      label: "Kol (drift/arızalı)",   mult: 0.85, repair: [800, 1600],  kw: ["kol", "drift", "joystick", "controller"] },
    { id: "acilmiyor",label: "Açılmıyor",             mult: 0.35, repair: [2000, 4000], kw: ["açılmıyor", "acilmiyor"] },
    { id: "yok",      label: "Sorunu yok",            mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  watch: [
    { id: "ekran",    label: "Ekran kırık / çizik", mult: 0.40, repair: [2000, 4500], kw: ["ekran", "kırık", "kirik", "cam", "çizik"] },
    { id: "batarya",  label: "Batarya zayıf",       mult: 0.70, repair: [1200, 2500], kw: ["batarya", "pil", "şarj"] },
    { id: "acilmiyor",label: "Açılmıyor",           mult: 0.25, repair: [1500, 3500], kw: ["açılmıyor", "acilmiyor"] },
    { id: "yok",      label: "Sorunu yok",          mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  headphone: [
    { id: "tektaraf", label: "Tek taraf çalışmıyor", mult: 0.40, repair: [800, 2000],  kw: ["tek taraf", "sağ", "sol", "ses gelmiyor", "ses yok"] },
    { id: "batarya",  label: "Batarya zayıf",        mult: 0.60, repair: [800, 1800],  kw: ["batarya", "pil", "şarj tutm", "sarj tutm"] },
    { id: "sarjkutu", label: "Şarj kutusu arızalı",  mult: 0.55, repair: [1000, 2500], kw: ["kutu", "case", "şarj olmuyor", "sarj olmuyor"] },
    { id: "yok",      label: "Sorunu yok",           mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  camera: [
    { id: "lens",     label: "Lens / odaklama sorunu",  mult: 0.55, repair: [2500, 6000], kw: ["lens", "odak", "netleme", "focus"] },
    { id: "ekran",    label: "Ekran / vizör arızalı",   mult: 0.65, repair: [1500, 3500], kw: ["ekran", "vizör", "vizor"] },
    { id: "mekanik",  label: "Deklanşör / mekanik",     mult: 0.50, repair: [2000, 5000], kw: ["deklanşör", "deklansor", "perde", "shutter"] },
    { id: "acilmiyor",label: "Açılmıyor",               mult: 0.30, repair: [2000, 5000], kw: ["açılmıyor", "acilmiyor"] },
    { id: "yok",      label: "Sorunu yok",              mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  appliance: [
    { id: "calismiyor", label: "Çalışmıyor / açılmıyor",             mult: 0.30, repair: [2500, 6000], kw: ["çalışmıyor", "calismiyor", "açılmıyor", "acilmiyor"] },
    { id: "performans", label: "Soğutmuyor / ısıtmıyor / yıkamıyor", mult: 0.45, repair: [2000, 5000], kw: ["soğutmuyor", "sogutmuyor", "ısıtmıyor", "isitmiyor", "yıkamıyor", "yikamiyor", "kurutmuyor"] },
    { id: "su",         label: "Su kaçırıyor / ses yapıyor",         mult: 0.55, repair: [1500, 4000], kw: ["su kaçırıyor", "su kacir", "su akıtıyor", "ses yapıyor", "gürültü", "gurultu"] },
    { id: "kozmetik",   label: "Çizik / göçük (kozmetik)",           mult: 0.80, repair: [500, 1500],  kw: ["çizik", "cizik", "göçük", "gocuk", "ezik"] },
    { id: "yok",        label: "Sorunu yok",                         mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  smallapp: [
    { id: "calismiyor", label: "Çalışmıyor",             mult: 0.30, repair: [800, 2500],  kw: ["çalışmıyor", "calismiyor", "açılmıyor", "acilmiyor"] },
    { id: "batarya",    label: "Batarya zayıf",          mult: 0.65, repair: [900, 2500],  kw: ["batarya", "pil", "şarj tutm", "sarj tutm", "şarj olmuyor"] },
    { id: "performans", label: "Güç / performans düşük", mult: 0.60, repair: [700, 2000],  kw: ["çekmiyor", "cekmiyor", "güç", "guc", "zayıf", "performans"] },
    { id: "parca",      label: "Parça kırık / eksik",    mult: 0.70, repair: [500, 1500],  kw: ["parça", "parca", "kırık", "kirik", "eksik"] },
    { id: "yok",        label: "Sorunu yok",             mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor"] },
  ],
  bike: [
    { id: "vites",   label: "Vites / fren sorunu",        mult: 0.75, repair: [500, 1500],  kw: ["vites", "fren", "zincir"] },
    { id: "lastik",  label: "Lastik / jant",              mult: 0.80, repair: [400, 1200],  kw: ["lastik", "jant", "teker"] },
    { id: "kadro",   label: "Kadro / gövde hasarlı",      mult: 0.35, repair: [1500, 4000], kw: ["kadro", "gövde", "govde", "çatlak", "kırık", "kirik"] },
    { id: "batarya", label: "Batarya zayıf (elektrikli)", mult: 0.55, repair: [2000, 5000], kw: ["batarya", "pil", "şarj", "sarj", "menzil"] },
    { id: "yok",     label: "Sorunu yok",                 mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "çalışıyor", "sağlam", "saglam"] },
  ],
  furniture: [
    { id: "kumas",     label: "Kumaş / deri yıpranmış",    mult: 0.55, repair: [2500, 6000], kw: ["kumaş", "kumas", "deri", "yıpran", "yipran", "yırtık", "yirtik"] },
    { id: "mekanizma", label: "Mekanizma / iskelet kırık", mult: 0.40, repair: [1000, 3000], kw: ["mekanizma", "iskelet", "kırık", "kirik", "ayak"] },
    { id: "kozmetik",  label: "Çizik / leke (kozmetik)",   mult: 0.75, repair: [500, 1500],  kw: ["çizik", "cizik", "leke"] },
    { id: "yok",       label: "Sorunu yok",                mult: 1.00, repair: [0, 0],       kw: ["sorun yok", "temiz", "sağlam", "saglam"] },
  ],
  tool: [
    { id: "calismiyor", label: "Çalışmıyor / motor arızası", mult: 0.35, repair: [700, 2200], kw: ["çalışmıyor", "calismiyor", "motor", "yanık", "yanik"] },
    { id: "batarya",    label: "Akü / batarya sorunu",       mult: 0.55, repair: [600, 1800], kw: ["akü", "aku", "batarya", "şarj", "sarj"] },
    { id: "salter",     label: "Şalter / devir sorunu",      mult: 0.60, repair: [400, 1200], kw: ["şalter", "salter", "devir", "buton"] },
    { id: "yok",        label: "Sorunu yok, çalışıyor",      mult: 1.00, repair: [0, 0],      kw: ["sorunsuz", "çalışıyor", "sağlam", "saglam"] },
  ],
};

/* ================== ÜRÜN VERİTABANI v7 ==================
   1236 ürün / 747 aile / 13 kategori — build_data.py üreticisiyle.
   Fiyatlar ÖRNEK; üretim öncesi fiyat promptuyla güncellenmeli.
   Satır: [id, aile, marka, model, varyant, kategori, 2.el min, 2.el max,
           tamirFaktörü, gün, sıfırFiyat(0=satılmıyor), yeniMi, [kelimeler]] */
const ROWS = [
["apple-iphone-6s-32-gb", "apple-iphone-6s", "Apple", "iPhone 6s 32 GB", "32 GB", "phone", 2800, 4200, 0.4, 9, 0, 0, ["iphone 6", "iphone 6s", "iphone 6s 32 gb", "apple"]],
["apple-iphone-6s-64-gb", "apple-iphone-6s", "Apple", "iPhone 6s 64 GB", "64 GB", "phone", 2800, 4200, 0.4, 9, 0, 0, ["iphone 6", "iphone 6s", "iphone 6s 64 gb", "apple"]],
["apple-iphone-7-32-gb", "apple-iphone-7", "Apple", "iPhone 7 32 GB", "32 GB", "phone", 3500, 5000, 0.45, 8, 0, 0, ["iphone 7", "iphone 7 32 gb", "apple"]],
["apple-iphone-7-128-gb", "apple-iphone-7", "Apple", "iPhone 7 128 GB", "128 GB", "phone", 3500, 5000, 0.45, 8, 0, 0, ["iphone 7", "iphone 7 128 gb", "apple"]],
["apple-iphone-7-plus-32-gb", "apple-iphone-7-plus", "Apple", "iPhone 7 Plus 32 GB", "32 GB", "phone", 4500, 6500, 0.5, 8, 0, 0, ["7 plus", "iphone 7 plus", "iphone 7 plus 32 gb", "apple"]],
["apple-iphone-7-plus-128-gb", "apple-iphone-7-plus", "Apple", "iPhone 7 Plus 128 GB", "128 GB", "phone", 4500, 6500, 0.5, 8, 0, 0, ["7 plus", "iphone 7 plus", "iphone 7 plus 128 gb", "apple"]],
["apple-iphone-8-64-gb", "apple-iphone-8", "Apple", "iPhone 8 64 GB", "64 GB", "phone", 4500, 6500, 0.5, 8, 0, 0, ["iphone 8", "iphone 8 64 gb", "apple"]],
["apple-iphone-8-256-gb", "apple-iphone-8", "Apple", "iPhone 8 256 GB", "256 GB", "phone", 4900, 7100, 0.5, 8, 0, 0, ["iphone 8", "iphone 8 256 gb", "apple"]],
["apple-iphone-8-plus-64-gb", "apple-iphone-8-plus", "Apple", "iPhone 8 Plus 64 GB", "64 GB", "phone", 5500, 7800, 0.55, 7, 0, 0, ["8 plus", "iphone 8 plus", "iphone 8 plus 64 gb", "apple"]],
["apple-iphone-8-plus-256-gb", "apple-iphone-8-plus", "Apple", "iPhone 8 Plus 256 GB", "256 GB", "phone", 6000, 8500, 0.55, 7, 0, 0, ["8 plus", "iphone 8 plus", "iphone 8 plus 256 gb", "apple"]],
["apple-iphone-x-64-gb", "apple-iphone-x", "Apple", "iPhone X 64 GB", "64 GB", "phone", 6500, 8500, 0.6, 7, 0, 0, ["iphone x", "iphone x 64 gb", "apple"]],
["apple-iphone-x-256-gb", "apple-iphone-x", "Apple", "iPhone X 256 GB", "256 GB", "phone", 7100, 9300, 0.6, 7, 0, 0, ["iphone x", "iphone x 256 gb", "apple"]],
["apple-iphone-xr-64-gb", "apple-iphone-xr", "Apple", "iPhone XR 64 GB", "64 GB", "phone", 7500, 9500, 0.6, 6, 0, 0, ["xr", "iphone xr", "iphone xr 64 gb", "apple"]],
["apple-iphone-xr-128-gb", "apple-iphone-xr", "Apple", "iPhone XR 128 GB", "128 GB", "phone", 7500, 9500, 0.6, 6, 0, 0, ["xr", "iphone xr", "iphone xr 128 gb", "apple"]],
["apple-iphone-xs-64-gb", "apple-iphone-xs", "Apple", "iPhone XS 64 GB", "64 GB", "phone", 7000, 9000, 0.6, 7, 0, 0, ["xs", "iphone xs", "iphone xs 64 gb", "apple"]],
["apple-iphone-xs-256-gb", "apple-iphone-xs", "Apple", "iPhone XS 256 GB", "256 GB", "phone", 7600, 9800, 0.6, 7, 0, 0, ["xs", "iphone xs", "iphone xs 256 gb", "apple"]],
["apple-iphone-xs-max-64-gb", "apple-iphone-xs-max", "Apple", "iPhone XS Max 64 GB", "64 GB", "phone", 8000, 10500, 0.65, 7, 0, 0, ["xs max", "iphone xs max", "iphone xs max 64 gb", "apple"]],
["apple-iphone-xs-max-256-gb", "apple-iphone-xs-max", "Apple", "iPhone XS Max 256 GB", "256 GB", "phone", 8700, 11400, 0.65, 7, 0, 0, ["xs max", "iphone xs max", "iphone xs max 256 gb", "apple"]],
["apple-iphone-se-2020-64-gb", "apple-iphone-se-2020", "Apple", "iPhone SE (2020) 64 GB", "64 GB", "phone", 6000, 8000, 0.55, 7, 0, 0, ["se 2020", "iphone se (2020)", "iphone se (2020) 64 gb", "apple"]],
["apple-iphone-se-2020-128-gb", "apple-iphone-se-2020", "Apple", "iPhone SE (2020) 128 GB", "128 GB", "phone", 6000, 8000, 0.55, 7, 0, 0, ["se 2020", "iphone se (2020)", "iphone se (2020) 128 gb", "apple"]],
["apple-iphone-se-2022-128-gb", "apple-iphone-se-2022", "Apple", "iPhone SE (2022) 128 GB", "128 GB", "phone", 8000, 11000, 0.7, 7, 0, 0, ["iphone se", "iphone se (2022)", "iphone se (2022) 128 gb", "apple"]],
["apple-iphone-se-2022-256-gb", "apple-iphone-se-2022", "Apple", "iPhone SE (2022) 256 GB", "256 GB", "phone", 8700, 12000, 0.7, 7, 0, 0, ["iphone se", "iphone se (2022)", "iphone se (2022) 256 gb", "apple"]],
["apple-iphone-11-64-gb", "apple-iphone-11", "Apple", "iPhone 11 64 GB", "64 GB", "phone", 12000, 16000, 0.8, 5, 0, 0, ["iphone 11", "iphone 11 64 gb", "apple"]],
["apple-iphone-11-128-gb", "apple-iphone-11", "Apple", "iPhone 11 128 GB", "128 GB", "phone", 12000, 16000, 0.8, 5, 0, 0, ["iphone 11", "iphone 11 128 gb", "apple"]],
["apple-iphone-11-pro-64-gb", "apple-iphone-11-pro", "Apple", "iPhone 11 Pro 64 GB", "64 GB", "phone", 15000, 19000, 0.9, 5, 0, 0, ["11 pro", "iphone 11 pro", "iphone 11 pro 64 gb", "apple"]],
["apple-iphone-11-pro-256-gb", "apple-iphone-11-pro", "Apple", "iPhone 11 Pro 256 GB", "256 GB", "phone", 16400, 20700, 0.9, 5, 0, 0, ["11 pro", "iphone 11 pro", "iphone 11 pro 256 gb", "apple"]],
["apple-iphone-11-pro-max-64-gb", "apple-iphone-11-pro-max", "Apple", "iPhone 11 Pro Max 64 GB", "64 GB", "phone", 17000, 22000, 0.95, 5, 0, 0, ["11 pro max", "iphone 11 pro max", "iphone 11 pro max 64 gb", "apple"]],
["apple-iphone-11-pro-max-256-gb", "apple-iphone-11-pro-max", "Apple", "iPhone 11 Pro Max 256 GB", "256 GB", "phone", 18500, 24000, 0.95, 5, 0, 0, ["11 pro max", "iphone 11 pro max", "iphone 11 pro max 256 gb", "apple"]],
["apple-iphone-12-mini-128-gb", "apple-iphone-12-mini", "Apple", "iPhone 12 mini 128 GB", "128 GB", "phone", 13000, 17000, 0.9, 6, 0, 0, ["12 mini", "iphone 12 mini", "iphone 12 mini 128 gb", "apple"]],
["apple-iphone-12-mini-256-gb", "apple-iphone-12-mini", "Apple", "iPhone 12 mini 256 GB", "256 GB", "phone", 14200, 18500, 0.9, 6, 0, 0, ["12 mini", "iphone 12 mini", "iphone 12 mini 256 gb", "apple"]],
["apple-iphone-12-128-gb", "apple-iphone-12", "Apple", "iPhone 12 128 GB", "128 GB", "phone", 16000, 21000, 0.9, 5, 0, 0, ["iphone 12", "iphone 12 128 gb", "apple"]],
["apple-iphone-12-256-gb", "apple-iphone-12", "Apple", "iPhone 12 256 GB", "256 GB", "phone", 17400, 22900, 0.9, 5, 0, 0, ["iphone 12", "iphone 12 256 gb", "apple"]],
["apple-iphone-12-pro-128-gb", "apple-iphone-12-pro", "Apple", "iPhone 12 Pro 128 GB", "128 GB", "phone", 20000, 25000, 1.0, 5, 0, 0, ["12 pro", "iphone 12 pro", "iphone 12 pro 128 gb", "apple"]],
["apple-iphone-12-pro-256-gb", "apple-iphone-12-pro", "Apple", "iPhone 12 Pro 256 GB", "256 GB", "phone", 21800, 27300, 1.0, 5, 0, 0, ["12 pro", "iphone 12 pro", "iphone 12 pro 256 gb", "apple"]],
["apple-iphone-12-pro-512-gb", "apple-iphone-12-pro", "Apple", "iPhone 12 Pro 512 GB", "512 GB", "phone", 24000, 30000, 1.0, 5, 0, 0, ["12 pro", "iphone 12 pro", "iphone 12 pro 512 gb", "apple"]],
["apple-iphone-12-pro-max-128-gb", "apple-iphone-12-pro-max", "Apple", "iPhone 12 Pro Max 128 GB", "128 GB", "phone", 23000, 29000, 1.1, 5, 0, 0, ["12 pro max", "iphone 12 pro max", "iphone 12 pro max 128 gb", "apple"]],
["apple-iphone-12-pro-max-256-gb", "apple-iphone-12-pro-max", "Apple", "iPhone 12 Pro Max 256 GB", "256 GB", "phone", 25100, 31600, 1.1, 5, 0, 0, ["12 pro max", "iphone 12 pro max", "iphone 12 pro max 256 gb", "apple"]],
["apple-iphone-12-pro-max-512-gb", "apple-iphone-12-pro-max", "Apple", "iPhone 12 Pro Max 512 GB", "512 GB", "phone", 27600, 34800, 1.1, 5, 0, 0, ["12 pro max", "iphone 12 pro max", "iphone 12 pro max 512 gb", "apple"]],
["apple-iphone-13-mini-128-gb", "apple-iphone-13-mini", "Apple", "iPhone 13 mini 128 GB", "128 GB", "phone", 19000, 24000, 1.0, 5, 0, 0, ["13 mini", "iphone 13 mini", "iphone 13 mini 128 gb", "apple"]],
["apple-iphone-13-mini-256-gb", "apple-iphone-13-mini", "Apple", "iPhone 13 mini 256 GB", "256 GB", "phone", 20700, 26200, 1.0, 5, 0, 0, ["13 mini", "iphone 13 mini", "iphone 13 mini 256 gb", "apple"]],
["apple-iphone-13-128-gb", "apple-iphone-13", "Apple", "iPhone 13 128 GB", "128 GB", "phone", 22000, 28000, 1.0, 4, 0, 0, ["iphone 13", "iphone 13 128 gb", "apple"]],
["apple-iphone-13-256-gb", "apple-iphone-13", "Apple", "iPhone 13 256 GB", "256 GB", "phone", 24000, 30500, 1.0, 4, 0, 0, ["iphone 13", "iphone 13 256 gb", "apple"]],
["apple-iphone-13-512-gb", "apple-iphone-13", "Apple", "iPhone 13 512 GB", "512 GB", "phone", 26400, 33600, 1.0, 4, 0, 0, ["iphone 13", "iphone 13 512 gb", "apple"]],
["apple-iphone-13-pro-128-gb", "apple-iphone-13-pro", "Apple", "iPhone 13 Pro 128 GB", "128 GB", "phone", 27000, 34000, 1.1, 4, 0, 0, ["13 pro", "iphone 13 pro", "iphone 13 pro 128 gb", "apple"]],
["apple-iphone-13-pro-256-gb", "apple-iphone-13-pro", "Apple", "iPhone 13 Pro 256 GB", "256 GB", "phone", 29400, 37100, 1.1, 4, 0, 0, ["13 pro", "iphone 13 pro", "iphone 13 pro 256 gb", "apple"]],
["apple-iphone-13-pro-512-gb", "apple-iphone-13-pro", "Apple", "iPhone 13 Pro 512 GB", "512 GB", "phone", 32400, 40800, 1.1, 4, 0, 0, ["13 pro", "iphone 13 pro", "iphone 13 pro 512 gb", "apple"]],
["apple-iphone-13-pro-max-128-gb", "apple-iphone-13-pro-max", "Apple", "iPhone 13 Pro Max 128 GB", "128 GB", "phone", 30000, 38000, 1.2, 4, 0, 0, ["13 pro max", "iphone 13 pro max", "iphone 13 pro max 128 gb", "apple"]],
["apple-iphone-13-pro-max-256-gb", "apple-iphone-13-pro-max", "Apple", "iPhone 13 Pro Max 256 GB", "256 GB", "phone", 32700, 41400, 1.2, 4, 0, 0, ["13 pro max", "iphone 13 pro max", "iphone 13 pro max 256 gb", "apple"]],
["apple-iphone-13-pro-max-512-gb", "apple-iphone-13-pro-max", "Apple", "iPhone 13 Pro Max 512 GB", "512 GB", "phone", 36000, 45600, 1.2, 4, 0, 0, ["13 pro max", "iphone 13 pro max", "iphone 13 pro max 512 gb", "apple"]],
["apple-iphone-14-128-gb", "apple-iphone-14", "Apple", "iPhone 14 128 GB", "128 GB", "phone", 29000, 36000, 1.2, 4, 44999, 0, ["iphone 14", "iphone 14 128 gb", "apple"]],
["apple-iphone-14-256-gb", "apple-iphone-14", "Apple", "iPhone 14 256 GB", "256 GB", "phone", 31600, 39200, 1.2, 4, 48999, 0, ["iphone 14", "iphone 14 256 gb", "apple"]],
["apple-iphone-14-512-gb", "apple-iphone-14", "Apple", "iPhone 14 512 GB", "512 GB", "phone", 34800, 43200, 1.2, 4, 53999, 0, ["iphone 14", "iphone 14 512 gb", "apple"]],
["apple-iphone-14-plus-128-gb", "apple-iphone-14-plus", "Apple", "iPhone 14 Plus 128 GB", "128 GB", "phone", 31000, 38000, 1.2, 5, 48999, 0, ["14 plus", "iphone 14 plus", "iphone 14 plus 128 gb", "apple"]],
["apple-iphone-14-plus-256-gb", "apple-iphone-14-plus", "Apple", "iPhone 14 Plus 256 GB", "256 GB", "phone", 33800, 41400, 1.2, 5, 53999, 0, ["14 plus", "iphone 14 plus", "iphone 14 plus 256 gb", "apple"]],
["apple-iphone-14-plus-512-gb", "apple-iphone-14-plus", "Apple", "iPhone 14 Plus 512 GB", "512 GB", "phone", 37200, 45600, 1.2, 5, 58999, 0, ["14 plus", "iphone 14 plus", "iphone 14 plus 512 gb", "apple"]],
["apple-iphone-14-pro-128-gb", "apple-iphone-14-pro", "Apple", "iPhone 14 Pro 128 GB", "128 GB", "phone", 36000, 44000, 1.3, 4, 0, 0, ["14 pro", "iphone 14 pro", "iphone 14 pro 128 gb", "apple"]],
["apple-iphone-14-pro-256-gb", "apple-iphone-14-pro", "Apple", "iPhone 14 Pro 256 GB", "256 GB", "phone", 39200, 48000, 1.3, 4, 0, 0, ["14 pro", "iphone 14 pro", "iphone 14 pro 256 gb", "apple"]],
["apple-iphone-14-pro-512-gb", "apple-iphone-14-pro", "Apple", "iPhone 14 Pro 512 GB", "512 GB", "phone", 43200, 52800, 1.3, 4, 0, 0, ["14 pro", "iphone 14 pro", "iphone 14 pro 512 gb", "apple"]],
["apple-iphone-14-pro-max-256-gb", "apple-iphone-14-pro-max", "Apple", "iPhone 14 Pro Max 256 GB", "256 GB", "phone", 43600, 52300, 1.4, 4, 0, 0, ["14 pro max", "iphone 14 pro max", "iphone 14 pro max 256 gb", "apple"]],
["apple-iphone-14-pro-max-512-gb", "apple-iphone-14-pro-max", "Apple", "iPhone 14 Pro Max 512 GB", "512 GB", "phone", 48000, 57600, 1.4, 4, 0, 0, ["14 pro max", "iphone 14 pro max", "iphone 14 pro max 512 gb", "apple"]],
["apple-iphone-14-pro-max-1-tb", "apple-iphone-14-pro-max", "Apple", "iPhone 14 Pro Max 1 TB", "1 TB", "phone", 52800, 63400, 1.4, 4, 0, 0, ["14 pro max", "iphone 14 pro max", "iphone 14 pro max 1 tb", "apple"]],
["apple-iphone-15-128-gb", "apple-iphone-15", "Apple", "iPhone 15 128 GB", "128 GB", "phone", 38000, 46000, 1.4, 4, 52999, 0, ["iphone 15", "iphone 15 128 gb", "apple"]],
["apple-iphone-15-256-gb", "apple-iphone-15", "Apple", "iPhone 15 256 GB", "256 GB", "phone", 41400, 50100, 1.4, 4, 56999, 0, ["iphone 15", "iphone 15 256 gb", "apple"]],
["apple-iphone-15-512-gb", "apple-iphone-15", "Apple", "iPhone 15 512 GB", "512 GB", "phone", 45600, 55200, 1.4, 4, 62999, 0, ["iphone 15", "iphone 15 512 gb", "apple"]],
["apple-iphone-15-plus-128-gb", "apple-iphone-15-plus", "Apple", "iPhone 15 Plus 128 GB", "128 GB", "phone", 40000, 49000, 1.4, 5, 56999, 0, ["15 plus", "iphone 15 plus", "iphone 15 plus 128 gb", "apple"]],
["apple-iphone-15-plus-256-gb", "apple-iphone-15-plus", "Apple", "iPhone 15 Plus 256 GB", "256 GB", "phone", 43600, 53400, 1.4, 5, 60999, 0, ["15 plus", "iphone 15 plus", "iphone 15 plus 256 gb", "apple"]],
["apple-iphone-15-plus-512-gb", "apple-iphone-15-plus", "Apple", "iPhone 15 Plus 512 GB", "512 GB", "phone", 48000, 58800, 1.4, 5, 66999, 0, ["15 plus", "iphone 15 plus", "iphone 15 plus 512 gb", "apple"]],
["apple-iphone-15-pro-128-gb", "apple-iphone-15-pro", "Apple", "iPhone 15 Pro 128 GB", "128 GB", "phone", 48000, 58000, 1.6, 4, 64999, 0, ["15 pro", "iphone 15 pro", "iphone 15 pro 128 gb", "apple"]],
["apple-iphone-15-pro-256-gb", "apple-iphone-15-pro", "Apple", "iPhone 15 Pro 256 GB", "256 GB", "phone", 52300, 63200, 1.6, 4, 69999, 0, ["15 pro", "iphone 15 pro", "iphone 15 pro 256 gb", "apple"]],
["apple-iphone-15-pro-512-gb", "apple-iphone-15-pro", "Apple", "iPhone 15 Pro 512 GB", "512 GB", "phone", 57600, 69600, 1.6, 4, 76999, 0, ["15 pro", "iphone 15 pro", "iphone 15 pro 512 gb", "apple"]],
["apple-iphone-15-pro-max-256-gb", "apple-iphone-15-pro-max", "Apple", "iPhone 15 Pro Max 256 GB", "256 GB", "phone", 58900, 70800, 1.7, 4, 74999, 0, ["15 pro max", "iphone 15 pro max", "iphone 15 pro max 256 gb", "apple"]],
["apple-iphone-15-pro-max-512-gb", "apple-iphone-15-pro-max", "Apple", "iPhone 15 Pro Max 512 GB", "512 GB", "phone", 64800, 78000, 1.7, 4, 82999, 0, ["15 pro max", "iphone 15 pro max", "iphone 15 pro max 512 gb", "apple"]],
["apple-iphone-15-pro-max-1-tb", "apple-iphone-15-pro-max", "Apple", "iPhone 15 Pro Max 1 TB", "1 TB", "phone", 71300, 85800, 1.7, 4, 92999, 0, ["15 pro max", "iphone 15 pro max", "iphone 15 pro max 1 tb", "apple"]],
["apple-iphone-16e-128-gb", "apple-iphone-16e", "Apple", "iPhone 16e 128 GB", "128 GB", "phone", 30900, 39600, 1.3, 5, 43999, 1, ["16e", "iphone 16e", "iphone 16e 128 gb", "apple"]],
["apple-iphone-16e-256-gb", "apple-iphone-16e", "Apple", "iPhone 16e 256 GB", "256 GB", "phone", 33700, 43200, 1.3, 5, 47999, 1, ["16e", "iphone 16e", "iphone 16e 256 gb", "apple"]],
["apple-iphone-16-128-gb", "apple-iphone-16", "Apple", "iPhone 16 128 GB", "128 GB", "phone", 50000, 60000, 1.6, 4, 61999, 0, ["iphone 16", "iphone 16 128 gb", "apple"]],
["apple-iphone-16-256-gb", "apple-iphone-16", "Apple", "iPhone 16 256 GB", "256 GB", "phone", 54500, 65400, 1.6, 4, 67999, 0, ["iphone 16", "iphone 16 256 gb", "apple"]],
["apple-iphone-16-512-gb", "apple-iphone-16", "Apple", "iPhone 16 512 GB", "512 GB", "phone", 60000, 72000, 1.6, 4, 74999, 0, ["iphone 16", "iphone 16 512 gb", "apple"]],
["apple-iphone-16-plus-128-gb", "apple-iphone-16-plus", "Apple", "iPhone 16 Plus 128 GB", "128 GB", "phone", 53000, 64000, 1.6, 5, 68999, 0, ["16 plus", "iphone 16 plus", "iphone 16 plus 128 gb", "apple"]],
["apple-iphone-16-plus-256-gb", "apple-iphone-16-plus", "Apple", "iPhone 16 Plus 256 GB", "256 GB", "phone", 57800, 69800, 1.6, 5, 73999, 0, ["16 plus", "iphone 16 plus", "iphone 16 plus 256 gb", "apple"]],
["apple-iphone-16-plus-512-gb", "apple-iphone-16-plus", "Apple", "iPhone 16 Plus 512 GB", "512 GB", "phone", 63600, 76800, 1.6, 5, 79999, 0, ["16 plus", "iphone 16 plus", "iphone 16 plus 512 gb", "apple"]],
["apple-iphone-16-pro-128-gb", "apple-iphone-16-pro", "Apple", "iPhone 16 Pro 128 GB", "128 GB", "phone", 62000, 74000, 1.8, 4, 74999, 0, ["16 pro", "iphone 16 pro", "iphone 16 pro 128 gb", "apple"]],
["apple-iphone-16-pro-256-gb", "apple-iphone-16-pro", "Apple", "iPhone 16 Pro 256 GB", "256 GB", "phone", 56200, 72000, 1.8, 4, 79999, 0, ["16 pro", "iphone 16 pro", "iphone 16 pro 256 gb", "apple"]],
["apple-iphone-16-pro-512-gb", "apple-iphone-16-pro", "Apple", "iPhone 16 Pro 512 GB", "512 GB", "phone", 74400, 88800, 1.8, 4, 88999, 0, ["16 pro", "iphone 16 pro", "iphone 16 pro 512 gb", "apple"]],
["apple-iphone-16-pro-max-256-gb", "apple-iphone-16-pro-max", "Apple", "iPhone 16 Pro Max 256 GB", "256 GB", "phone", 63200, 81000, 1.9, 4, 89999, 0, ["16 pro max", "iphone 16 pro max", "iphone 16 pro max 256 gb", "apple"]],
["apple-iphone-16-pro-max-512-gb", "apple-iphone-16-pro-max", "Apple", "iPhone 16 Pro Max 512 GB", "512 GB", "phone", 68800, 88200, 1.9, 4, 97999, 0, ["16 pro max", "iphone 16 pro max", "iphone 16 pro max 512 gb", "apple"]],
["apple-iphone-16-pro-max-1-tb", "apple-iphone-16-pro-max", "Apple", "iPhone 16 Pro Max 1 TB", "1 TB", "phone", 77200, 99000, 1.9, 4, 109999, 0, ["16 pro max", "iphone 16 pro max", "iphone 16 pro max 1 tb", "apple"]],
["apple-iphone-17-256-gb", "apple-iphone-17", "Apple", "iPhone 17 256 GB", "256 GB", "phone", 54800, 70200, 1.8, 4, 77999, 1, ["iphone 17", "iphone 17 256 gb", "apple"]],
["apple-iphone-17-512-gb", "apple-iphone-17", "Apple", "iPhone 17 512 GB", "512 GB", "phone", 61800, 79200, 1.8, 4, 87999, 1, ["iphone 17", "iphone 17 512 gb", "apple"]],
["apple-iphone-air-256-gb", "apple-iphone-air", "Apple", "iPhone Air 256 GB", "256 GB", "phone", 63200, 81000, 1.9, 5, 89999, 1, ["iphone air", "iphone air 256 gb", "apple"]],
["apple-iphone-air-512-gb", "apple-iphone-air", "Apple", "iPhone Air 512 GB", "512 GB", "phone", 70200, 90000, 1.9, 5, 99999, 1, ["iphone air", "iphone air 512 gb", "apple"]],
["apple-iphone-17-pro-256-gb", "apple-iphone-17-pro", "Apple", "iPhone 17 Pro 256 GB", "256 GB", "phone", 73700, 94500, 2.0, 4, 104999, 1, ["17 pro", "iphone 17 pro", "iphone 17 pro 256 gb", "apple"]],
["apple-iphone-17-pro-512-gb", "apple-iphone-17-pro", "Apple", "iPhone 17 Pro 512 GB", "512 GB", "phone", 79300, 101700, 2.0, 4, 112999, 1, ["17 pro", "iphone 17 pro", "iphone 17 pro 512 gb", "apple"]],
["apple-iphone-17-pro-1-tb", "apple-iphone-17-pro", "Apple", "iPhone 17 Pro 1 TB", "1 TB", "phone", 87800, 112500, 2.0, 4, 124999, 1, ["17 pro", "iphone 17 pro", "iphone 17 pro 1 tb", "apple"]],
["apple-iphone-17-pro-max-256-gb", "apple-iphone-17-pro-max", "Apple", "iPhone 17 Pro Max 256 GB", "256 GB", "phone", 85600, 109800, 2.1, 4, 121999, 1, ["17 pro max", "iphone 17 pro max", "iphone 17 pro max 256 gb", "apple"]],
["apple-iphone-17-pro-max-512-gb", "apple-iphone-17-pro-max", "Apple", "iPhone 17 Pro Max 512 GB", "512 GB", "phone", 93400, 119700, 2.1, 4, 132999, 1, ["17 pro max", "iphone 17 pro max", "iphone 17 pro max 512 gb", "apple"]],
["apple-iphone-17-pro-max-1-tb", "apple-iphone-17-pro-max", "Apple", "iPhone 17 Pro Max 1 TB", "1 TB", "phone", 99000, 126900, 2.1, 4, 140999, 1, ["17 pro max", "iphone 17 pro max", "iphone 17 pro max 1 tb", "apple"]],
["samsung-galaxy-s10-128-gb", "samsung-galaxy-s10", "Samsung", "Galaxy S10 128 GB", "128 GB", "phone", 7500, 10000, 0.7, 8, 0, 0, ["s10", "galaxy s10", "galaxy s10 128 gb", "samsung"]],
["samsung-galaxy-s10-256-gb", "samsung-galaxy-s10", "Samsung", "Galaxy S10 256 GB", "256 GB", "phone", 8200, 10900, 0.7, 8, 0, 0, ["s10", "galaxy s10", "galaxy s10 256 gb", "samsung"]],
["samsung-galaxy-s10plus-128-gb", "samsung-galaxy-s10plus", "Samsung", "Galaxy S10+ 128 GB", "128 GB", "phone", 8500, 11500, 0.75, 8, 0, 0, ["s10+", "s10 plus", "galaxy s10+", "galaxy s10+ 128 gb", "samsung"]],
["samsung-galaxy-s10plus-256-gb", "samsung-galaxy-s10plus", "Samsung", "Galaxy S10+ 256 GB", "256 GB", "phone", 9300, 12500, 0.75, 8, 0, 0, ["s10+", "s10 plus", "galaxy s10+", "galaxy s10+ 256 gb", "samsung"]],
["samsung-galaxy-note-10-256-gb", "samsung-galaxy-note-10", "Samsung", "Galaxy Note 10 256 GB", "256 GB", "phone", 9800, 13100, 0.8, 8, 0, 0, ["note 10", "galaxy note 10", "galaxy note 10 256 gb", "samsung"]],
["samsung-galaxy-note-20-ultra-256-gb", "samsung-galaxy-note-20-ultra", "Samsung", "Galaxy Note 20 Ultra 256 GB", "256 GB", "phone", 17400, 22900, 1.0, 7, 0, 0, ["note 20", "galaxy note 20 ultra", "galaxy note 20 ultra 256 gb", "samsung"]],
["samsung-galaxy-s20-128-gb", "samsung-galaxy-s20", "Samsung", "Galaxy S20 128 GB", "128 GB", "phone", 9000, 12000, 0.8, 8, 0, 0, ["s20", "galaxy s20", "galaxy s20 128 gb", "samsung"]],
["samsung-galaxy-s20-256-gb", "samsung-galaxy-s20", "Samsung", "Galaxy S20 256 GB", "256 GB", "phone", 9800, 13100, 0.8, 8, 0, 0, ["s20", "galaxy s20", "galaxy s20 256 gb", "samsung"]],
["samsung-galaxy-s20-fe-128-gb", "samsung-galaxy-s20-fe", "Samsung", "Galaxy S20 FE 128 GB", "128 GB", "phone", 8500, 11500, 0.7, 8, 0, 0, ["s20 fe", "galaxy s20 fe", "galaxy s20 fe 128 gb", "samsung"]],
["samsung-galaxy-s20-fe-256-gb", "samsung-galaxy-s20-fe", "Samsung", "Galaxy S20 FE 256 GB", "256 GB", "phone", 9300, 12500, 0.7, 8, 0, 0, ["s20 fe", "galaxy s20 fe", "galaxy s20 fe 256 gb", "samsung"]],
["samsung-galaxy-s21-128-gb", "samsung-galaxy-s21", "Samsung", "Galaxy S21 128 GB", "128 GB", "phone", 12000, 16000, 0.9, 7, 0, 0, ["s21", "galaxy s21", "galaxy s21 128 gb", "samsung"]],
["samsung-galaxy-s21-256-gb", "samsung-galaxy-s21", "Samsung", "Galaxy S21 256 GB", "256 GB", "phone", 13100, 17400, 0.9, 7, 0, 0, ["s21", "galaxy s21", "galaxy s21 256 gb", "samsung"]],
["samsung-galaxy-s21-fe-128-gb", "samsung-galaxy-s21-fe", "Samsung", "Galaxy S21 FE 128 GB", "128 GB", "phone", 11000, 14500, 0.8, 7, 0, 0, ["s21 fe", "galaxy s21 fe", "galaxy s21 fe 128 gb", "samsung"]],
["samsung-galaxy-s21-fe-256-gb", "samsung-galaxy-s21-fe", "Samsung", "Galaxy S21 FE 256 GB", "256 GB", "phone", 12000, 15800, 0.8, 7, 0, 0, ["s21 fe", "galaxy s21 fe", "galaxy s21 fe 256 gb", "samsung"]],
["samsung-galaxy-s22-128-gb", "samsung-galaxy-s22", "Samsung", "Galaxy S22 128 GB", "128 GB", "phone", 17000, 22000, 1.0, 6, 0, 0, ["s22", "galaxy s22", "galaxy s22 128 gb", "samsung"]],
["samsung-galaxy-s22-256-gb", "samsung-galaxy-s22", "Samsung", "Galaxy S22 256 GB", "256 GB", "phone", 18500, 24000, 1.0, 6, 0, 0, ["s22", "galaxy s22", "galaxy s22 256 gb", "samsung"]],
["samsung-galaxy-s22-ultra-128-gb", "samsung-galaxy-s22-ultra", "Samsung", "Galaxy S22 Ultra 128 GB", "128 GB", "phone", 24000, 31000, 1.2, 6, 0, 0, ["s22 ultra", "galaxy s22 ultra", "galaxy s22 ultra 128 gb", "samsung"]],
["samsung-galaxy-s22-ultra-256-gb", "samsung-galaxy-s22-ultra", "Samsung", "Galaxy S22 Ultra 256 GB", "256 GB", "phone", 26200, 33800, 1.2, 6, 0, 0, ["s22 ultra", "galaxy s22 ultra", "galaxy s22 ultra 256 gb", "samsung"]],
["samsung-galaxy-s22-ultra-512-gb", "samsung-galaxy-s22-ultra", "Samsung", "Galaxy S22 Ultra 512 GB", "512 GB", "phone", 28800, 37200, 1.2, 6, 0, 0, ["s22 ultra", "galaxy s22 ultra", "galaxy s22 ultra 512 gb", "samsung"]],
["samsung-galaxy-s23-128-gb", "samsung-galaxy-s23", "Samsung", "Galaxy S23 128 GB", "128 GB", "phone", 23000, 29000, 1.1, 6, 34999, 0, ["s23", "galaxy s23", "galaxy s23 128 gb", "samsung"]],
["samsung-galaxy-s23-256-gb", "samsung-galaxy-s23", "Samsung", "Galaxy S23 256 GB", "256 GB", "phone", 25100, 31600, 1.1, 6, 37999, 0, ["s23", "galaxy s23", "galaxy s23 256 gb", "samsung"]],
["samsung-galaxy-s23-fe-128-gb", "samsung-galaxy-s23-fe", "Samsung", "Galaxy S23 FE 128 GB", "128 GB", "phone", 18000, 23000, 1.0, 6, 29999, 0, ["s23 fe", "galaxy s23 fe", "galaxy s23 fe 128 gb", "samsung"]],
["samsung-galaxy-s23-fe-256-gb", "samsung-galaxy-s23-fe", "Samsung", "Galaxy S23 FE 256 GB", "256 GB", "phone", 19600, 25100, 1.0, 6, 32499, 0, ["s23 fe", "galaxy s23 fe", "galaxy s23 fe 256 gb", "samsung"]],
["samsung-galaxy-s23-ultra-128-gb", "samsung-galaxy-s23-ultra", "Samsung", "Galaxy S23 Ultra 128 GB", "128 GB", "phone", 32000, 40000, 1.3, 5, 49999, 0, ["s23 ultra", "galaxy s23 ultra", "galaxy s23 ultra 128 gb", "samsung"]],
["samsung-galaxy-s23-ultra-256-gb", "samsung-galaxy-s23-ultra", "Samsung", "Galaxy S23 Ultra 256 GB", "256 GB", "phone", 34900, 43600, 1.3, 5, 54499, 0, ["s23 ultra", "galaxy s23 ultra", "galaxy s23 ultra 256 gb", "samsung"]],
["samsung-galaxy-s23-ultra-512-gb", "samsung-galaxy-s23-ultra", "Samsung", "Galaxy S23 Ultra 512 GB", "512 GB", "phone", 38400, 48000, 1.3, 5, 59999, 0, ["s23 ultra", "galaxy s23 ultra", "galaxy s23 ultra 512 gb", "samsung"]],
["samsung-galaxy-s24-128-gb", "samsung-galaxy-s24", "Samsung", "Galaxy S24 128 GB", "128 GB", "phone", 23200, 29700, 1.2, 5, 32999, 0, ["s24", "galaxy s24", "galaxy s24 128 gb", "samsung"]],
["samsung-galaxy-s24-256-gb", "samsung-galaxy-s24", "Samsung", "Galaxy S24 256 GB", "256 GB", "phone", 25300, 32400, 1.2, 5, 35999, 0, ["s24", "galaxy s24", "galaxy s24 256 gb", "samsung"]],
["samsung-galaxy-s24-512-gb", "samsung-galaxy-s24", "Samsung", "Galaxy S24 512 GB", "512 GB", "phone", 29500, 37800, 1.2, 5, 41999, 0, ["s24", "galaxy s24", "galaxy s24 512 gb", "samsung"]],
["samsung-galaxy-s24-ultra-256-gb", "samsung-galaxy-s24-ultra", "Samsung", "Galaxy S24 Ultra 256 GB", "256 GB", "phone", 45800, 56700, 1.5, 5, 64999, 0, ["s24 ultra", "galaxy s24 ultra", "galaxy s24 ultra 256 gb", "samsung"]],
["samsung-galaxy-s24-ultra-512-gb", "samsung-galaxy-s24-ultra", "Samsung", "Galaxy S24 Ultra 512 GB", "512 GB", "phone", 50400, 62400, 1.5, 5, 75999, 0, ["s24 ultra", "galaxy s24 ultra", "galaxy s24 ultra 512 gb", "samsung"]],
["samsung-galaxy-s24-ultra-1-tb", "samsung-galaxy-s24-ultra", "Samsung", "Galaxy S24 Ultra 1 TB", "1 TB", "phone", 55400, 68600, 1.5, 5, 84999, 0, ["s24 ultra", "galaxy s24 ultra", "galaxy s24 ultra 1 tb", "samsung"]],
["samsung-galaxy-s25-128-gb", "samsung-galaxy-s25", "Samsung", "Galaxy S25 128 GB", "128 GB", "phone", 32300, 41400, 1.4, 5, 45999, 1, ["s25", "galaxy s25", "galaxy s25 128 gb", "samsung"]],
["samsung-galaxy-s25-256-gb", "samsung-galaxy-s25", "Samsung", "Galaxy S25 256 GB", "256 GB", "phone", 33700, 43200, 1.4, 5, 47999, 1, ["s25", "galaxy s25", "galaxy s25 256 gb", "samsung"]],
["samsung-galaxy-s25-512-gb", "samsung-galaxy-s25", "Samsung", "Galaxy S25 512 GB", "512 GB", "phone", 39300, 50400, 1.4, 5, 55999, 1, ["s25", "galaxy s25", "galaxy s25 512 gb", "samsung"]],
["samsung-galaxy-s25-ultra-256-gb", "samsung-galaxy-s25-ultra", "Samsung", "Galaxy S25 Ultra 256 GB", "256 GB", "phone", 51200, 65700, 1.7, 5, 72999, 1, ["s25 ultra", "galaxy s25 ultra", "galaxy s25 ultra 256 gb", "samsung"]],
["samsung-galaxy-s25-ultra-512-gb", "samsung-galaxy-s25-ultra", "Samsung", "Galaxy S25 Ultra 512 GB", "512 GB", "phone", 56200, 72000, 1.7, 5, 79999, 1, ["s25 ultra", "galaxy s25 ultra", "galaxy s25 ultra 512 gb", "samsung"]],
["samsung-galaxy-s25-ultra-1-tb", "samsung-galaxy-s25-ultra", "Samsung", "Galaxy S25 Ultra 1 TB", "1 TB", "phone", 59700, 76500, 1.7, 5, 84999, 1, ["s25 ultra", "galaxy s25 ultra", "galaxy s25 ultra 1 tb", "samsung"]],
["samsung-galaxy-z-flip4-128-gb", "samsung-galaxy-z-flip4", "Samsung", "Galaxy Z Flip4 128 GB", "128 GB", "phone", 20000, 26000, 1.3, 8, 0, 0, ["flip4", "flip 4", "galaxy z flip4", "galaxy z flip4 128 gb", "samsung"]],
["samsung-galaxy-z-flip4-256-gb", "samsung-galaxy-z-flip4", "Samsung", "Galaxy Z Flip4 256 GB", "256 GB", "phone", 21800, 28300, 1.3, 8, 0, 0, ["flip4", "flip 4", "galaxy z flip4", "galaxy z flip4 256 gb", "samsung"]],
["samsung-galaxy-z-flip5-128-gb", "samsung-galaxy-z-flip5", "Samsung", "Galaxy Z Flip5 128 GB", "128 GB", "phone", 25000, 32000, 1.4, 7, 44999, 0, ["flip5", "flip 5", "galaxy z flip5", "galaxy z flip5 128 gb", "samsung"]],
["samsung-galaxy-z-flip5-256-gb", "samsung-galaxy-z-flip5", "Samsung", "Galaxy Z Flip5 256 GB", "256 GB", "phone", 27300, 34900, 1.4, 7, 48999, 0, ["flip5", "flip 5", "galaxy z flip5", "galaxy z flip5 256 gb", "samsung"]],
["samsung-galaxy-z-flip6-128-gb", "samsung-galaxy-z-flip6", "Samsung", "Galaxy Z Flip6 128 GB", "128 GB", "phone", 36000, 46000, 1.5, 7, 54999, 1, ["flip6", "flip 6", "galaxy z flip6", "galaxy z flip6 128 gb", "samsung"]],
["samsung-galaxy-z-flip6-256-gb", "samsung-galaxy-z-flip6", "Samsung", "Galaxy Z Flip6 256 GB", "256 GB", "phone", 39200, 50100, 1.5, 7, 59999, 1, ["flip6", "flip 6", "galaxy z flip6", "galaxy z flip6 256 gb", "samsung"]],
["samsung-galaxy-z-fold4-256-gb", "samsung-galaxy-z-fold4", "Samsung", "Galaxy Z Fold4 256 GB", "256 GB", "phone", 39200, 50100, 1.7, 9, 0, 0, ["fold4", "galaxy z fold4", "galaxy z fold4 256 gb", "samsung"]],
["samsung-galaxy-z-fold4-512-gb", "samsung-galaxy-z-fold4", "Samsung", "Galaxy Z Fold4 512 GB", "512 GB", "phone", 43200, 55200, 1.7, 9, 0, 0, ["fold4", "galaxy z fold4", "galaxy z fold4 512 gb", "samsung"]],
["samsung-galaxy-z-fold5-256-gb", "samsung-galaxy-z-fold5", "Samsung", "Galaxy Z Fold5 256 GB", "256 GB", "phone", 49000, 63200, 1.8, 8, 86999, 0, ["fold5", "galaxy z fold5", "galaxy z fold5 256 gb", "samsung"]],
["samsung-galaxy-z-fold5-512-gb", "samsung-galaxy-z-fold5", "Samsung", "Galaxy Z Fold5 512 GB", "512 GB", "phone", 54000, 69600, 1.8, 8, 95999, 0, ["fold5", "galaxy z fold5", "galaxy z fold5 512 gb", "samsung"]],
["samsung-galaxy-a05s-64-gb", "samsung-galaxy-a05s", "Samsung", "Galaxy A05s 64 GB", "64 GB", "phone", 4500, 6500, 0.5, 9, 8499, 0, ["a05", "galaxy a05s", "galaxy a05s 64 gb", "samsung"]],
["samsung-galaxy-a05s-128-gb", "samsung-galaxy-a05s", "Samsung", "Galaxy A05s 128 GB", "128 GB", "phone", 4500, 6500, 0.5, 9, 8499, 0, ["a05", "galaxy a05s", "galaxy a05s 128 gb", "samsung"]],
["samsung-galaxy-a10-32-gb", "samsung-galaxy-a10", "Samsung", "Galaxy A10 32 GB", "32 GB", "phone", 1800, 2800, 0.35, 11, 0, 0, ["a10", "galaxy a10", "galaxy a10 32 gb", "samsung"]],
["samsung-galaxy-a12-64-gb", "samsung-galaxy-a12", "Samsung", "Galaxy A12 64 GB", "64 GB", "phone", 2800, 4000, 0.4, 10, 0, 0, ["a12", "galaxy a12", "galaxy a12 64 gb", "samsung"]],
["samsung-galaxy-a12-128-gb", "samsung-galaxy-a12", "Samsung", "Galaxy A12 128 GB", "128 GB", "phone", 2800, 4000, 0.4, 10, 0, 0, ["a12", "galaxy a12", "galaxy a12 128 gb", "samsung"]],
["samsung-galaxy-a13-64-gb", "samsung-galaxy-a13", "Samsung", "Galaxy A13 64 GB", "64 GB", "phone", 3500, 5000, 0.45, 10, 0, 0, ["a13", "galaxy a13", "galaxy a13 64 gb", "samsung"]],
["samsung-galaxy-a13-128-gb", "samsung-galaxy-a13", "Samsung", "Galaxy A13 128 GB", "128 GB", "phone", 3500, 5000, 0.45, 10, 0, 0, ["a13", "galaxy a13", "galaxy a13 128 gb", "samsung"]],
["samsung-galaxy-a21s-64-gb", "samsung-galaxy-a21s", "Samsung", "Galaxy A21s 64 GB", "64 GB", "phone", 2800, 4200, 0.4, 10, 0, 0, ["a21s", "galaxy a21s", "galaxy a21s 64 gb", "samsung"]],
["samsung-galaxy-a21s-128-gb", "samsung-galaxy-a21s", "Samsung", "Galaxy A21s 128 GB", "128 GB", "phone", 2800, 4200, 0.4, 10, 0, 0, ["a21s", "galaxy a21s", "galaxy a21s 128 gb", "samsung"]],
["samsung-galaxy-a24-128-gb", "samsung-galaxy-a24", "Samsung", "Galaxy A24 128 GB", "128 GB", "phone", 7000, 9500, 0.6, 9, 12999, 0, ["a24", "galaxy a24", "galaxy a24 128 gb", "samsung"]],
["samsung-galaxy-a24-256-gb", "samsung-galaxy-a24", "Samsung", "Galaxy A24 256 GB", "256 GB", "phone", 7600, 10400, 0.6, 9, 13999, 0, ["a24", "galaxy a24", "galaxy a24 256 gb", "samsung"]],
["samsung-galaxy-a25-128-gb", "samsung-galaxy-a25", "Samsung", "Galaxy A25 128 GB", "128 GB", "phone", 9000, 12000, 0.6, 8, 14999, 0, ["a25", "galaxy a25", "galaxy a25 128 gb", "samsung"]],
["samsung-galaxy-a25-256-gb", "samsung-galaxy-a25", "Samsung", "Galaxy A25 256 GB", "256 GB", "phone", 9800, 13100, 0.6, 8, 16499, 0, ["a25", "galaxy a25", "galaxy a25 256 gb", "samsung"]],
["samsung-galaxy-a31-128-gb", "samsung-galaxy-a31", "Samsung", "Galaxy A31 128 GB", "128 GB", "phone", 3800, 5500, 0.45, 10, 0, 0, ["a31", "galaxy a31", "galaxy a31 128 gb", "samsung"]],
["samsung-galaxy-a32-128-gb", "samsung-galaxy-a32", "Samsung", "Galaxy A32 128 GB", "128 GB", "phone", 4500, 6500, 0.5, 10, 0, 0, ["a32", "galaxy a32", "galaxy a32 128 gb", "samsung"]],
["samsung-galaxy-a34-128-gb", "samsung-galaxy-a34", "Samsung", "Galaxy A34 128 GB", "128 GB", "phone", 8500, 11500, 0.6, 9, 16999, 0, ["a34", "galaxy a34", "galaxy a34 128 gb", "samsung"]],
["samsung-galaxy-a34-256-gb", "samsung-galaxy-a34", "Samsung", "Galaxy A34 256 GB", "256 GB", "phone", 9300, 12500, 0.6, 9, 18499, 0, ["a34", "galaxy a34", "galaxy a34 256 gb", "samsung"]],
["samsung-galaxy-a50-64-gb", "samsung-galaxy-a50", "Samsung", "Galaxy A50 64 GB", "64 GB", "phone", 3800, 5500, 0.45, 10, 0, 0, ["a50", "galaxy a50", "galaxy a50 64 gb", "samsung"]],
["samsung-galaxy-a50-128-gb", "samsung-galaxy-a50", "Samsung", "Galaxy A50 128 GB", "128 GB", "phone", 3800, 5500, 0.45, 10, 0, 0, ["a50", "galaxy a50", "galaxy a50 128 gb", "samsung"]],
["samsung-galaxy-a51-128-gb", "samsung-galaxy-a51", "Samsung", "Galaxy A51 128 GB", "128 GB", "phone", 4500, 6500, 0.5, 9, 0, 0, ["a51", "galaxy a51", "galaxy a51 128 gb", "samsung"]],
["samsung-galaxy-a51-256-gb", "samsung-galaxy-a51", "Samsung", "Galaxy A51 256 GB", "256 GB", "phone", 4900, 7100, 0.5, 9, 0, 0, ["a51", "galaxy a51", "galaxy a51 256 gb", "samsung"]],
["samsung-galaxy-a52-128-gb", "samsung-galaxy-a52", "Samsung", "Galaxy A52 128 GB", "128 GB", "phone", 6000, 8500, 0.55, 9, 0, 0, ["a52", "galaxy a52", "galaxy a52 128 gb", "samsung"]],
["samsung-galaxy-a52-256-gb", "samsung-galaxy-a52", "Samsung", "Galaxy A52 256 GB", "256 GB", "phone", 6500, 9300, 0.55, 9, 0, 0, ["a52", "galaxy a52", "galaxy a52 256 gb", "samsung"]],
["samsung-galaxy-a54-128-gb", "samsung-galaxy-a54", "Samsung", "Galaxy A54 128 GB", "128 GB", "phone", 10000, 13500, 0.7, 8, 19999, 0, ["a54", "galaxy a54", "galaxy a54 128 gb", "samsung"]],
["samsung-galaxy-a54-256-gb", "samsung-galaxy-a54", "Samsung", "Galaxy A54 256 GB", "256 GB", "phone", 10900, 14700, 0.7, 8, 21999, 0, ["a54", "galaxy a54", "galaxy a54 256 gb", "samsung"]],
["samsung-galaxy-a55-128-gb", "samsung-galaxy-a55", "Samsung", "Galaxy A55 128 GB", "128 GB", "phone", 13000, 17000, 0.8, 8, 19999, 1, ["a55", "galaxy a55", "galaxy a55 128 gb", "samsung"]],
["samsung-galaxy-a55-256-gb", "samsung-galaxy-a55", "Samsung", "Galaxy A55 256 GB", "256 GB", "phone", 14200, 18500, 0.8, 8, 21999, 1, ["a55", "galaxy a55", "galaxy a55 256 gb", "samsung"]],
["samsung-galaxy-a70-128-gb", "samsung-galaxy-a70", "Samsung", "Galaxy A70 128 GB", "128 GB", "phone", 5000, 7000, 0.5, 10, 0, 0, ["a70", "galaxy a70", "galaxy a70 128 gb", "samsung"]],
["samsung-galaxy-a71-128-gb", "samsung-galaxy-a71", "Samsung", "Galaxy A71 128 GB", "128 GB", "phone", 5500, 7800, 0.55, 10, 0, 0, ["a71", "galaxy a71", "galaxy a71 128 gb", "samsung"]],
["samsung-galaxy-a72-128-gb", "samsung-galaxy-a72", "Samsung", "Galaxy A72 128 GB", "128 GB", "phone", 7000, 9500, 0.6, 9, 0, 0, ["a72", "galaxy a72", "galaxy a72 128 gb", "samsung"]],
["samsung-galaxy-a72-256-gb", "samsung-galaxy-a72", "Samsung", "Galaxy A72 256 GB", "256 GB", "phone", 7600, 10400, 0.6, 9, 0, 0, ["a72", "galaxy a72", "galaxy a72 256 gb", "samsung"]],
["samsung-galaxy-a73-128-gb", "samsung-galaxy-a73", "Samsung", "Galaxy A73 128 GB", "128 GB", "phone", 9000, 12000, 0.65, 9, 0, 0, ["a73", "galaxy a73", "galaxy a73 128 gb", "samsung"]],
["samsung-galaxy-a73-256-gb", "samsung-galaxy-a73", "Samsung", "Galaxy A73 256 GB", "256 GB", "phone", 9800, 13100, 0.65, 9, 0, 0, ["a73", "galaxy a73", "galaxy a73 256 gb", "samsung"]],
["samsung-galaxy-m14-128-gb", "samsung-galaxy-m14", "Samsung", "Galaxy M14 128 GB", "128 GB", "phone", 5500, 7500, 0.5, 9, 10999, 0, ["m14", "galaxy m14", "galaxy m14 128 gb", "samsung"]],
["samsung-galaxy-m14-256-gb", "samsung-galaxy-m14", "Samsung", "Galaxy M14 256 GB", "256 GB", "phone", 6000, 8200, 0.5, 9, 11999, 0, ["m14", "galaxy m14", "galaxy m14 256 gb", "samsung"]],
["samsung-galaxy-m34-128-gb", "samsung-galaxy-m34", "Samsung", "Galaxy M34 128 GB", "128 GB", "phone", 8000, 10500, 0.6, 9, 13999, 0, ["m34", "galaxy m34", "galaxy m34 128 gb", "samsung"]],
["samsung-galaxy-m34-256-gb", "samsung-galaxy-m34", "Samsung", "Galaxy M34 256 GB", "256 GB", "phone", 8700, 11400, 0.6, 9, 15499, 0, ["m34", "galaxy m34", "galaxy m34 256 gb", "samsung"]],
["xiaomi-redmi-note-8-64-gb", "xiaomi-redmi-note-8", "Xiaomi", "Redmi Note 8 64 GB", "64 GB", "phone", 2800, 4000, 0.4, 10, 0, 0, ["note 8", "redmi note 8", "redmi note 8 64 gb", "xiaomi"]],
["xiaomi-redmi-note-8-128-gb", "xiaomi-redmi-note-8", "Xiaomi", "Redmi Note 8 128 GB", "128 GB", "phone", 2800, 4000, 0.4, 10, 0, 0, ["note 8", "redmi note 8", "redmi note 8 128 gb", "xiaomi"]],
["xiaomi-redmi-note-9-64-gb", "xiaomi-redmi-note-9", "Xiaomi", "Redmi Note 9 64 GB", "64 GB", "phone", 3200, 4500, 0.4, 10, 0, 0, ["note 9", "redmi note 9", "redmi note 9 64 gb", "xiaomi"]],
["xiaomi-redmi-note-9-128-gb", "xiaomi-redmi-note-9", "Xiaomi", "Redmi Note 9 128 GB", "128 GB", "phone", 3200, 4500, 0.4, 10, 0, 0, ["note 9", "redmi note 9", "redmi note 9 128 gb", "xiaomi"]],
["xiaomi-redmi-note-10-64-gb", "xiaomi-redmi-note-10", "Xiaomi", "Redmi Note 10 64 GB", "64 GB", "phone", 3800, 5500, 0.45, 10, 0, 0, ["redmi note 10", "redmi note 10 64 gb", "xiaomi"]],
["xiaomi-redmi-note-10-128-gb", "xiaomi-redmi-note-10", "Xiaomi", "Redmi Note 10 128 GB", "128 GB", "phone", 3800, 5500, 0.45, 10, 0, 0, ["redmi note 10", "redmi note 10 128 gb", "xiaomi"]],
["xiaomi-redmi-note-11-128-gb", "xiaomi-redmi-note-11", "Xiaomi", "Redmi Note 11 128 GB", "128 GB", "phone", 4500, 6500, 0.5, 9, 0, 0, ["note 11", "redmi note 11", "redmi note 11 128 gb", "xiaomi"]],
["xiaomi-redmi-note-11-256-gb", "xiaomi-redmi-note-11", "Xiaomi", "Redmi Note 11 256 GB", "256 GB", "phone", 4900, 7100, 0.5, 9, 0, 0, ["note 11", "redmi note 11", "redmi note 11 256 gb", "xiaomi"]],
["xiaomi-redmi-note-12-128-gb", "xiaomi-redmi-note-12", "Xiaomi", "Redmi Note 12 128 GB", "128 GB", "phone", 6000, 8000, 0.5, 9, 9999, 0, ["note 12", "redmi note 12", "redmi note 12 128 gb", "xiaomi"]],
["xiaomi-redmi-note-12-256-gb", "xiaomi-redmi-note-12", "Xiaomi", "Redmi Note 12 256 GB", "256 GB", "phone", 6500, 8700, 0.5, 9, 10999, 0, ["note 12", "redmi note 12", "redmi note 12 256 gb", "xiaomi"]],
["xiaomi-redmi-note-13-128-gb", "xiaomi-redmi-note-13", "Xiaomi", "Redmi Note 13 128 GB", "128 GB", "phone", 7000, 9500, 0.5, 9, 12999, 0, ["note 13", "redmi", "redmi note 13", "redmi note 13 128 gb", "xiaomi"]],
["xiaomi-redmi-note-13-256-gb", "xiaomi-redmi-note-13", "Xiaomi", "Redmi Note 13 256 GB", "256 GB", "phone", 7600, 10400, 0.5, 9, 13999, 0, ["note 13", "redmi", "redmi note 13", "redmi note 13 256 gb", "xiaomi"]],
["xiaomi-redmi-note-13-pro-256-gb", "xiaomi-redmi-note-13-pro", "Xiaomi", "Redmi Note 13 Pro 256 GB", "256 GB", "phone", 9800, 13100, 0.6, 8, 18499, 0, ["note 13 pro", "redmi note 13 pro", "redmi note 13 pro 256 gb", "xiaomi"]],
["xiaomi-redmi-note-13-pro-512-gb", "xiaomi-redmi-note-13-pro", "Xiaomi", "Redmi Note 13 Pro 512 GB", "512 GB", "phone", 10800, 14400, 0.6, 8, 20499, 0, ["note 13 pro", "redmi note 13 pro", "redmi note 13 pro 512 gb", "xiaomi"]],
["xiaomi-redmi-note-14-128-gb", "xiaomi-redmi-note-14", "Xiaomi", "Redmi Note 14 128 GB", "128 GB", "phone", 8500, 11500, 0.6, 8, 14999, 1, ["note 14", "redmi note 14", "redmi note 14 128 gb", "xiaomi"]],
["xiaomi-redmi-note-14-256-gb", "xiaomi-redmi-note-14", "Xiaomi", "Redmi Note 14 256 GB", "256 GB", "phone", 9300, 12500, 0.6, 8, 16499, 1, ["note 14", "redmi note 14", "redmi note 14 256 gb", "xiaomi"]],
["xiaomi-redmi-9c-64-gb", "xiaomi-redmi-9c", "Xiaomi", "Redmi 9C 64 GB", "64 GB", "phone", 2200, 3200, 0.35, 11, 0, 0, ["redmi 9", "redmi 9c", "redmi 9c 64 gb", "xiaomi"]],
["xiaomi-redmi-10-64-gb", "xiaomi-redmi-10", "Xiaomi", "Redmi 10 64 GB", "64 GB", "phone", 3200, 4500, 0.4, 10, 0, 0, ["redmi 10", "redmi 10 64 gb", "xiaomi"]],
["xiaomi-redmi-10-128-gb", "xiaomi-redmi-10", "Xiaomi", "Redmi 10 128 GB", "128 GB", "phone", 3200, 4500, 0.4, 10, 0, 0, ["redmi 10", "redmi 10 128 gb", "xiaomi"]],
["xiaomi-redmi-12-128-gb", "xiaomi-redmi-12", "Xiaomi", "Redmi 12 128 GB", "128 GB", "phone", 5000, 7000, 0.5, 9, 8999, 0, ["redmi 12", "redmi 12 128 gb", "xiaomi"]],
["xiaomi-redmi-12-256-gb", "xiaomi-redmi-12", "Xiaomi", "Redmi 12 256 GB", "256 GB", "phone", 5400, 7600, 0.5, 9, 9999, 0, ["redmi 12", "redmi 12 256 gb", "xiaomi"]],
["xiaomi-redmi-13c-128-gb", "xiaomi-redmi-13c", "Xiaomi", "Redmi 13C 128 GB", "128 GB", "phone", 4500, 6500, 0.45, 9, 7999, 0, ["13c", "redmi 13c", "redmi 13c 128 gb", "xiaomi"]],
["xiaomi-redmi-13c-256-gb", "xiaomi-redmi-13c", "Xiaomi", "Redmi 13C 256 GB", "256 GB", "phone", 4900, 7100, 0.45, 9, 8499, 0, ["13c", "redmi 13c", "redmi 13c 256 gb", "xiaomi"]],
["xiaomi-mi-11-lite-128-gb", "xiaomi-mi-11-lite", "Xiaomi", "Mi 11 Lite 128 GB", "128 GB", "phone", 6500, 9000, 0.55, 9, 0, 0, ["11 lite", "mi 11 lite", "mi 11 lite 128 gb", "xiaomi"]],
["xiaomi-mi-11-lite-256-gb", "xiaomi-mi-11-lite", "Xiaomi", "Mi 11 Lite 256 GB", "256 GB", "phone", 7100, 9800, 0.55, 9, 0, 0, ["11 lite", "mi 11 lite", "mi 11 lite 256 gb", "xiaomi"]],
["xiaomi-xiaomi-11t-128-gb", "xiaomi-xiaomi-11t", "Xiaomi", "Xiaomi 11T 128 GB", "128 GB", "phone", 8500, 11500, 0.6, 9, 0, 0, ["11t", "xiaomi 11t", "xiaomi 11t 128 gb", "xiaomi"]],
["xiaomi-xiaomi-11t-256-gb", "xiaomi-xiaomi-11t", "Xiaomi", "Xiaomi 11T 256 GB", "256 GB", "phone", 9300, 12500, 0.6, 9, 0, 0, ["11t", "xiaomi 11t", "xiaomi 11t 256 gb", "xiaomi"]],
["xiaomi-xiaomi-12t-128-gb", "xiaomi-xiaomi-12t", "Xiaomi", "Xiaomi 12T 128 GB", "128 GB", "phone", 10000, 13000, 0.7, 8, 0, 0, ["12t", "xiaomi 12t", "xiaomi 12t 128 gb", "xiaomi"]],
["xiaomi-xiaomi-12t-256-gb", "xiaomi-xiaomi-12t", "Xiaomi", "Xiaomi 12T 256 GB", "256 GB", "phone", 10900, 14200, 0.7, 8, 0, 0, ["12t", "xiaomi 12t", "xiaomi 12t 256 gb", "xiaomi"]],
["xiaomi-xiaomi-13t-256-gb", "xiaomi-xiaomi-13t", "Xiaomi", "Xiaomi 13T 256 GB", "256 GB", "phone", 14200, 18500, 0.7, 8, 24999, 0, ["13t", "xiaomi 13t", "xiaomi 13t 256 gb", "xiaomi"]],
["xiaomi-xiaomi-13t-pro-512-gb", "xiaomi-xiaomi-13t-pro", "Xiaomi", "Xiaomi 13T Pro 512 GB", "512 GB", "phone", 19200, 24000, 0.8, 8, 33499, 0, ["13t pro", "xiaomi 13t pro", "xiaomi 13t pro 512 gb", "xiaomi"]],
["xiaomi-xiaomi-13t-pro-1-tb", "xiaomi-xiaomi-13t-pro", "Xiaomi", "Xiaomi 13T Pro 1 TB", "1 TB", "phone", 21100, 26400, 0.8, 8, 36999, 0, ["13t pro", "xiaomi 13t pro", "xiaomi 13t pro 1 tb", "xiaomi"]],
["xiaomi-xiaomi-14t-256-gb", "xiaomi-xiaomi-14t", "Xiaomi", "Xiaomi 14T 256 GB", "256 GB", "phone", 19600, 25100, 0.9, 7, 35999, 0, ["14t", "xiaomi 14t", "xiaomi 14t 256 gb", "xiaomi"]],
["xiaomi-xiaomi-14t-512-gb", "xiaomi-xiaomi-14t", "Xiaomi", "Xiaomi 14T 512 GB", "512 GB", "phone", 21600, 27600, 0.9, 7, 39499, 0, ["14t", "xiaomi 14t", "xiaomi 14t 512 gb", "xiaomi"]],
["xiaomi-xiaomi-15t-256-gb", "xiaomi-xiaomi-15t", "Xiaomi", "Xiaomi 15T 256 GB", "256 GB", "phone", 26200, 33800, 1.0, 7, 41499, 1, ["15t", "xiaomi 15t", "xiaomi 15t 256 gb", "xiaomi"]],
["xiaomi-xiaomi-15t-512-gb", "xiaomi-xiaomi-15t", "Xiaomi", "Xiaomi 15T 512 GB", "512 GB", "phone", 28800, 37200, 1.0, 7, 45499, 1, ["15t", "xiaomi 15t", "xiaomi 15t 512 gb", "xiaomi"]],
["xiaomi-poco-x3-pro-128-gb", "xiaomi-poco-x3-pro", "Xiaomi", "Poco X3 Pro 128 GB", "128 GB", "phone", 5000, 7000, 0.5, 9, 0, 0, ["x3 pro", "poco x3 pro", "poco x3 pro 128 gb", "xiaomi"]],
["xiaomi-poco-x3-pro-256-gb", "xiaomi-poco-x3-pro", "Xiaomi", "Poco X3 Pro 256 GB", "256 GB", "phone", 5400, 7600, 0.5, 9, 0, 0, ["x3 pro", "poco x3 pro", "poco x3 pro 256 gb", "xiaomi"]],
["xiaomi-poco-x5-pro-128-gb", "xiaomi-poco-x5-pro", "Xiaomi", "Poco X5 Pro 128 GB", "128 GB", "phone", 8000, 10500, 0.6, 8, 13999, 0, ["x5 pro", "poco x5 pro", "poco x5 pro 128 gb", "xiaomi"]],
["xiaomi-poco-x5-pro-256-gb", "xiaomi-poco-x5-pro", "Xiaomi", "Poco X5 Pro 256 GB", "256 GB", "phone", 8700, 11400, 0.6, 8, 15499, 0, ["x5 pro", "poco x5 pro", "poco x5 pro 256 gb", "xiaomi"]],
["xiaomi-poco-x6-256-gb", "xiaomi-poco-x6", "Xiaomi", "Poco X6 256 GB", "256 GB", "phone", 10900, 14200, 0.6, 8, 19499, 0, ["poco x6", "poco x6 256 gb", "xiaomi"]],
["xiaomi-poco-x6-512-gb", "xiaomi-poco-x6", "Xiaomi", "Poco X6 512 GB", "512 GB", "phone", 12000, 15600, 0.6, 8, 21499, 0, ["poco x6", "poco x6 512 gb", "xiaomi"]],
["xiaomi-poco-x6-pro-256-gb", "xiaomi-poco-x6-pro", "Xiaomi", "Poco X6 Pro 256 GB", "256 GB", "phone", 13100, 16900, 0.7, 8, 22999, 0, ["x6 pro", "poco x6 pro", "poco x6 pro 256 gb", "xiaomi"]],
["xiaomi-poco-x6-pro-512-gb", "xiaomi-poco-x6-pro", "Xiaomi", "Poco X6 Pro 512 GB", "512 GB", "phone", 14400, 18600, 0.7, 8, 24999, 0, ["x6 pro", "poco x6 pro", "poco x6 pro 512 gb", "xiaomi"]],
["xiaomi-poco-f5-256-gb", "xiaomi-poco-f5", "Xiaomi", "Poco F5 256 GB", "256 GB", "phone", 13100, 16900, 0.7, 8, 23999, 0, ["poco f5", "poco f5 256 gb", "xiaomi"]],
["xiaomi-poco-m5-128-gb", "xiaomi-poco-m5", "Xiaomi", "Poco M5 128 GB", "128 GB", "phone", 5000, 7000, 0.45, 9, 8499, 0, ["poco m5", "poco m5 128 gb", "xiaomi"]],
["xiaomi-poco-m5-256-gb", "xiaomi-poco-m5", "Xiaomi", "Poco M5 256 GB", "256 GB", "phone", 5400, 7600, 0.45, 9, 9499, 0, ["poco m5", "poco m5 256 gb", "xiaomi"]],
["huawei-p20-128-gb", "huawei-p20", "Huawei", "P20 128 GB", "128 GB", "phone", 3500, 5000, 0.45, 10, 0, 0, ["p20", "p20 128 gb", "huawei"]],
["huawei-p30-128-gb", "huawei-p30", "Huawei", "P30 128 GB", "128 GB", "phone", 6000, 8500, 0.55, 9, 0, 0, ["p30", "p30 128 gb", "huawei"]],
["huawei-p30-pro-256-gb", "huawei-p30-pro", "Huawei", "P30 Pro 256 GB", "256 GB", "phone", 8700, 12000, 0.6, 9, 0, 0, ["p30 pro", "p30 pro 256 gb", "huawei"]],
["huawei-p40-lite-128-gb", "huawei-p40-lite", "Huawei", "P40 Lite 128 GB", "128 GB", "phone", 4000, 6000, 0.5, 10, 0, 0, ["p40 lite", "p40 lite 128 gb", "huawei"]],
["huawei-mate-20-pro-128-gb", "huawei-mate-20-pro", "Huawei", "Mate 20 Pro 128 GB", "128 GB", "phone", 6000, 8500, 0.55, 10, 0, 0, ["mate 20", "mate 20 pro", "mate 20 pro 128 gb", "huawei"]],
["huawei-nova-11-256-gb", "huawei-nova-11", "Huawei", "Nova 11 256 GB", "256 GB", "phone", 7600, 10400, 0.6, 9, 16499, 0, ["nova 11", "nova 11 256 gb", "huawei"]],
["oppo-a38-128-gb", "oppo-a38", "Oppo", "A38 128 GB", "128 GB", "phone", 5000, 7000, 0.5, 10, 9999, 0, ["a38", "a38 128 gb", "oppo"]],
["oppo-a38-256-gb", "oppo-a38", "Oppo", "A38 256 GB", "256 GB", "phone", 5400, 7600, 0.5, 10, 10999, 0, ["a38", "a38 256 gb", "oppo"]],
["oppo-a57-64-gb", "oppo-a57", "Oppo", "A57 64 GB", "64 GB", "phone", 4500, 6500, 0.45, 10, 0, 0, ["oppo a57", "a57", "a57 64 gb", "oppo"]],
["oppo-a57-128-gb", "oppo-a57", "Oppo", "A57 128 GB", "128 GB", "phone", 4500, 6500, 0.45, 10, 0, 0, ["oppo a57", "a57", "a57 128 gb", "oppo"]],
["oppo-a78-128-gb", "oppo-a78", "Oppo", "A78 128 GB", "128 GB", "phone", 6000, 8000, 0.5, 9, 12999, 0, ["a78", "a78 128 gb", "oppo"]],
["oppo-a78-256-gb", "oppo-a78", "Oppo", "A78 256 GB", "256 GB", "phone", 6500, 8700, 0.5, 9, 13999, 0, ["a78", "a78 256 gb", "oppo"]],
["oppo-reno-8-256-gb", "oppo-reno-8", "Oppo", "Reno 8 256 GB", "256 GB", "phone", 8700, 12000, 0.6, 9, 0, 0, ["reno 8", "reno 8 256 gb", "oppo"]],
["oppo-reno-10-256-gb", "oppo-reno-10", "Oppo", "Reno 10 256 GB", "256 GB", "phone", 12000, 15300, 0.7, 8, 21999, 0, ["reno 10", "reno 10 256 gb", "oppo"]],
["oppo-reno-11-f-256-gb", "oppo-reno-11-f", "Oppo", "Reno 11 F 256 GB", "256 GB", "phone", 13100, 16900, 0.7, 8, 23999, 0, ["reno 11", "reno 11 f", "reno 11 f 256 gb", "oppo"]],
["realme-c55-128-gb", "realme-c55", "Realme", "C55 128 GB", "128 GB", "phone", 5000, 7000, 0.5, 10, 9999, 0, ["c55", "realme", "c55 128 gb"]],
["realme-c55-256-gb", "realme-c55", "Realme", "C55 256 GB", "256 GB", "phone", 5400, 7600, 0.5, 10, 10999, 0, ["c55", "realme", "c55 256 gb"]],
["realme-11-pro-256-gb", "realme-11-pro", "Realme", "11 Pro 256 GB", "256 GB", "phone", 9800, 13100, 0.6, 9, 17499, 0, ["realme 11", "11 pro", "11 pro 256 gb", "realme"]],
["realme-9-pro-128-gb", "realme-9-pro", "Realme", "9 Pro 128 GB", "128 GB", "phone", 6000, 8000, 0.5, 9, 0, 0, ["realme 9", "9 pro", "9 pro 128 gb", "realme"]],
["realme-9-pro-256-gb", "realme-9-pro", "Realme", "9 Pro 256 GB", "256 GB", "phone", 6500, 8700, 0.5, 9, 0, 0, ["realme 9", "9 pro", "9 pro 256 gb", "realme"]],
["honor-90-256-gb", "honor-90", "Honor", "90 256 GB", "256 GB", "phone", 10900, 14200, 0.6, 9, 19499, 0, ["honor 90", "honor", "90", "90 256 gb"]],
["honor-90-512-gb", "honor-90", "Honor", "90 512 GB", "512 GB", "phone", 12000, 15600, 0.6, 9, 21499, 0, ["honor 90", "honor", "90", "90 512 gb"]],
["honor-x8-128-gb", "honor-x8", "Honor", "X8 128 GB", "128 GB", "phone", 5500, 7500, 0.5, 10, 10999, 0, ["honor x8", "x8", "x8 128 gb", "honor"]],
["honor-x8-256-gb", "honor-x8", "Honor", "X8 256 GB", "256 GB", "phone", 6000, 8200, 0.5, 10, 11999, 0, ["honor x8", "x8", "x8 256 gb", "honor"]],
["vivo-y36-128-gb", "vivo-y36", "vivo", "Y36 128 GB", "128 GB", "phone", 6000, 8000, 0.5, 10, 11999, 0, ["vivo", "y36", "y36 128 gb"]],
["vivo-y36-256-gb", "vivo-y36", "vivo", "Y36 256 GB", "256 GB", "phone", 6500, 8700, 0.5, 10, 12999, 0, ["vivo", "y36", "y36 256 gb"]],
["tecno-spark-20-128-gb", "tecno-spark-20", "Tecno", "Spark 20 128 GB", "128 GB", "phone", 4000, 6000, 0.4, 10, 7999, 0, ["tecno", "spark", "spark 20", "spark 20 128 gb"]],
["tecno-spark-20-256-gb", "tecno-spark-20", "Tecno", "Spark 20 256 GB", "256 GB", "phone", 4400, 6500, 0.4, 10, 8499, 0, ["tecno", "spark", "spark 20", "spark 20 256 gb"]],
["tecno-camon-20-256-gb", "tecno-camon-20", "Tecno", "Camon 20 256 GB", "256 GB", "phone", 6000, 8200, 0.45, 10, 10999, 0, ["camon", "camon 20", "camon 20 256 gb", "tecno"]],
["infinix-hot-40-128-gb", "infinix-hot-40", "Infinix", "Hot 40 128 GB", "128 GB", "phone", 4000, 6000, 0.4, 10, 7499, 0, ["hot 40", "hot 40 128 gb", "infinix"]],
["infinix-hot-40-256-gb", "infinix-hot-40", "Infinix", "Hot 40 256 GB", "256 GB", "phone", 4400, 6500, 0.4, 10, 7999, 0, ["hot 40", "hot 40 256 gb", "infinix"]],
["infinix-note-30-128-gb", "infinix-note-30", "Infinix", "Note 30 128 GB", "128 GB", "phone", 5000, 7000, 0.4, 10, 8999, 0, ["infinix", "note 30", "note 30 128 gb"]],
["infinix-note-30-256-gb", "infinix-note-30", "Infinix", "Note 30 256 GB", "256 GB", "phone", 5400, 7600, 0.4, 10, 9999, 0, ["infinix", "note 30", "note 30 256 gb"]],
["reeder-s19-max-pro-128-gb", "reeder-s19-max-pro", "reeder", "S19 Max Pro 128 GB", "128 GB", "phone", 3000, 4500, 0.4, 11, 5999, 0, ["reeder", "s19 max pro", "s19 max pro 128 gb"]],
["reeder-s19-max-pro-256-gb", "reeder-s19-max-pro", "reeder", "S19 Max Pro 256 GB", "256 GB", "phone", 3300, 4900, 0.4, 11, 6499, 0, ["reeder", "s19 max pro", "s19 max pro 256 gb"]],
["general-mobile-gm-22-64-gb", "general-mobile-gm-22", "General Mobile", "GM 22 64 GB", "64 GB", "phone", 3000, 4500, 0.4, 11, 5499, 0, ["general mobile", "gm 22", "gm 22 64 gb"]],
["general-mobile-gm-22-128-gb", "general-mobile-gm-22", "General Mobile", "GM 22 128 GB", "128 GB", "phone", 3000, 4500, 0.4, 11, 5499, 0, ["general mobile", "gm 22", "gm 22 128 gb"]],
["general-mobile-gm-24-128-gb", "general-mobile-gm-24", "General Mobile", "GM 24 128 GB", "128 GB", "phone", 4500, 6500, 0.45, 10, 7999, 0, ["gm 24", "gm 24 128 gb", "general mobile"]],
["general-mobile-gm-24-256-gb", "general-mobile-gm-24", "General Mobile", "GM 24 256 GB", "256 GB", "phone", 4900, 7100, 0.45, 10, 8499, 0, ["gm 24", "gm 24 256 gb", "general mobile"]],
["casper-via-x30-128-gb", "casper-via-x30", "Casper", "VIA X30 128 GB", "128 GB", "phone", 4000, 6000, 0.4, 10, 7499, 0, ["via x30", "casper via", "via x30 128 gb", "casper"]],
["casper-via-x30-256-gb", "casper-via-x30", "Casper", "VIA X30 256 GB", "256 GB", "phone", 4400, 6500, 0.4, 10, 7999, 0, ["via x30", "casper via", "via x30 256 gb", "casper"]],
["casper-via-f30-128-gb", "casper-via-f30", "Casper", "VIA F30 128 GB", "128 GB", "phone", 5000, 7000, 0.45, 10, 8999, 0, ["via f30", "via f30 128 gb", "casper"]],
["casper-via-f30-256-gb", "casper-via-f30", "Casper", "VIA F30 256 GB", "256 GB", "phone", 5400, 7600, 0.45, 10, 9999, 0, ["via f30", "via f30 256 gb", "casper"]],
["omix-x5-128-gb", "omix-x5", "Omix", "X5 128 GB", "128 GB", "phone", 3500, 5000, 0.4, 11, 6499, 0, ["omix", "x5", "x5 128 gb"]],
["omix-x5-256-gb", "omix-x5", "Omix", "X5 256 GB", "256 GB", "phone", 3800, 5400, 0.4, 11, 6999, 0, ["omix", "x5", "x5 256 gb"]],
["google-pixel-7-128-gb", "google-pixel-7", "Google", "Pixel 7 128 GB", "128 GB", "phone", 14000, 18000, 0.9, 8, 0, 0, ["pixel 7", "pixel", "pixel 7 128 gb", "google"]],
["google-pixel-7-256-gb", "google-pixel-7", "Google", "Pixel 7 256 GB", "256 GB", "phone", 15300, 19600, 0.9, 8, 0, 0, ["pixel 7", "pixel", "pixel 7 256 gb", "google"]],
["google-pixel-8-128-gb", "google-pixel-8", "Google", "Pixel 8 128 GB", "128 GB", "phone", 20000, 26000, 1.0, 7, 27999, 0, ["pixel 8", "pixel 8 128 gb", "google"]],
["google-pixel-8-256-gb", "google-pixel-8", "Google", "Pixel 8 256 GB", "256 GB", "phone", 21800, 28300, 1.0, 7, 30499, 0, ["pixel 8", "pixel 8 256 gb", "google"]],
["google-pixel-9-128-gb", "google-pixel-9", "Google", "Pixel 9 128 GB", "128 GB", "phone", 26000, 33000, 1.1, 7, 39999, 1, ["pixel 9", "pixel 9 128 gb", "google"]],
["google-pixel-9-256-gb", "google-pixel-9", "Google", "Pixel 9 256 GB", "256 GB", "phone", 28300, 36000, 1.1, 7, 43499, 1, ["pixel 9", "pixel 9 256 gb", "google"]],
["samsung-crystal-4k-cu8000-43i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 43\"", "43\"", "tv", 8500, 12000, 0.7, 12, 15499, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 43", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 43\"", "samsung"]],
["samsung-crystal-4k-cu8000-50i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 50\"", "50\"", "tv", 11000, 15500, 0.8, 12, 19999, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 50", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 50\"", "samsung"]],
["samsung-crystal-4k-cu8000-55i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 55\"", "55\"", "tv", 13500, 19000, 1.0, 12, 24499, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 55", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 55\"", "samsung"]],
["samsung-crystal-4k-cu8000-58i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 58\"", "58\"", "tv", 15000, 21500, 1.05, 12, 27999, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 58", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 58\"", "samsung"]],
["samsung-crystal-4k-cu8000-65i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 65\"", "65\"", "tv", 19000, 27000, 1.3, 14, 34999, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 65", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 65\"", "samsung"]],
["samsung-crystal-4k-cu8000-75i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 75\"", "75\"", "tv", 29000, 40000, 1.6, 16, 51999, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 75", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 75\"", "samsung"]],
["samsung-crystal-4k-cu8000-85i", "samsung-crystal-4k-cu8000", "Samsung", "Crystal 4K CU8000 85\"", "85\"", "tv", 45000, 62000, 1.9, 16, 80499, 0, ["cu8000", "crystal", "samsung televizyon", "samsung 85", "samsung tv", "crystal 4k cu8000", "crystal 4k cu8000 85\"", "samsung"]],
["samsung-qled-q60d-43i", "samsung-qled-q60d", "Samsung", "QLED Q60D 43\"", "43\"", "tv", 11500, 16000, 0.7, 12, 20999, 0, ["q60", "qled", "qled q60d", "qled q60d 43\"", "samsung"]],
["samsung-qled-q60d-50i", "samsung-qled-q60d", "Samsung", "QLED Q60D 50\"", "50\"", "tv", 14000, 19000, 0.8, 12, 24499, 0, ["q60", "qled", "qled q60d", "qled q60d 50\"", "samsung"]],
["samsung-qled-q60d-55i", "samsung-qled-q60d", "Samsung", "QLED Q60D 55\"", "55\"", "tv", 17000, 23000, 1.0, 12, 29999, 0, ["q60", "qled", "qled q60d", "qled q60d 55\"", "samsung"]],
["samsung-qled-q60d-65i", "samsung-qled-q60d", "Samsung", "QLED Q60D 65\"", "65\"", "tv", 24000, 32000, 1.3, 14, 41499, 0, ["q60", "qled", "qled q60d", "qled q60d 65\"", "samsung"]],
["samsung-qled-q60d-75i", "samsung-qled-q60d", "Samsung", "QLED Q60D 75\"", "75\"", "tv", 36000, 48000, 1.6, 16, 62499, 0, ["q60", "qled", "qled q60d", "qled q60d 75\"", "samsung"]],
["samsung-qled-q60d-85i", "samsung-qled-q60d", "Samsung", "QLED Q60D 85\"", "85\"", "tv", 52000, 70000, 1.9, 16, 90999, 0, ["q60", "qled", "qled q60d", "qled q60d 85\"", "samsung"]],
["samsung-qled-q70d-55i", "samsung-qled-q70d", "Samsung", "QLED Q70D 55\"", "55\"", "tv", 20000, 27000, 1.0, 12, 34999, 0, ["q70", "qled q70d", "qled q70d 55\"", "samsung"]],
["samsung-qled-q70d-65i", "samsung-qled-q70d", "Samsung", "QLED Q70D 65\"", "65\"", "tv", 28000, 38000, 1.3, 14, 49499, 0, ["q70", "qled q70d", "qled q70d 65\"", "samsung"]],
["samsung-qled-q70d-75i", "samsung-qled-q70d", "Samsung", "QLED Q70D 75\"", "75\"", "tv", 42000, 56000, 1.6, 16, 72999, 0, ["q70", "qled q70d", "qled q70d 75\"", "samsung"]],
["samsung-neo-qled-qn85d-55i", "samsung-neo-qled-qn85d", "Samsung", "Neo QLED QN85D 55\"", "55\"", "tv", 28000, 37000, 1.0, 12, 47999, 0, ["qn85", "neo qled", "neo qled qn85d", "neo qled qn85d 55\"", "samsung"]],
["samsung-neo-qled-qn85d-65i", "samsung-neo-qled-qn85d", "Samsung", "Neo QLED QN85D 65\"", "65\"", "tv", 38000, 50000, 1.3, 14, 64999, 0, ["qn85", "neo qled", "neo qled qn85d", "neo qled qn85d 65\"", "samsung"]],
["samsung-neo-qled-qn85d-75i", "samsung-neo-qled-qn85d", "Samsung", "Neo QLED QN85D 75\"", "75\"", "tv", 56000, 74000, 1.6, 16, 95999, 0, ["qn85", "neo qled", "neo qled qn85d", "neo qled qn85d 75\"", "samsung"]],
["samsung-neo-qled-qn90d-50i", "samsung-neo-qled-qn90d", "Samsung", "Neo QLED QN90D 50\"", "50\"", "tv", 30000, 40000, 0.8, 12, 51999, 0, ["qn90", "neo qled qn90d", "neo qled qn90d 50\"", "samsung"]],
["samsung-neo-qled-qn90d-55i", "samsung-neo-qled-qn90d", "Samsung", "Neo QLED QN90D 55\"", "55\"", "tv", 34000, 45000, 1.0, 12, 58499, 0, ["qn90", "neo qled qn90d", "neo qled qn90d 55\"", "samsung"]],
["samsung-neo-qled-qn90d-65i", "samsung-neo-qled-qn90d", "Samsung", "Neo QLED QN90D 65\"", "65\"", "tv", 48000, 62000, 1.3, 14, 80499, 0, ["qn90", "neo qled qn90d", "neo qled qn90d 65\"", "samsung"]],
["samsung-neo-qled-qn90d-75i", "samsung-neo-qled-qn90d", "Samsung", "Neo QLED QN90D 75\"", "75\"", "tv", 70000, 92000, 1.6, 16, 119499, 0, ["qn90", "neo qled qn90d", "neo qled qn90d 75\"", "samsung"]],
["samsung-oled-s90d-55i", "samsung-oled-s90d", "Samsung", "OLED S90D 55\"", "55\"", "tv", 32000, 42000, 1.0, 12, 54499, 1, ["s90", "samsung oled", "oled s90d", "oled s90d 55\"", "samsung"]],
["samsung-oled-s90d-65i", "samsung-oled-s90d", "Samsung", "OLED S90D 65\"", "65\"", "tv", 45000, 58000, 1.3, 14, 75499, 1, ["s90", "samsung oled", "oled s90d", "oled s90d 65\"", "samsung"]],
["samsung-oled-s90d-77i", "samsung-oled-s90d", "Samsung", "OLED S90D 77\"", "77\"", "tv", 68000, 88000, 1.7, 16, 114499, 1, ["s90", "samsung oled", "oled s90d", "oled s90d 77\"", "samsung"]],
["samsung-oled-s95d-65i", "samsung-oled-s95d", "Samsung", "OLED S95D 65\"", "65\"", "tv", 60000, 78000, 1.3, 14, 101499, 1, ["s95", "oled s95d", "oled s95d 65\"", "samsung"]],
["samsung-oled-s95d-77i", "samsung-oled-s95d", "Samsung", "OLED S95D 77\"", "77\"", "tv", 84000, 108000, 1.7, 16, 140499, 1, ["s95", "oled s95d", "oled s95d 77\"", "samsung"]],
["samsung-the-frame-43i", "samsung-the-frame", "Samsung", "The Frame 43\"", "43\"", "tv", 18000, 25000, 0.7, 12, 32499, 0, ["the frame", "frame", "the frame 43\"", "samsung"]],
["samsung-the-frame-50i", "samsung-the-frame", "Samsung", "The Frame 50\"", "50\"", "tv", 22000, 30000, 0.8, 12, 38999, 0, ["the frame", "frame", "the frame 50\"", "samsung"]],
["samsung-the-frame-55i", "samsung-the-frame", "Samsung", "The Frame 55\"", "55\"", "tv", 26000, 35000, 1.0, 12, 45499, 0, ["the frame", "frame", "the frame 55\"", "samsung"]],
["samsung-the-frame-65i", "samsung-the-frame", "Samsung", "The Frame 65\"", "65\"", "tv", 36000, 48000, 1.3, 14, 62499, 0, ["the frame", "frame", "the frame 65\"", "samsung"]],
["samsung-the-frame-75i", "samsung-the-frame", "Samsung", "The Frame 75\"", "75\"", "tv", 52000, 68000, 1.6, 16, 88499, 0, ["the frame", "frame", "the frame 75\"", "samsung"]],
["lg-uhd-ut80-43i", "lg-uhd-ut80", "LG", "UHD UT80 43\"", "43\"", "tv", 8000, 11500, 0.7, 12, 14999, 0, ["ut80", "lg televizyon", "lg 43", "lg tv", "uhd ut80", "uhd ut80 43\""]],
["lg-uhd-ut80-50i", "lg-uhd-ut80", "LG", "UHD UT80 50\"", "50\"", "tv", 10000, 14000, 0.8, 12, 17999, 0, ["ut80", "lg televizyon", "lg 50", "lg tv", "uhd ut80", "uhd ut80 50\""]],
["lg-uhd-ut80-55i", "lg-uhd-ut80", "LG", "UHD UT80 55\"", "55\"", "tv", 12500, 18000, 1.0, 12, 23499, 0, ["ut80", "lg televizyon", "lg 55", "lg tv", "uhd ut80", "uhd ut80 55\""]],
["lg-uhd-ut80-65i", "lg-uhd-ut80", "LG", "UHD UT80 65\"", "65\"", "tv", 18000, 26000, 1.3, 14, 33999, 0, ["ut80", "lg televizyon", "lg 65", "lg tv", "uhd ut80", "uhd ut80 65\""]],
["lg-uhd-ut80-75i", "lg-uhd-ut80", "LG", "UHD UT80 75\"", "75\"", "tv", 28000, 38000, 1.6, 16, 49499, 0, ["ut80", "lg televizyon", "lg 75", "lg tv", "uhd ut80", "uhd ut80 75\""]],
["lg-uhd-ut80-86i", "lg-uhd-ut80", "LG", "UHD UT80 86\"", "86\"", "tv", 46000, 62000, 1.9, 16, 80499, 0, ["ut80", "lg televizyon", "lg 86", "lg tv", "uhd ut80", "uhd ut80 86\""]],
["lg-qned80-50i", "lg-qned80", "LG", "QNED80 50\"", "50\"", "tv", 14000, 19000, 0.8, 12, 24499, 0, ["qned", "qned80", "qned80 50\""]],
["lg-qned80-55i", "lg-qned80", "LG", "QNED80 55\"", "55\"", "tv", 17000, 23000, 1.0, 12, 29999, 0, ["qned", "qned80", "qned80 55\""]],
["lg-qned80-65i", "lg-qned80", "LG", "QNED80 65\"", "65\"", "tv", 24000, 32000, 1.3, 14, 41499, 0, ["qned", "qned80", "qned80 65\""]],
["lg-qned80-75i", "lg-qned80", "LG", "QNED80 75\"", "75\"", "tv", 36000, 48000, 1.6, 16, 62499, 0, ["qned", "qned80", "qned80 75\""]],
["lg-nanocell-nano75-50i", "lg-nanocell-nano75", "LG", "NanoCell NANO75 50\"", "50\"", "tv", 12500, 17500, 0.8, 12, 22999, 0, ["nanocell", "nano", "nanocell nano75", "nanocell nano75 50\""]],
["lg-nanocell-nano75-55i", "lg-nanocell-nano75", "LG", "NanoCell NANO75 55\"", "55\"", "tv", 14500, 20000, 1.0, 12, 25999, 0, ["nanocell", "nano", "nanocell nano75", "nanocell nano75 55\""]],
["lg-nanocell-nano75-65i", "lg-nanocell-nano75", "LG", "NanoCell NANO75 65\"", "65\"", "tv", 21000, 28000, 1.3, 14, 36499, 0, ["nanocell", "nano", "nanocell nano75", "nanocell nano75 65\""]],
["lg-oled-b4-55i", "lg-oled-b4", "LG", "OLED B4 55\"", "55\"", "tv", 28000, 37000, 1.0, 12, 47999, 0, ["b4", "lg oled", "oled b4", "oled b4 55\""]],
["lg-oled-b4-65i", "lg-oled-b4", "LG", "OLED B4 65\"", "65\"", "tv", 40000, 52000, 1.3, 14, 67499, 0, ["b4", "lg oled", "oled b4", "oled b4 65\""]],
["lg-oled-b4-77i", "lg-oled-b4", "LG", "OLED B4 77\"", "77\"", "tv", 62000, 80000, 1.7, 16, 103999, 0, ["b4", "lg oled", "oled b4", "oled b4 77\""]],
["lg-oled-c4-42i", "lg-oled-c4", "LG", "OLED C4 42\"", "42\"", "tv", 24000, 31000, 0.68, 12, 40499, 1, ["c4", "oled c4", "oled c4 42\""]],
["lg-oled-c4-48i", "lg-oled-c4", "LG", "OLED C4 48\"", "48\"", "tv", 26000, 34000, 0.75, 12, 43999, 1, ["c4", "oled c4", "oled c4 48\""]],
["lg-oled-c4-55i", "lg-oled-c4", "LG", "OLED C4 55\"", "55\"", "tv", 33000, 43000, 1.0, 12, 55999, 1, ["c4", "oled c4", "oled c4 55\""]],
["lg-oled-c4-65i", "lg-oled-c4", "LG", "OLED C4 65\"", "65\"", "tv", 46000, 60000, 1.3, 14, 77999, 1, ["c4", "oled c4", "oled c4 65\""]],
["lg-oled-c4-77i", "lg-oled-c4", "LG", "OLED C4 77\"", "77\"", "tv", 78000, 100000, 1.7, 16, 129999, 1, ["c4", "oled c4", "oled c4 77\""]],
["lg-oled-c4-83i", "lg-oled-c4", "LG", "OLED C4 83\"", "83\"", "tv", 100000, 130000, 1.85, 16, 168999, 1, ["c4", "oled c4", "oled c4 83\""]],
["lg-oled-g4-55i", "lg-oled-g4", "LG", "OLED G4 55\"", "55\"", "tv", 46000, 60000, 1.0, 12, 77999, 1, ["g4", "oled g4", "oled g4 55\""]],
["lg-oled-g4-65i", "lg-oled-g4", "LG", "OLED G4 65\"", "65\"", "tv", 62000, 80000, 1.3, 14, 103999, 1, ["g4", "oled g4", "oled g4 65\""]],
["lg-oled-g4-77i", "lg-oled-g4", "LG", "OLED G4 77\"", "77\"", "tv", 92000, 118000, 1.7, 16, 153499, 1, ["g4", "oled g4", "oled g4 77\""]],
["sony-bravia-x80l-50i", "sony-bravia-x80l", "Sony", "Bravia X80L 50\"", "50\"", "tv", 14000, 19000, 0.8, 12, 24499, 0, ["x80", "bravia", "sony televizyon", "sony 50", "sony tv", "bravia x80l", "bravia x80l 50\"", "sony"]],
["sony-bravia-x80l-55i", "sony-bravia-x80l", "Sony", "Bravia X80L 55\"", "55\"", "tv", 16500, 23000, 1.0, 12, 29999, 0, ["x80", "bravia", "sony televizyon", "sony 55", "sony tv", "bravia x80l", "bravia x80l 55\"", "sony"]],
["sony-bravia-x80l-65i", "sony-bravia-x80l", "Sony", "Bravia X80L 65\"", "65\"", "tv", 23000, 31000, 1.3, 14, 40499, 0, ["x80", "bravia", "sony televizyon", "sony 65", "sony tv", "bravia x80l", "bravia x80l 65\"", "sony"]],
["sony-bravia-x80l-75i", "sony-bravia-x80l", "Sony", "Bravia X80L 75\"", "75\"", "tv", 34000, 45000, 1.6, 16, 58499, 0, ["x80", "bravia", "sony televizyon", "sony 75", "sony tv", "bravia x80l", "bravia x80l 75\"", "sony"]],
["sony-bravia-x90l-55i", "sony-bravia-x90l", "Sony", "Bravia X90L 55\"", "55\"", "tv", 24000, 32000, 1.0, 12, 41499, 0, ["x90", "bravia x90l", "bravia x90l 55\"", "sony"]],
["sony-bravia-x90l-65i", "sony-bravia-x90l", "Sony", "Bravia X90L 65\"", "65\"", "tv", 33000, 44000, 1.3, 14, 56999, 0, ["x90", "bravia x90l", "bravia x90l 65\"", "sony"]],
["sony-bravia-x90l-75i", "sony-bravia-x90l", "Sony", "Bravia X90L 75\"", "75\"", "tv", 48000, 63000, 1.6, 16, 81999, 0, ["x90", "bravia x90l", "bravia x90l 75\"", "sony"]],
["sony-bravia-oled-a80l-55i", "sony-bravia-oled-a80l", "Sony", "Bravia OLED A80L 55\"", "55\"", "tv", 38000, 50000, 1.0, 12, 64999, 0, ["a80", "sony oled", "bravia oled a80l", "bravia oled a80l 55\"", "sony"]],
["sony-bravia-oled-a80l-65i", "sony-bravia-oled-a80l", "Sony", "Bravia OLED A80L 65\"", "65\"", "tv", 52000, 68000, 1.3, 14, 88499, 0, ["a80", "sony oled", "bravia oled a80l", "bravia oled a80l 65\"", "sony"]],
["sony-bravia-oled-a80l-77i", "sony-bravia-oled-a80l", "Sony", "Bravia OLED A80L 77\"", "77\"", "tv", 78000, 100000, 1.7, 16, 129999, 0, ["a80", "sony oled", "bravia oled a80l", "bravia oled a80l 77\"", "sony"]],
["tcl-p745-4k-43i", "tcl-p745-4k", "TCL", "P745 4K 43\"", "43\"", "tv", 6000, 8800, 0.7, 12, 11499, 0, ["p745", "tcl 43", "tcl tv", "p745 4k", "p745 4k 43\"", "tcl"]],
["tcl-p745-4k-50i", "tcl-p745-4k", "TCL", "P745 4K 50\"", "50\"", "tv", 7500, 11000, 0.8, 12, 14499, 0, ["p745", "tcl 50", "tcl tv", "p745 4k", "p745 4k 50\"", "tcl"]],
["tcl-p745-4k-55i", "tcl-p745-4k", "TCL", "P745 4K 55\"", "55\"", "tv", 8500, 12500, 1.0, 12, 15999, 0, ["p745", "tcl 55", "tcl tv", "p745 4k", "p745 4k 55\"", "tcl"]],
["tcl-p745-4k-65i", "tcl-p745-4k", "TCL", "P745 4K 65\"", "65\"", "tv", 12500, 18000, 1.3, 14, 23499, 0, ["p745", "tcl 65", "tcl tv", "p745 4k", "p745 4k 65\"", "tcl"]],
["tcl-p745-4k-75i", "tcl-p745-4k", "TCL", "P745 4K 75\"", "75\"", "tv", 19000, 27000, 1.6, 16, 34999, 0, ["p745", "tcl 75", "tcl tv", "p745 4k", "p745 4k 75\"", "tcl"]],
["tcl-p745-4k-85i", "tcl-p745-4k", "TCL", "P745 4K 85\"", "85\"", "tv", 28000, 39000, 1.9, 16, 50499, 0, ["p745", "tcl 85", "tcl tv", "p745 4k", "p745 4k 85\"", "tcl"]],
["tcl-qled-c645-50i", "tcl-qled-c645", "TCL", "QLED C645 50\"", "50\"", "tv", 9500, 13500, 0.8, 12, 17499, 0, ["c645", "tcl qled", "qled c645", "qled c645 50\"", "tcl"]],
["tcl-qled-c645-55i", "tcl-qled-c645", "TCL", "QLED C645 55\"", "55\"", "tv", 11000, 15500, 1.0, 12, 19999, 0, ["c645", "tcl qled", "qled c645", "qled c645 55\"", "tcl"]],
["tcl-qled-c645-65i", "tcl-qled-c645", "TCL", "QLED C645 65\"", "65\"", "tv", 16000, 22000, 1.3, 14, 28499, 0, ["c645", "tcl qled", "qled c645", "qled c645 65\"", "tcl"]],
["tcl-qled-c645-75i", "tcl-qled-c645", "TCL", "QLED C645 75\"", "75\"", "tv", 23000, 31000, 1.6, 16, 40499, 0, ["c645", "tcl qled", "qled c645", "qled c645 75\"", "tcl"]],
["tcl-mini-led-c845-55i", "tcl-mini-led-c845", "TCL", "Mini LED C845 55\"", "55\"", "tv", 17000, 23000, 1.0, 12, 29999, 0, ["c845", "mini led", "mini led c845", "mini led c845 55\"", "tcl"]],
["tcl-mini-led-c845-65i", "tcl-mini-led-c845", "TCL", "Mini LED C845 65\"", "65\"", "tv", 24000, 32000, 1.3, 14, 41499, 0, ["c845", "mini led", "mini led c845", "mini led c845 65\"", "tcl"]],
["tcl-mini-led-c845-75i", "tcl-mini-led-c845", "TCL", "Mini LED C845 75\"", "75\"", "tv", 34000, 45000, 1.6, 16, 58499, 0, ["c845", "mini led", "mini led c845", "mini led c845 75\"", "tcl"]],
["hisense-qled-e7k-43i", "hisense-qled-e7k", "Hisense", "QLED E7K 43\"", "43\"", "tv", 7000, 10000, 0.7, 12, 12999, 0, ["e7k", "hisense 43", "hisense tv", "qled e7k", "qled e7k 43\"", "hisense"]],
["hisense-qled-e7k-50i", "hisense-qled-e7k", "Hisense", "QLED E7K 50\"", "50\"", "tv", 9000, 13000, 0.8, 12, 16999, 0, ["e7k", "hisense 50", "hisense tv", "qled e7k", "qled e7k 50\"", "hisense"]],
["hisense-qled-e7k-55i", "hisense-qled-e7k", "Hisense", "QLED E7K 55\"", "55\"", "tv", 10500, 15000, 1.0, 12, 19499, 0, ["e7k", "hisense 55", "hisense tv", "qled e7k", "qled e7k 55\"", "hisense"]],
["hisense-qled-e7k-65i", "hisense-qled-e7k", "Hisense", "QLED E7K 65\"", "65\"", "tv", 15000, 21000, 1.3, 14, 27499, 0, ["e7k", "hisense 65", "hisense tv", "qled e7k", "qled e7k 65\"", "hisense"]],
["hisense-qled-e7k-75i", "hisense-qled-e7k", "Hisense", "QLED E7K 75\"", "75\"", "tv", 22000, 30000, 1.6, 16, 38999, 0, ["e7k", "hisense 75", "hisense tv", "qled e7k", "qled e7k 75\"", "hisense"]],
["hisense-mini-led-u7k-55i", "hisense-mini-led-u7k", "Hisense", "Mini LED U7K 55\"", "55\"", "tv", 16000, 22000, 1.0, 12, 28499, 0, ["u7k", "mini led u7k", "mini led u7k 55\"", "hisense"]],
["hisense-mini-led-u7k-65i", "hisense-mini-led-u7k", "Hisense", "Mini LED U7K 65\"", "65\"", "tv", 23000, 31000, 1.3, 14, 40499, 0, ["u7k", "mini led u7k", "mini led u7k 65\"", "hisense"]],
["philips-ambilight-pus8508-43i", "philips-ambilight-pus8508", "Philips", "Ambilight PUS8508 43\"", "43\"", "tv", 9500, 13000, 0.7, 12, 16999, 0, ["ambilight", "pus8508", "philips 43", "philips tv", "ambilight pus8508", "ambilight pus8508 43\"", "philips"]],
["philips-ambilight-pus8508-50i", "philips-ambilight-pus8508", "Philips", "Ambilight PUS8508 50\"", "50\"", "tv", 11000, 15000, 0.8, 12, 19499, 0, ["ambilight", "pus8508", "philips 50", "philips tv", "ambilight pus8508", "ambilight pus8508 50\"", "philips"]],
["philips-ambilight-pus8508-55i", "philips-ambilight-pus8508", "Philips", "Ambilight PUS8508 55\"", "55\"", "tv", 12500, 17500, 1.0, 12, 22999, 0, ["ambilight", "pus8508", "philips 55", "philips tv", "ambilight pus8508", "ambilight pus8508 55\"", "philips"]],
["philips-ambilight-pus8508-65i", "philips-ambilight-pus8508", "Philips", "Ambilight PUS8508 65\"", "65\"", "tv", 18000, 25000, 1.3, 14, 32499, 0, ["ambilight", "pus8508", "philips 65", "philips tv", "ambilight pus8508", "ambilight pus8508 65\"", "philips"]],
["philips-ambilight-pus8508-75i", "philips-ambilight-pus8508", "Philips", "Ambilight PUS8508 75\"", "75\"", "tv", 26000, 35000, 1.6, 16, 45499, 0, ["ambilight", "pus8508", "philips 75", "philips tv", "ambilight pus8508", "ambilight pus8508 75\"", "philips"]],
["philips-ambilight-oled708-55i", "philips-ambilight-oled708", "Philips", "Ambilight OLED708 55\"", "55\"", "tv", 30000, 40000, 1.0, 12, 51999, 0, ["oled708", "philips oled", "ambilight oled708", "ambilight oled708 55\"", "philips"]],
["philips-ambilight-oled708-65i", "philips-ambilight-oled708", "Philips", "Ambilight OLED708 65\"", "65\"", "tv", 42000, 55000, 1.3, 14, 71499, 0, ["oled708", "philips oled", "ambilight oled708", "ambilight oled708 65\"", "philips"]],
["vestel-4k-smart-tv-32i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 32\"", "32\"", "tv", 3200, 4800, 0.55, 12, 5999, 0, ["vestel televizyon", "vestel 32", "vestel tv", "4k smart tv", "4k smart tv 32\"", "vestel"]],
["vestel-4k-smart-tv-40i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 40\"", "40\"", "tv", 4800, 7000, 0.65, 12, 8999, 0, ["vestel televizyon", "vestel 40", "vestel tv", "4k smart tv", "4k smart tv 40\"", "vestel"]],
["vestel-4k-smart-tv-43i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 43\"", "43\"", "tv", 6500, 9500, 0.7, 12, 12499, 0, ["vestel televizyon", "vestel 43", "vestel tv", "4k smart tv", "4k smart tv 43\"", "vestel"]],
["vestel-4k-smart-tv-50i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 50\"", "50\"", "tv", 8000, 11500, 0.8, 12, 14999, 0, ["vestel televizyon", "vestel 50", "vestel tv", "4k smart tv", "4k smart tv 50\"", "vestel"]],
["vestel-4k-smart-tv-55i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 55\"", "55\"", "tv", 9000, 13000, 1.0, 12, 16999, 0, ["vestel televizyon", "vestel 55", "vestel tv", "4k smart tv", "4k smart tv 55\"", "vestel"]],
["vestel-4k-smart-tv-58i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 58\"", "58\"", "tv", 10000, 14500, 1.05, 12, 18999, 0, ["vestel televizyon", "vestel 58", "vestel tv", "4k smart tv", "4k smart tv 58\"", "vestel"]],
["vestel-4k-smart-tv-65i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 65\"", "65\"", "tv", 13000, 18500, 1.3, 14, 23999, 0, ["vestel televizyon", "vestel 65", "vestel tv", "4k smart tv", "4k smart tv 65\"", "vestel"]],
["vestel-4k-smart-tv-75i", "vestel-4k-smart-tv", "Vestel", "4K Smart TV 75\"", "75\"", "tv", 20000, 28000, 1.6, 16, 36499, 0, ["vestel televizyon", "vestel 75", "vestel tv", "4k smart tv", "4k smart tv 75\"", "vestel"]],
["grundig-4k-smart-tv-32i", "grundig-4k-smart-tv", "Grundig", "4K Smart TV 32\"", "32\"", "tv", 3000, 4500, 0.55, 12, 5999, 0, ["grundig", "grundig 32", "grundig tv", "4k smart tv", "4k smart tv 32\""]],
["grundig-4k-smart-tv-43i", "grundig-4k-smart-tv", "Grundig", "4K Smart TV 43\"", "43\"", "tv", 6000, 9000, 0.7, 12, 11499, 0, ["grundig", "grundig 43", "grundig tv", "4k smart tv", "4k smart tv 43\""]],
["grundig-4k-smart-tv-50i", "grundig-4k-smart-tv", "Grundig", "4K Smart TV 50\"", "50\"", "tv", 7200, 10500, 0.8, 12, 13499, 0, ["grundig", "grundig 50", "grundig tv", "4k smart tv", "4k smart tv 50\""]],
["grundig-4k-smart-tv-55i", "grundig-4k-smart-tv", "Grundig", "4K Smart TV 55\"", "55\"", "tv", 8000, 11500, 1.0, 12, 14999, 0, ["grundig", "grundig 55", "grundig tv", "4k smart tv", "4k smart tv 55\""]],
["grundig-4k-smart-tv-65i", "grundig-4k-smart-tv", "Grundig", "4K Smart TV 65\"", "65\"", "tv", 12000, 17000, 1.3, 14, 21999, 0, ["grundig", "grundig 65", "grundig tv", "4k smart tv", "4k smart tv 65\""]],
["toshiba-4k-smart-tv-43i", "toshiba-4k-smart-tv", "Toshiba", "4K Smart TV 43\"", "43\"", "tv", 5800, 8500, 0.7, 12, 10999, 0, ["toshiba", "toshiba 43", "toshiba tv", "4k smart tv", "4k smart tv 43\""]],
["toshiba-4k-smart-tv-50i", "toshiba-4k-smart-tv", "Toshiba", "4K Smart TV 50\"", "50\"", "tv", 6500, 9500, 0.8, 12, 12499, 0, ["toshiba", "toshiba 50", "toshiba tv", "4k smart tv", "4k smart tv 50\""]],
["toshiba-4k-smart-tv-55i", "toshiba-4k-smart-tv", "Toshiba", "4K Smart TV 55\"", "55\"", "tv", 7500, 11000, 1.0, 12, 14499, 0, ["toshiba", "toshiba 55", "toshiba tv", "4k smart tv", "4k smart tv 55\""]],
["toshiba-4k-smart-tv-65i", "toshiba-4k-smart-tv", "Toshiba", "4K Smart TV 65\"", "65\"", "tv", 11000, 16000, 1.3, 14, 20999, 0, ["toshiba", "toshiba 65", "toshiba tv", "4k smart tv", "4k smart tv 65\""]],
["xiaomi-tv-a-pro-32i", "xiaomi-tv-a-pro", "Xiaomi", "TV A Pro 32\"", "32\"", "tv", 3200, 4800, 0.55, 12, 5999, 0, ["mi tv", "xiaomi 32", "xiaomi tv", "tv a pro", "tv a pro 32\"", "xiaomi"]],
["xiaomi-tv-a-pro-43i", "xiaomi-tv-a-pro", "Xiaomi", "TV A Pro 43\"", "43\"", "tv", 6500, 9500, 0.7, 12, 12499, 0, ["mi tv", "xiaomi 43", "xiaomi tv", "tv a pro", "tv a pro 43\"", "xiaomi"]],
["xiaomi-tv-a-pro-55i", "xiaomi-tv-a-pro", "Xiaomi", "TV A Pro 55\"", "55\"", "tv", 9000, 13000, 1.0, 12, 16999, 0, ["mi tv", "xiaomi 55", "xiaomi tv", "tv a pro", "tv a pro 55\"", "xiaomi"]],
["xiaomi-tv-a-pro-65i", "xiaomi-tv-a-pro", "Xiaomi", "TV A Pro 65\"", "65\"", "tv", 13500, 19000, 1.3, 14, 24499, 0, ["mi tv", "xiaomi 65", "xiaomi tv", "tv a pro", "tv a pro 65\"", "xiaomi"]],
["regal-4k-smart-tv-32i", "regal-4k-smart-tv", "Regal", "4K Smart TV 32\"", "32\"", "tv", 2800, 4200, 0.55, 12, 5499, 0, ["regal", "regal 32", "regal tv", "4k smart tv", "4k smart tv 32\""]],
["regal-4k-smart-tv-43i", "regal-4k-smart-tv", "Regal", "4K Smart TV 43\"", "43\"", "tv", 5500, 8000, 0.7, 12, 10499, 0, ["regal", "regal 43", "regal tv", "4k smart tv", "4k smart tv 43\""]],
["regal-4k-smart-tv-50i", "regal-4k-smart-tv", "Regal", "4K Smart TV 50\"", "50\"", "tv", 6200, 9000, 0.8, 12, 11499, 0, ["regal", "regal 50", "regal tv", "4k smart tv", "4k smart tv 50\""]],
["regal-4k-smart-tv-55i", "regal-4k-smart-tv", "Regal", "4K Smart TV 55\"", "55\"", "tv", 7000, 10000, 1.0, 12, 12999, 0, ["regal", "regal 55", "regal tv", "4k smart tv", "4k smart tv 55\""]],
["regal-4k-smart-tv-65i", "regal-4k-smart-tv", "Regal", "4K Smart TV 65\"", "65\"", "tv", 10500, 15000, 1.3, 14, 19499, 0, ["regal", "regal 65", "regal tv", "4k smart tv", "4k smart tv 65\""]],
["onvo-4k-smart-tv-32i", "onvo-4k-smart-tv", "Onvo", "4K Smart TV 32\"", "32\"", "tv", 2500, 3800, 0.55, 12, 4999, 0, ["onvo", "onvo 32", "onvo tv", "4k smart tv", "4k smart tv 32\""]],
["onvo-4k-smart-tv-43i", "onvo-4k-smart-tv", "Onvo", "4K Smart TV 43\"", "43\"", "tv", 4800, 7000, 0.7, 12, 8999, 0, ["onvo", "onvo 43", "onvo tv", "4k smart tv", "4k smart tv 43\""]],
["onvo-4k-smart-tv-50i", "onvo-4k-smart-tv", "Onvo", "4K Smart TV 50\"", "50\"", "tv", 5500, 8000, 0.8, 12, 10499, 0, ["onvo", "onvo 50", "onvo tv", "4k smart tv", "4k smart tv 50\""]],
["onvo-4k-smart-tv-55i", "onvo-4k-smart-tv", "Onvo", "4K Smart TV 55\"", "55\"", "tv", 6500, 9500, 1.0, 12, 12499, 0, ["onvo", "onvo 55", "onvo tv", "4k smart tv", "4k smart tv 55\""]],
["onvo-4k-smart-tv-65i", "onvo-4k-smart-tv", "Onvo", "4K Smart TV 65\"", "65\"", "tv", 9500, 13500, 1.3, 14, 17499, 0, ["onvo", "onvo 65", "onvo tv", "4k smart tv", "4k smart tv 65\""]],
["axen-4k-smart-tv-32i", "axen-4k-smart-tv", "Axen", "4K Smart TV 32\"", "32\"", "tv", 2500, 3800, 0.55, 12, 4999, 0, ["axen", "axen 32", "axen tv", "4k smart tv", "4k smart tv 32\""]],
["axen-4k-smart-tv-43i", "axen-4k-smart-tv", "Axen", "4K Smart TV 43\"", "43\"", "tv", 4800, 7000, 0.7, 12, 8999, 0, ["axen", "axen 43", "axen tv", "4k smart tv", "4k smart tv 43\""]],
["axen-4k-smart-tv-50i", "axen-4k-smart-tv", "Axen", "4K Smart TV 50\"", "50\"", "tv", 5500, 8000, 0.8, 12, 10499, 0, ["axen", "axen 50", "axen tv", "4k smart tv", "4k smart tv 50\""]],
["axen-4k-smart-tv-55i", "axen-4k-smart-tv", "Axen", "4K Smart TV 55\"", "55\"", "tv", 6500, 9500, 1.0, 12, 12499, 0, ["axen", "axen 55", "axen tv", "4k smart tv", "4k smart tv 55\""]],
["axen-4k-smart-tv-65i", "axen-4k-smart-tv", "Axen", "4K Smart TV 65\"", "65\"", "tv", 9500, 13500, 1.3, 14, 17499, 0, ["axen", "axen 65", "axen tv", "4k smart tv", "4k smart tv 65\""]],
["sunny-4k-smart-tv-32i", "sunny-4k-smart-tv", "Sunny", "4K Smart TV 32\"", "32\"", "tv", 2600, 4000, 0.55, 12, 4999, 0, ["sunny", "sunny 32", "sunny tv", "4k smart tv", "4k smart tv 32\""]],
["sunny-4k-smart-tv-43i", "sunny-4k-smart-tv", "Sunny", "4K Smart TV 43\"", "43\"", "tv", 5000, 7200, 0.7, 12, 9499, 0, ["sunny", "sunny 43", "sunny tv", "4k smart tv", "4k smart tv 43\""]],
["sunny-4k-smart-tv-55i", "sunny-4k-smart-tv", "Sunny", "4K Smart TV 55\"", "55\"", "tv", 6800, 9800, 1.0, 12, 12499, 0, ["sunny", "sunny 55", "sunny tv", "4k smart tv", "4k smart tv 55\""]],
["sunny-4k-smart-tv-65i", "sunny-4k-smart-tv", "Sunny", "4K Smart TV 65\"", "65\"", "tv", 9800, 14000, 1.3, 14, 17999, 0, ["sunny", "sunny 65", "sunny tv", "4k smart tv", "4k smart tv 65\""]],
["woon-4k-smart-tv-32i", "woon-4k-smart-tv", "Woon", "4K Smart TV 32\"", "32\"", "tv", 2500, 3800, 0.55, 12, 4999, 0, ["woon", "woon 32", "woon tv", "4k smart tv", "4k smart tv 32\""]],
["woon-4k-smart-tv-43i", "woon-4k-smart-tv", "Woon", "4K Smart TV 43\"", "43\"", "tv", 4800, 7000, 0.7, 12, 8999, 0, ["woon", "woon 43", "woon tv", "4k smart tv", "4k smart tv 43\""]],
["woon-4k-smart-tv-55i", "woon-4k-smart-tv", "Woon", "4K Smart TV 55\"", "55\"", "tv", 6500, 9500, 1.0, 12, 12499, 0, ["woon", "woon 55", "woon tv", "4k smart tv", "4k smart tv 55\""]],
["apple-macbook-air-m1-8-256-gb", "apple-macbook-air-m1", "Apple", "MacBook Air M1 8/256 GB", "8/256 GB", "laptop", 26000, 33000, 1.3, 7, 0, 0, ["macbook air", "air m1", "macbook air m1", "macbook air m1 8/256 gb", "apple"]],
["apple-macbook-air-m1-16-512-gb", "apple-macbook-air-m1", "Apple", "MacBook Air M1 16/512 GB", "16/512 GB", "laptop", 31700, 40300, 1.3, 7, 0, 0, ["macbook air", "air m1", "macbook air m1", "macbook air m1 16/512 gb", "apple"]],
["apple-macbook-air-m2-8-256-gb", "apple-macbook-air-m2", "Apple", "MacBook Air M2 8/256 GB", "8/256 GB", "laptop", 32000, 40000, 1.4, 7, 44999, 0, ["air m2", "macbook air m2", "macbook air m2 8/256 gb", "apple"]],
["apple-macbook-air-m2-16-512-gb", "apple-macbook-air-m2", "Apple", "MacBook Air M2 16/512 GB", "16/512 GB", "laptop", 39000, 48800, 1.4, 7, 54999, 0, ["air m2", "macbook air m2", "macbook air m2 16/512 gb", "apple"]],
["apple-macbook-air-m3-8-256-gb", "apple-macbook-air-m3", "Apple", "MacBook Air M3 8/256 GB", "8/256 GB", "laptop", 40000, 50000, 1.5, 7, 54999, 0, ["air m3", "macbook air m3", "macbook air m3 8/256 gb", "apple"]],
["apple-macbook-air-m3-16-512-gb", "apple-macbook-air-m3", "Apple", "MacBook Air M3 16/512 GB", "16/512 GB", "laptop", 48800, 61000, 1.5, 7, 66999, 0, ["air m3", "macbook air m3", "macbook air m3 16/512 gb", "apple"]],
["apple-macbook-air-m4-16-512-gb", "apple-macbook-air-m4", "Apple", "MacBook Air M4 16/512 GB", "16/512 GB", "laptop", 56100, 68300, 1.6, 6, 76999, 1, ["air m4", "macbook air m4", "macbook air m4 16/512 gb", "apple"]],
["apple-macbook-pro-13-m1-8-256-gb", "apple-macbook-pro-13-m1", "Apple", "MacBook Pro 13 M1 8/256 GB", "8/256 GB", "laptop", 33000, 42000, 1.5, 8, 0, 0, ["macbook pro", "macbook pro 13 m1", "macbook pro 13 m1 8/256 gb", "apple"]],
["apple-macbook-pro-13-m1-16-512-gb", "apple-macbook-pro-13-m1", "Apple", "MacBook Pro 13 M1 16/512 GB", "16/512 GB", "laptop", 40300, 51200, 1.5, 8, 0, 0, ["macbook pro", "macbook pro 13 m1", "macbook pro 13 m1 16/512 gb", "apple"]],
["apple-macbook-pro-14-m3-16-512-gb", "apple-macbook-pro-14-m3", "Apple", "MacBook Pro 14 M3 16/512 GB", "16/512 GB", "laptop", 73200, 91500, 1.9, 8, 97499, 0, ["macbook pro m3", "macbook pro 14 m3", "macbook pro 14 m3 16/512 gb", "apple"]],
["apple-macbook-pro-14-m4-16-512-gb", "apple-macbook-pro-14-m4", "Apple", "MacBook Pro 14 M4 16/512 GB", "16/512 GB", "laptop", 80500, 97600, 2.0, 7, 109999, 1, ["macbook pro m4", "macbook pro 14 m4", "macbook pro 14 m4 16/512 gb", "apple"]],
["apple-mac-mini-m2-8-256-gb", "apple-mac-mini-m2", "Apple", "Mac mini M2 8/256 GB", "8/256 GB", "laptop", 18000, 24000, 1.1, 9, 29999, 0, ["mac mini", "mac mini m2", "mac mini m2 8/256 gb", "apple"]],
["apple-mac-mini-m2-16-512-gb", "apple-mac-mini-m2", "Apple", "Mac mini M2 16/512 GB", "16/512 GB", "laptop", 22000, 29300, 1.1, 9, 36499, 0, ["mac mini", "mac mini m2", "mac mini m2 16/512 gb", "apple"]],
["apple-imac-24-m1-8-256-gb", "apple-imac-24-m1", "Apple", "iMac 24 (M1) 8/256 GB", "8/256 GB", "laptop", 32000, 40000, 1.4, 10, 0, 0, ["imac", "imac 24 (m1)", "imac 24 (m1) 8/256 gb", "apple"]],
["lenovo-ideapad-3-i5-8-gb", "lenovo-ideapad-3", "Lenovo", "IdeaPad 3 i5 / 8 GB", "i5 / 8 GB", "laptop", 11000, 15600, 0.8, 10, 17499, 0, ["ideapad", "lenovo", "ideapad 3", "ideapad 3 i5 / 8 gb"]],
["lenovo-ideapad-3-i5-16-gb", "lenovo-ideapad-3", "Lenovo", "IdeaPad 3 i5 / 16 GB", "i5 / 16 GB", "laptop", 12000, 17000, 0.8, 10, 18999, 0, ["ideapad", "lenovo", "ideapad 3", "ideapad 3 i5 / 16 gb"]],
["lenovo-ideapad-slim-5-i5-16-gb", "lenovo-ideapad-slim-5", "Lenovo", "IdeaPad Slim 5 i5 / 16 GB", "i5 / 16 GB", "laptop", 16000, 22000, 0.9, 10, 26999, 0, ["ideapad slim", "ideapad slim 5", "ideapad slim 5 i5 / 16 gb", "lenovo"]],
["lenovo-ideapad-slim-5-i7-16-gb", "lenovo-ideapad-slim-5", "Lenovo", "IdeaPad Slim 5 i7 / 16 GB", "i7 / 16 GB", "laptop", 18900, 26000, 0.9, 10, 31999, 0, ["ideapad slim", "ideapad slim 5", "ideapad slim 5 i7 / 16 gb", "lenovo"]],
["lenovo-thinkpad-e14-i5-16-gb", "lenovo-thinkpad-e14", "Lenovo", "ThinkPad E14 i5 / 16 GB", "i5 / 16 GB", "laptop", 18000, 25000, 1.0, 10, 32999, 0, ["thinkpad", "thinkpad e14", "thinkpad e14 i5 / 16 gb", "lenovo"]],
["lenovo-thinkpad-e14-i7-16-gb", "lenovo-thinkpad-e14", "Lenovo", "ThinkPad E14 i7 / 16 GB", "i7 / 16 GB", "laptop", 21200, 29500, 1.0, 10, 38999, 0, ["thinkpad", "thinkpad e14", "thinkpad e14 i7 / 16 gb", "lenovo"]],
["lenovo-thinkpad-x1-carbon-i7-16-gb", "lenovo-thinkpad-x1-carbon", "Lenovo", "ThinkPad X1 Carbon i7 / 16 GB", "i7 / 16 GB", "laptop", 33000, 44800, 1.2, 10, 64999, 0, ["x1 carbon", "thinkpad x1 carbon", "thinkpad x1 carbon i7 / 16 gb", "lenovo"]],
["lenovo-v15-i5-8-gb", "lenovo-v15", "Lenovo", "V15 i5 / 8 GB", "i5 / 8 GB", "laptop", 9200, 12900, 0.7, 11, 14499, 0, ["lenovo v15", "v15", "v15 i5 / 8 gb", "lenovo"]],
["lenovo-v15-i5-16-gb", "lenovo-v15", "Lenovo", "V15 i5 / 16 GB", "i5 / 16 GB", "laptop", 10000, 14000, 0.7, 11, 15999, 0, ["lenovo v15", "v15", "v15 i5 / 16 gb", "lenovo"]],
["lenovo-legion-5-rtx-3050", "lenovo-legion-5", "Lenovo", "Legion 5 RTX 3050", "RTX 3050", "laptop", 25200, 32400, 1.1, 9, 42999, 0, ["legion", "legion 5", "legion 5 rtx 3050", "lenovo"]],
["lenovo-legion-5-rtx-4060", "lenovo-legion-5", "Lenovo", "Legion 5 RTX 4060", "RTX 4060", "laptop", 34200, 43900, 1.1, 9, 58499, 0, ["legion", "legion 5", "legion 5 rtx 4060", "lenovo"]],
["lenovo-loq-15-rtx-4050", "lenovo-loq-15", "Lenovo", "LOQ 15 RTX 4050", "RTX 4050", "laptop", 28000, 36000, 1.0, 9, 46999, 1, ["loq", "loq 15", "loq 15 rtx 4050", "lenovo"]],
["lenovo-loq-15-rtx-4060", "lenovo-loq-15", "Lenovo", "LOQ 15 RTX 4060", "RTX 4060", "laptop", 34200, 43900, 1.0, 9, 57499, 1, ["loq", "loq 15", "loq 15 rtx 4060", "lenovo"]],
["asus-vivobook-15-i5-8-gb", "asus-vivobook-15", "Asus", "Vivobook 15 i5 / 8 GB", "i5 / 8 GB", "laptop", 12000, 16600, 0.8, 10, 19499, 0, ["vivobook", "asus", "vivobook 15", "vivobook 15 i5 / 8 gb"]],
["asus-vivobook-15-i5-16-gb", "asus-vivobook-15", "Asus", "Vivobook 15 i5 / 16 GB", "i5 / 16 GB", "laptop", 13000, 18000, 0.8, 10, 20999, 0, ["vivobook", "asus", "vivobook 15", "vivobook 15 i5 / 16 gb"]],
["asus-x515-i5-8-gb", "asus-x515", "Asus", "X515 i5 / 8 GB", "i5 / 8 GB", "laptop", 9200, 12900, 0.7, 11, 14499, 0, ["x515", "x515 i5 / 8 gb", "asus"]],
["asus-zenbook-14-i5-16-gb", "asus-zenbook-14", "Asus", "Zenbook 14 i5 / 16 GB", "i5 / 16 GB", "laptop", 22000, 29000, 1.0, 10, 34999, 0, ["zenbook", "zenbook 14", "zenbook 14 i5 / 16 gb", "asus"]],
["asus-zenbook-14-i7-16-gb", "asus-zenbook-14", "Asus", "Zenbook 14 i7 / 16 GB", "i7 / 16 GB", "laptop", 26000, 34200, 1.0, 10, 41499, 0, ["zenbook", "zenbook 14", "zenbook 14 i7 / 16 gb", "asus"]],
["asus-tuf-gaming-f15-rtx-3050", "asus-tuf-gaming-f15", "Asus", "TUF Gaming F15 RTX 3050", "RTX 3050", "laptop", 21600, 27900, 1.0, 9, 34999, 0, ["tuf", "tuf gaming f15", "tuf gaming f15 rtx 3050", "asus"]],
["asus-tuf-gaming-f15-rtx-4060", "asus-tuf-gaming-f15", "Asus", "TUF Gaming F15 RTX 4060", "RTX 4060", "laptop", 29300, 37800, 1.0, 9, 47499, 0, ["tuf", "tuf gaming f15", "tuf gaming f15 rtx 4060", "asus"]],
["asus-rog-strix-g15-rtx-4060", "asus-rog-strix-g15", "Asus", "ROG Strix G15 RTX 4060", "RTX 4060", "laptop", 41500, 53700, 1.2, 9, 72999, 0, ["rog", "rog strix g15", "rog strix g15 rtx 4060", "asus"]],
["asus-expertbook-i5-16-gb", "asus-expertbook", "Asus", "ExpertBook i5 / 16 GB", "i5 / 16 GB", "laptop", 14000, 19000, 0.8, 11, 22999, 0, ["expertbook", "expertbook i5 / 16 gb", "asus"]],
["hp-pavilion-15-i5-8-gb", "hp-pavilion-15", "HP", "Pavilion 15 i5 / 8 GB", "i5 / 8 GB", "laptop", 12000, 16600, 0.8, 10, 19499, 0, ["pavilion", "pavilion 15", "pavilion 15 i5 / 8 gb"]],
["hp-pavilion-15-i5-16-gb", "hp-pavilion-15", "HP", "Pavilion 15 i5 / 16 GB", "i5 / 16 GB", "laptop", 13000, 18000, 0.8, 10, 20999, 0, ["pavilion", "pavilion 15", "pavilion 15 i5 / 16 gb"]],
["hp-250-g9-i5-8-gb", "hp-250-g9", "HP", "250 G9 i5 / 8 GB", "i5 / 8 GB", "laptop", 9200, 12900, 0.7, 11, 14499, 0, ["hp 250", "250 g9", "250 g9 i5 / 8 gb"]],
["hp-250-g9-i5-16-gb", "hp-250-g9", "HP", "250 G9 i5 / 16 GB", "i5 / 16 GB", "laptop", 10000, 14000, 0.7, 11, 15999, 0, ["hp 250", "250 g9", "250 g9 i5 / 16 gb"]],
["hp-probook-450-i5-16-gb", "hp-probook-450", "HP", "ProBook 450 i5 / 16 GB", "i5 / 16 GB", "laptop", 16000, 22000, 0.9, 10, 27999, 0, ["probook", "probook 450", "probook 450 i5 / 16 gb"]],
["hp-probook-450-i7-16-gb", "hp-probook-450", "HP", "ProBook 450 i7 / 16 GB", "i7 / 16 GB", "laptop", 18900, 26000, 0.9, 10, 32999, 0, ["probook", "probook 450", "probook 450 i7 / 16 gb"]],
["hp-elitebook-840-i5-16-gb", "hp-elitebook-840", "HP", "EliteBook 840 i5 / 16 GB", "i5 / 16 GB", "laptop", 20000, 27000, 1.0, 10, 38999, 0, ["elitebook", "elitebook 840", "elitebook 840 i5 / 16 gb"]],
["hp-elitebook-840-i7-16-gb", "hp-elitebook-840", "HP", "EliteBook 840 i7 / 16 GB", "i7 / 16 GB", "laptop", 23600, 31900, 1.0, 10, 45999, 0, ["elitebook", "elitebook 840", "elitebook 840 i7 / 16 gb"]],
["hp-victus-16-rtx-3050", "hp-victus-16", "HP", "Victus 16 RTX 3050", "RTX 3050", "laptop", 19800, 26100, 1.0, 9, 33499, 0, ["victus", "victus 16", "victus 16 rtx 3050"]],
["hp-victus-16-rtx-4060", "hp-victus-16", "HP", "Victus 16 RTX 4060", "RTX 4060", "laptop", 26800, 35400, 1.0, 9, 44999, 0, ["victus", "victus 16", "victus 16 rtx 4060"]],
["hp-omen-16-rtx-4060", "hp-omen-16", "HP", "Omen 16 RTX 4060", "RTX 4060", "laptop", 36600, 47600, 1.1, 9, 64499, 0, ["omen", "omen 16", "omen 16 rtx 4060"]],
["dell-inspiron-15-i5-8-gb", "dell-inspiron-15", "Dell", "Inspiron 15 i5 / 8 GB", "i5 / 8 GB", "laptop", 11000, 15600, 0.8, 11, 18499, 0, ["inspiron", "dell", "inspiron 15", "inspiron 15 i5 / 8 gb"]],
["dell-inspiron-15-i5-16-gb", "dell-inspiron-15", "Dell", "Inspiron 15 i5 / 16 GB", "i5 / 16 GB", "laptop", 12000, 17000, 0.8, 11, 19999, 0, ["inspiron", "dell", "inspiron 15", "inspiron 15 i5 / 16 gb"]],
["dell-vostro-15-i5-16-gb", "dell-vostro-15", "Dell", "Vostro 15 i5 / 16 GB", "i5 / 16 GB", "laptop", 13000, 18000, 0.8, 11, 21999, 0, ["vostro", "vostro 15", "vostro 15 i5 / 16 gb", "dell"]],
["dell-latitude-5440-i5-16-gb", "dell-latitude-5440", "Dell", "Latitude 5440 i5 / 16 GB", "i5 / 16 GB", "laptop", 18000, 25000, 0.9, 10, 31999, 0, ["latitude", "latitude 5440", "latitude 5440 i5 / 16 gb", "dell"]],
["dell-latitude-5440-i7-16-gb", "dell-latitude-5440", "Dell", "Latitude 5440 i7 / 16 GB", "i7 / 16 GB", "laptop", 21200, 29500, 0.9, 10, 37999, 0, ["latitude", "latitude 5440", "latitude 5440 i7 / 16 gb", "dell"]],
["dell-xps-13-i7-16-gb", "dell-xps-13", "Dell", "XPS 13 i7 / 16 GB", "i7 / 16 GB", "laptop", 30700, 40100, 1.1, 10, 52999, 0, ["xps", "xps 13", "xps 13 i7 / 16 gb", "dell"]],
["dell-g15-gaming-rtx-3050", "dell-g15-gaming", "Dell", "G15 Gaming RTX 3050", "RTX 3050", "laptop", 21600, 27900, 1.0, 9, 35999, 0, ["dell g15", "g15 gaming", "g15 gaming rtx 3050", "dell"]],
["dell-g15-gaming-rtx-4060", "dell-g15-gaming", "Dell", "G15 Gaming RTX 4060", "RTX 4060", "laptop", 29300, 37800, 1.0, 9, 48999, 0, ["dell g15", "g15 gaming", "g15 gaming rtx 4060", "dell"]],
["acer-aspire-5-i5-8-gb", "acer-aspire-5", "Acer", "Aspire 5 i5 / 8 GB", "i5 / 8 GB", "laptop", 10100, 14300, 0.7, 11, 16499, 0, ["aspire", "acer", "aspire 5", "aspire 5 i5 / 8 gb"]],
["acer-aspire-5-i5-16-gb", "acer-aspire-5", "Acer", "Aspire 5 i5 / 16 GB", "i5 / 16 GB", "laptop", 11000, 15500, 0.7, 11, 17999, 0, ["aspire", "acer", "aspire 5", "aspire 5 i5 / 16 gb"]],
["acer-extensa-15-i5-8-gb", "acer-extensa-15", "Acer", "Extensa 15 i5 / 8 GB", "i5 / 8 GB", "laptop", 8300, 12000, 0.65, 11, 13999, 0, ["extensa", "extensa 15", "extensa 15 i5 / 8 gb", "acer"]],
["acer-swift-3-i5-16-gb", "acer-swift-3", "Acer", "Swift 3 i5 / 16 GB", "i5 / 16 GB", "laptop", 14000, 19000, 0.8, 10, 22999, 0, ["swift", "swift 3", "swift 3 i5 / 16 gb", "acer"]],
["acer-nitro-5-rtx-3050", "acer-nitro-5", "Acer", "Nitro 5 RTX 3050", "RTX 3050", "laptop", 19800, 26100, 1.0, 9, 33499, 0, ["nitro", "nitro 5", "nitro 5 rtx 3050", "acer"]],
["acer-nitro-5-rtx-4060", "acer-nitro-5", "Acer", "Nitro 5 RTX 4060", "RTX 4060", "laptop", 26800, 35400, 1.0, 9, 44999, 0, ["nitro", "nitro 5", "nitro 5 rtx 4060", "acer"]],
["msi-modern-14-i5-16-gb", "msi-modern-14", "MSI", "Modern 14 i5 / 16 GB", "i5 / 16 GB", "laptop", 14000, 19000, 0.8, 10, 22999, 0, ["msi modern", "modern 14", "modern 14 i5 / 16 gb", "msi"]],
["msi-katana-gf66-rtx-3050", "msi-katana-gf66", "MSI", "Katana GF66 RTX 3050", "RTX 3050", "laptop", 20700, 27000, 1.0, 9, 33999, 0, ["katana", "msi", "katana gf66", "katana gf66 rtx 3050"]],
["msi-katana-gf66-rtx-4060", "msi-katana-gf66", "MSI", "Katana GF66 RTX 4060", "RTX 4060", "laptop", 28100, 36600, 1.0, 9, 46499, 0, ["katana", "msi", "katana gf66", "katana gf66 rtx 4060"]],
["msi-thin-15-rtx-4050", "msi-thin-15", "MSI", "Thin 15 RTX 4050", "RTX 4050", "laptop", 20000, 26000, 0.9, 9, 32999, 0, ["msi thin", "thin 15", "thin 15 rtx 4050", "msi"]],
["monster-abra-a5-rtx-3050", "monster-abra-a5", "Monster", "Abra A5 RTX 3050", "RTX 3050", "laptop", 15300, 20700, 0.9, 9, 24999, 0, ["abra", "monster", "abra a5", "abra a5 rtx 3050"]],
["monster-abra-a5-rtx-4050", "monster-abra-a5", "Monster", "Abra A5 RTX 4050", "RTX 4050", "laptop", 17000, 23000, 0.9, 9, 27999, 0, ["abra", "monster", "abra a5", "abra a5 rtx 4050"]],
["monster-tulpar-t7-rtx-4060", "monster-tulpar-t7", "Monster", "Tulpar T7 RTX 4060", "RTX 4060", "laptop", 31700, 41500, 1.1, 9, 52499, 0, ["tulpar", "tulpar t7", "tulpar t7 rtx 4060", "monster"]],
["casper-nirvana-x500-i5-8-gb", "casper-nirvana-x500", "Casper", "Nirvana X500 i5 / 8 GB", "i5 / 8 GB", "laptop", 10100, 13800, 0.7, 11, 16499, 0, ["nirvana", "casper laptop", "nirvana x500", "nirvana x500 i5 / 8 gb", "casper"]],
["casper-nirvana-x500-i5-16-gb", "casper-nirvana-x500", "Casper", "Nirvana X500 i5 / 16 GB", "i5 / 16 GB", "laptop", 11000, 15000, 0.7, 11, 17999, 0, ["nirvana", "casper laptop", "nirvana x500", "nirvana x500 i5 / 16 gb", "casper"]],
["casper-excalibur-g770-rtx-4050", "casper-excalibur-g770", "Casper", "Excalibur G770 RTX 4050", "RTX 4050", "laptop", 24000, 31000, 1.0, 9, 37999, 0, ["excalibur", "excalibur g770", "excalibur g770 rtx 4050", "casper"]],
["casper-excalibur-g770-rtx-4060", "casper-excalibur-g770", "Casper", "Excalibur G770 RTX 4060", "RTX 4060", "laptop", 29300, 37800, 1.0, 9, 46499, 0, ["excalibur", "excalibur g770", "excalibur g770 rtx 4060", "casper"]],
["huawei-matebook-d15-i5-8-gb", "huawei-matebook-d15", "Huawei", "MateBook D15 i5 / 8 GB", "i5 / 8 GB", "laptop", 11000, 15200, 0.8, 10, 18499, 0, ["matebook", "matebook d15", "matebook d15 i5 / 8 gb", "huawei"]],
["huawei-matebook-d15-i5-16-gb", "huawei-matebook-d15", "Huawei", "MateBook D15 i5 / 16 GB", "i5 / 16 GB", "laptop", 12000, 16500, 0.8, 10, 19999, 0, ["matebook", "matebook d15", "matebook d15 i5 / 16 gb", "huawei"]],
["samsung-galaxy-book3-i5-16-gb", "samsung-galaxy-book3", "Samsung", "Galaxy Book3 i5 / 16 GB", "i5 / 16 GB", "laptop", 18000, 24000, 0.9, 10, 29999, 0, ["galaxy book", "galaxy book3", "galaxy book3 i5 / 16 gb", "samsung"]],
["samsung-galaxy-book3-i7-16-gb", "samsung-galaxy-book3", "Samsung", "Galaxy Book3 i7 / 16 GB", "i7 / 16 GB", "laptop", 21200, 28300, 0.9, 10, 35499, 0, ["galaxy book", "galaxy book3", "galaxy book3 i7 / 16 gb", "samsung"]],
["toplama-gaming-pc-rtx-3050", "toplama-gaming-pc", "Toplama", "Gaming PC RTX 3050", "RTX 3050", "laptop", 19800, 27000, 0.8, 8, 0, 0, ["toplama pc", "gaming pc", "rtx", "gaming pc rtx 3050", "toplama"]],
["toplama-gaming-pc-rtx-4060", "toplama-gaming-pc", "Toplama", "Gaming PC RTX 4060", "RTX 4060", "laptop", 26800, 36600, 0.8, 8, 0, 0, ["toplama pc", "gaming pc", "rtx", "gaming pc rtx 4060", "toplama"]],
["samsung-27i-kavisli-monitor", "samsung-27i-kavisli-monitor", "Samsung", "27\" Kavisli Monitör", "", "laptop", 4500, 6500, 0.6, 10, 8999, 0, ["monitör", "monitor", "kavisli", "27\" kavisli monitör", "samsung"]],
["samsung-32i-kavisli-monitor", "samsung-32i-kavisli-monitor", "Samsung", "32\" Kavisli Monitör", "", "laptop", 6000, 8500, 0.7, 10, 11999, 0, ["32 monitör", "32\" kavisli monitör", "samsung"]],
["lg-27i-ips-monitor", "lg-27i-ips-monitor", "LG", "27\" IPS Monitör", "", "laptop", 4500, 6500, 0.6, 10, 8999, 0, ["lg monitör", "27\" ips monitör"]],
["lg-34i-ultrawide-monitor", "lg-34i-ultrawide-monitor", "LG", "34\" UltraWide Monitör", "", "laptop", 9000, 13000, 0.9, 10, 17999, 0, ["ultrawide", "34\" ultrawide monitör"]],
["hp-deskjet-yazici", "hp-deskjet-yazici", "HP", "DeskJet Yazıcı", "", "laptop", 1500, 2500, 0.5, 12, 3999, 0, ["yazıcı", "yazici", "deskjet", "deskjet yazıcı"]],
["hp-laserjet-yazici", "hp-laserjet-yazici", "HP", "LaserJet Yazıcı", "", "laptop", 3000, 4800, 0.6, 12, 6999, 0, ["laserjet", "laserjet yazıcı"]],
["canon-pixma-yazici", "canon-pixma-yazici", "Canon", "PIXMA Yazıcı", "", "laptop", 1500, 2500, 0.5, 12, 3999, 0, ["pixma", "pixma yazıcı", "canon"]],
["epson-ecotank-yazici", "epson-ecotank-yazici", "Epson", "EcoTank Yazıcı", "", "laptop", 4000, 6500, 0.6, 12, 8999, 0, ["ecotank", "epson", "ecotank yazıcı"]],
["apple-ipad-7-nesil-32-gb", "apple-ipad-7-nesil", "Apple", "iPad 7. Nesil 32 GB", "32 GB", "tablet", 6500, 9000, 0.7, 10, 0, 0, ["ipad 7", "ipad 7. nesil", "ipad 7. nesil 32 gb", "apple"]],
["apple-ipad-7-nesil-128-gb", "apple-ipad-7-nesil", "Apple", "iPad 7. Nesil 128 GB", "128 GB", "tablet", 6500, 9000, 0.7, 10, 0, 0, ["ipad 7", "ipad 7. nesil", "ipad 7. nesil 128 gb", "apple"]],
["apple-ipad-8-nesil-32-gb", "apple-ipad-8-nesil", "Apple", "iPad 8. Nesil 32 GB", "32 GB", "tablet", 7500, 10000, 0.8, 10, 0, 0, ["ipad 8", "ipad 8. nesil", "ipad 8. nesil 32 gb", "apple"]],
["apple-ipad-8-nesil-128-gb", "apple-ipad-8-nesil", "Apple", "iPad 8. Nesil 128 GB", "128 GB", "tablet", 7500, 10000, 0.8, 10, 0, 0, ["ipad 8", "ipad 8. nesil", "ipad 8. nesil 128 gb", "apple"]],
["apple-ipad-9-nesil-64-gb", "apple-ipad-9-nesil", "Apple", "iPad 9. Nesil 64 GB", "64 GB", "tablet", 10000, 13500, 0.9, 9, 0, 0, ["ipad 9", "ipad", "ipad 9. nesil", "ipad 9. nesil 64 gb", "apple"]],
["apple-ipad-9-nesil-256-gb", "apple-ipad-9-nesil", "Apple", "iPad 9. Nesil 256 GB", "256 GB", "tablet", 10900, 14700, 0.9, 9, 0, 0, ["ipad 9", "ipad", "ipad 9. nesil", "ipad 9. nesil 256 gb", "apple"]],
["apple-ipad-10-nesil-64-gb", "apple-ipad-10-nesil", "Apple", "iPad 10. Nesil 64 GB", "64 GB", "tablet", 13000, 17000, 1.0, 8, 21999, 0, ["ipad 10", "ipad 10. nesil", "ipad 10. nesil 64 gb", "apple"]],
["apple-ipad-10-nesil-256-gb", "apple-ipad-10-nesil", "Apple", "iPad 10. Nesil 256 GB", "256 GB", "tablet", 14200, 18500, 1.0, 8, 23999, 0, ["ipad 10", "ipad 10. nesil", "ipad 10. nesil 256 gb", "apple"]],
["apple-ipad-11-nesil-a16-128-gb", "apple-ipad-11-nesil-a16", "Apple", "iPad 11. Nesil (A16) 128 GB", "128 GB", "tablet", 17000, 21500, 1.1, 8, 24999, 1, ["ipad 11", "ipad 11. nesil (a16)", "ipad 11. nesil (a16) 128 gb", "apple"]],
["apple-ipad-11-nesil-a16-256-gb", "apple-ipad-11-nesil-a16", "Apple", "iPad 11. Nesil (A16) 256 GB", "256 GB", "tablet", 18500, 23400, 1.1, 8, 26999, 1, ["ipad 11", "ipad 11. nesil (a16)", "ipad 11. nesil (a16) 256 gb", "apple"]],
["apple-ipad-mini-6-64-gb", "apple-ipad-mini-6", "Apple", "iPad mini 6 64 GB", "64 GB", "tablet", 16000, 21000, 1.1, 8, 0, 0, ["ipad mini", "ipad mini 6", "ipad mini 6 64 gb", "apple"]],
["apple-ipad-mini-6-256-gb", "apple-ipad-mini-6", "Apple", "iPad mini 6 256 GB", "256 GB", "tablet", 17400, 22900, 1.1, 8, 0, 0, ["ipad mini", "ipad mini 6", "ipad mini 6 256 gb", "apple"]],
["apple-ipad-air-4-64-gb", "apple-ipad-air-4", "Apple", "iPad Air 4 64 GB", "64 GB", "tablet", 14000, 18500, 1.0, 9, 0, 0, ["air 4", "ipad air 4", "ipad air 4 64 gb", "apple"]],
["apple-ipad-air-4-256-gb", "apple-ipad-air-4", "Apple", "iPad Air 4 256 GB", "256 GB", "tablet", 15300, 20200, 1.0, 9, 0, 0, ["air 4", "ipad air 4", "ipad air 4 256 gb", "apple"]],
["apple-ipad-air-m1-64-gb", "apple-ipad-air-m1", "Apple", "iPad Air (M1) 64 GB", "64 GB", "tablet", 17000, 22000, 1.1, 8, 0, 0, ["ipad air", "ipad air (m1)", "ipad air (m1) 64 gb", "apple"]],
["apple-ipad-air-m1-256-gb", "apple-ipad-air-m1", "Apple", "iPad Air (M1) 256 GB", "256 GB", "tablet", 18500, 24000, 1.1, 8, 0, 0, ["ipad air", "ipad air (m1)", "ipad air (m1) 256 gb", "apple"]],
["apple-ipad-air-m2-128-gb", "apple-ipad-air-m2", "Apple", "iPad Air (M2) 128 GB", "128 GB", "tablet", 24000, 30000, 1.2, 8, 34999, 0, ["ipad air m2", "ipad air (m2)", "ipad air (m2) 128 gb", "apple"]],
["apple-ipad-air-m2-256-gb", "apple-ipad-air-m2", "Apple", "iPad Air (M2) 256 GB", "256 GB", "tablet", 26200, 32700, 1.2, 8, 37999, 0, ["ipad air m2", "ipad air (m2)", "ipad air (m2) 256 gb", "apple"]],
["apple-ipad-air-m3-128-gb", "apple-ipad-air-m3", "Apple", "iPad Air (M3) 128 GB", "128 GB", "tablet", 28000, 34500, 1.3, 8, 39999, 1, ["ipad air m3", "ipad air (m3)", "ipad air (m3) 128 gb", "apple"]],
["apple-ipad-air-m3-256-gb", "apple-ipad-air-m3", "Apple", "iPad Air (M3) 256 GB", "256 GB", "tablet", 30500, 37600, 1.3, 8, 43499, 1, ["ipad air m3", "ipad air (m3)", "ipad air (m3) 256 gb", "apple"]],
["apple-ipad-pro-11-m2-128-gb", "apple-ipad-pro-11-m2", "Apple", "iPad Pro 11 (M2) 128 GB", "128 GB", "tablet", 30000, 38000, 1.4, 8, 0, 0, ["ipad pro", "ipad pro 11 (m2)", "ipad pro 11 (m2) 128 gb", "apple"]],
["apple-ipad-pro-11-m2-256-gb", "apple-ipad-pro-11-m2", "Apple", "iPad Pro 11 (M2) 256 GB", "256 GB", "tablet", 32700, 41400, 1.4, 8, 0, 0, ["ipad pro", "ipad pro 11 (m2)", "ipad pro 11 (m2) 256 gb", "apple"]],
["apple-ipad-pro-11-m4-256-gb", "apple-ipad-pro-11-m4", "Apple", "iPad Pro 11 (M4) 256 GB", "256 GB", "tablet", 42500, 52300, 1.5, 8, 59999, 1, ["pro m4", "ipad pro 11 (m4)", "ipad pro 11 (m4) 256 gb", "apple"]],
["apple-ipad-pro-11-m4-512-gb", "apple-ipad-pro-11-m4", "Apple", "iPad Pro 11 (M4) 512 GB", "512 GB", "tablet", 46800, 57600, 1.5, 8, 65999, 1, ["pro m4", "ipad pro 11 (m4)", "ipad pro 11 (m4) 512 gb", "apple"]],
["samsung-galaxy-tab-a7-lite-32-gb", "samsung-galaxy-tab-a7-lite", "Samsung", "Galaxy Tab A7 Lite 32 GB", "32 GB", "tablet", 2800, 4000, 0.4, 11, 4999, 0, ["a7 lite", "galaxy tab a7 lite", "galaxy tab a7 lite 32 gb", "samsung"]],
["samsung-galaxy-tab-a8-32-gb", "samsung-galaxy-tab-a8", "Samsung", "Galaxy Tab A8 32 GB", "32 GB", "tablet", 4500, 6500, 0.5, 11, 0, 0, ["tab a8", "galaxy tab a8", "galaxy tab a8 32 gb", "samsung"]],
["samsung-galaxy-tab-a8-64-gb", "samsung-galaxy-tab-a8", "Samsung", "Galaxy Tab A8 64 GB", "64 GB", "tablet", 4500, 6500, 0.5, 11, 0, 0, ["tab a8", "galaxy tab a8", "galaxy tab a8 64 gb", "samsung"]],
["samsung-galaxy-tab-a9-64-gb", "samsung-galaxy-tab-a9", "Samsung", "Galaxy Tab A9 64 GB", "64 GB", "tablet", 6000, 8500, 0.6, 11, 9999, 0, ["tab a9", "galaxy tab a9", "galaxy tab a9 64 gb", "samsung"]],
["samsung-galaxy-tab-a9-128-gb", "samsung-galaxy-tab-a9", "Samsung", "Galaxy Tab A9 128 GB", "128 GB", "tablet", 6000, 8500, 0.6, 11, 9999, 0, ["tab a9", "galaxy tab a9", "galaxy tab a9 128 gb", "samsung"]],
["samsung-galaxy-tab-s6-lite-64-gb", "samsung-galaxy-tab-s6-lite", "Samsung", "Galaxy Tab S6 Lite 64 GB", "64 GB", "tablet", 6500, 9000, 0.6, 10, 11999, 0, ["s6 lite", "galaxy tab s6 lite", "galaxy tab s6 lite 64 gb", "samsung"]],
["samsung-galaxy-tab-s6-lite-128-gb", "samsung-galaxy-tab-s6-lite", "Samsung", "Galaxy Tab S6 Lite 128 GB", "128 GB", "tablet", 6500, 9000, 0.6, 10, 11999, 0, ["s6 lite", "galaxy tab s6 lite", "galaxy tab s6 lite 128 gb", "samsung"]],
["samsung-galaxy-tab-s8-128-gb", "samsung-galaxy-tab-s8", "Samsung", "Galaxy Tab S8 128 GB", "128 GB", "tablet", 16000, 21000, 1.0, 9, 0, 0, ["tab s8", "galaxy tab s8", "galaxy tab s8 128 gb", "samsung"]],
["samsung-galaxy-tab-s8-256-gb", "samsung-galaxy-tab-s8", "Samsung", "Galaxy Tab S8 256 GB", "256 GB", "tablet", 17400, 22900, 1.0, 9, 0, 0, ["tab s8", "galaxy tab s8", "galaxy tab s8 256 gb", "samsung"]],
["samsung-galaxy-tab-s9-128-gb", "samsung-galaxy-tab-s9", "Samsung", "Galaxy Tab S9 128 GB", "128 GB", "tablet", 20000, 26000, 1.1, 9, 32999, 0, ["tab s9", "galaxy tab s9", "galaxy tab s9 128 gb", "samsung"]],
["samsung-galaxy-tab-s9-256-gb", "samsung-galaxy-tab-s9", "Samsung", "Galaxy Tab S9 256 GB", "256 GB", "tablet", 21800, 28300, 1.1, 9, 35999, 0, ["tab s9", "galaxy tab s9", "galaxy tab s9 256 gb", "samsung"]],
["samsung-galaxy-tab-s9-fe-128-gb", "samsung-galaxy-tab-s9-fe", "Samsung", "Galaxy Tab S9 FE 128 GB", "128 GB", "tablet", 13000, 17000, 0.9, 9, 21999, 0, ["s9 fe", "galaxy tab s9 fe", "galaxy tab s9 fe 128 gb", "samsung"]],
["samsung-galaxy-tab-s9-fe-256-gb", "samsung-galaxy-tab-s9-fe", "Samsung", "Galaxy Tab S9 FE 256 GB", "256 GB", "tablet", 14200, 18500, 0.9, 9, 23999, 0, ["s9 fe", "galaxy tab s9 fe", "galaxy tab s9 fe 256 gb", "samsung"]],
["samsung-galaxy-tab-s10-256-gb", "samsung-galaxy-tab-s10", "Samsung", "Galaxy Tab S10 256 GB", "256 GB", "tablet", 29400, 37100, 1.2, 9, 43499, 1, ["tab s10", "galaxy tab s10", "galaxy tab s10 256 gb", "samsung"]],
["xiaomi-pad-6-128-gb", "xiaomi-pad-6", "Xiaomi", "Pad 6 128 GB", "128 GB", "tablet", 10000, 13500, 0.8, 10, 16999, 0, ["xiaomi pad", "pad 6", "pad 6 128 gb", "xiaomi"]],
["xiaomi-pad-6-256-gb", "xiaomi-pad-6", "Xiaomi", "Pad 6 256 GB", "256 GB", "tablet", 10900, 14700, 0.8, 10, 18499, 0, ["xiaomi pad", "pad 6", "pad 6 256 gb", "xiaomi"]],
["xiaomi-redmi-pad-se-128-gb", "xiaomi-redmi-pad-se", "Xiaomi", "Redmi Pad SE 128 GB", "128 GB", "tablet", 5500, 7800, 0.6, 10, 9499, 0, ["redmi pad", "redmi pad se", "redmi pad se 128 gb", "xiaomi"]],
["huawei-matepad-11-128-gb", "huawei-matepad-11", "Huawei", "MatePad 11 128 GB", "128 GB", "tablet", 9000, 12000, 0.7, 10, 14999, 0, ["matepad", "matepad 11", "matepad 11 128 gb", "huawei"]],
["honor-pad-x9-128-gb", "honor-pad-x9", "Honor", "Pad X9 128 GB", "128 GB", "tablet", 6000, 8500, 0.6, 10, 10999, 0, ["honor pad", "pad x9", "pad x9 128 gb", "honor"]],
["lenovo-tab-m10-64-gb", "lenovo-tab-m10", "Lenovo", "Tab M10 64 GB", "64 GB", "tablet", 4000, 6000, 0.5, 12, 7999, 0, ["tab m10", "lenovo tab", "tab m10 64 gb", "lenovo"]],
["sony-playstation-5", "sony-playstation-5", "Sony", "PlayStation 5", "", "console", 23000, 29000, 1.0, 5, 34999, 0, ["ps5", "playstation 5", "sony"]],
["sony-ps5-digital", "sony-ps5-digital", "Sony", "PS5 Digital", "", "console", 20000, 25000, 1.0, 5, 32999, 0, ["ps5 digital", "sony"]],
["sony-ps5-slim", "sony-ps5-slim", "Sony", "PS5 Slim", "", "console", 25000, 31000, 1.0, 5, 34999, 0, ["ps5 slim", "sony"]],
["sony-ps5-pro", "sony-ps5-pro", "Sony", "PS5 Pro", "", "console", 34000, 42000, 1.1, 6, 59999, 1, ["ps5 pro", "sony"]],
["sony-ps4-slim-500-gb", "sony-ps4-slim", "Sony", "PS4 Slim 500 GB", "500 GB", "console", 8500, 11500, 0.8, 8, 0, 0, ["ps4", "playstation 4", "ps4 slim", "ps4 slim 500 gb", "sony"]],
["sony-ps4-slim-1-tb", "sony-ps4-slim", "Sony", "PS4 Slim 1 TB", "1 TB", "console", 9500, 12900, 0.8, 8, 0, 0, ["ps4", "playstation 4", "ps4 slim", "ps4 slim 1 tb", "sony"]],
["sony-ps4-pro-1-tb", "sony-ps4-pro", "Sony", "PS4 Pro 1 TB", "1 TB", "console", 12300, 15700, 0.8, 8, 0, 0, ["ps4 pro", "ps4 pro 1 tb", "sony"]],
["sony-playstation-portal", "sony-playstation-portal", "Sony", "PlayStation Portal", "", "console", 7500, 10000, 0.8, 7, 11999, 0, ["portal", "playstation portal", "sony"]],
["sony-psvr2", "sony-psvr2", "Sony", "PSVR2", "", "console", 13000, 17000, 1.0, 9, 21999, 0, ["psvr", "psvr2", "sony"]],
["microsoft-xbox-series-s-512-gb", "microsoft-xbox-series-s", "Microsoft", "Xbox Series S 512 GB", "512 GB", "console", 11800, 15100, 0.9, 9, 18999, 0, ["series s", "xbox", "xbox series s", "xbox series s 512 gb", "microsoft"]],
["microsoft-xbox-series-s-1-tb", "microsoft-xbox-series-s", "Microsoft", "Xbox Series S 1 TB", "1 TB", "console", 11800, 15100, 0.9, 9, 18999, 0, ["series s", "xbox", "xbox series s", "xbox series s 1 tb", "microsoft"]],
["microsoft-xbox-series-x-1-tb", "microsoft-xbox-series-x", "Microsoft", "Xbox Series X 1 TB", "1 TB", "console", 22400, 28000, 1.0, 8, 33499, 0, ["series x", "xbox series x", "xbox series x 1 tb", "microsoft"]],
["microsoft-xbox-one-s", "microsoft-xbox-one-s", "Microsoft", "Xbox One S", "", "console", 6000, 8500, 0.7, 10, 0, 0, ["xbox one", "xbox one s", "microsoft"]],
["microsoft-xbox-one-x", "microsoft-xbox-one-x", "Microsoft", "Xbox One X", "", "console", 8000, 11000, 0.75, 10, 0, 0, ["one x", "xbox one x", "microsoft"]],
["nintendo-switch", "nintendo-switch", "Nintendo", "Switch", "", "console", 10000, 13000, 0.8, 7, 14999, 0, ["switch", "nintendo"]],
["nintendo-switch-oled", "nintendo-switch-oled", "Nintendo", "Switch OLED", "", "console", 13000, 16000, 0.9, 7, 18999, 0, ["switch oled", "nintendo"]],
["nintendo-switch-lite", "nintendo-switch-lite", "Nintendo", "Switch Lite", "", "console", 7000, 9500, 0.7, 8, 10999, 0, ["switch lite", "nintendo"]],
["nintendo-switch-2", "nintendo-switch-2", "Nintendo", "Switch 2", "", "console", 18000, 22500, 1.0, 5, 24999, 1, ["switch 2", "nintendo"]],
["valve-steam-deck-lcd", "valve-steam-deck-lcd", "Valve", "Steam Deck LCD", "", "console", 18000, 23000, 0.9, 7, 0, 0, ["steam deck", "steam deck lcd", "valve"]],
["valve-steam-deck-oled", "valve-steam-deck-oled", "Valve", "Steam Deck OLED", "", "console", 24000, 30000, 1.0, 7, 32999, 1, ["deck oled", "steam deck oled", "valve"]],
["meta-quest-2-128-gb", "meta-quest-2", "Meta", "Quest 2 128 GB", "128 GB", "console", 7500, 10000, 0.8, 8, 0, 0, ["quest 2", "oculus", "quest 2 128 gb", "meta"]],
["meta-quest-2-256-gb", "meta-quest-2", "Meta", "Quest 2 256 GB", "256 GB", "console", 8200, 11000, 0.8, 8, 0, 0, ["quest 2", "oculus", "quest 2 256 gb", "meta"]],
["meta-quest-3-128-gb", "meta-quest-3", "Meta", "Quest 3 128 GB", "128 GB", "console", 16000, 20500, 1.0, 7, 24999, 1, ["quest 3", "quest 3 128 gb", "meta"]],
["meta-quest-3-512-gb", "meta-quest-3", "Meta", "Quest 3 512 GB", "512 GB", "console", 17900, 23000, 1.0, 7, 27999, 1, ["quest 3", "quest 3 512 gb", "meta"]],
["meta-quest-3s-128-gb", "meta-quest-3s", "Meta", "Quest 3S 128 GB", "128 GB", "console", 11000, 14000, 0.9, 7, 16999, 1, ["quest 3s", "quest 3s 128 gb", "meta"]],
["apple-watch-se-1-nesil-40mm", "apple-watch-se-1-nesil", "Apple", "Watch SE (1. Nesil) 40mm", "40mm", "watch", 4500, 6500, 0.7, 8, 0, 0, ["se 1", "watch se (1. nesil)", "watch se (1. nesil) 40mm", "apple"]],
["apple-watch-se-1-nesil-44mm", "apple-watch-se-1-nesil", "Apple", "Watch SE (1. Nesil) 44mm", "44mm", "watch", 4900, 7000, 0.7, 8, 0, 0, ["se 1", "watch se (1. nesil)", "watch se (1. nesil) 44mm", "apple"]],
["apple-watch-se-2-nesil-40mm", "apple-watch-se-2-nesil", "Apple", "Watch SE (2. Nesil) 40mm", "40mm", "watch", 7000, 9500, 0.8, 7, 11999, 0, ["watch se", "watch se (2. nesil)", "watch se (2. nesil) 40mm", "apple"]],
["apple-watch-se-2-nesil-44mm", "apple-watch-se-2-nesil", "Apple", "Watch SE (2. Nesil) 44mm", "44mm", "watch", 7600, 10300, 0.8, 7, 12999, 0, ["watch se", "watch se (2. nesil)", "watch se (2. nesil) 44mm", "apple"]],
["apple-watch-series-6-40mm", "apple-watch-series-6", "Apple", "Watch Series 6 40mm", "40mm", "watch", 6000, 8500, 0.8, 8, 0, 0, ["series 6", "watch series 6", "watch series 6 40mm", "apple"]],
["apple-watch-series-6-44mm", "apple-watch-series-6", "Apple", "Watch Series 6 44mm", "44mm", "watch", 6500, 9200, 0.8, 8, 0, 0, ["series 6", "watch series 6", "watch series 6 44mm", "apple"]],
["apple-watch-series-7-41mm", "apple-watch-series-7", "Apple", "Watch Series 7 41mm", "41mm", "watch", 8000, 11000, 0.9, 7, 0, 0, ["watch 7", "watch series 7", "watch series 7 41mm", "apple"]],
["apple-watch-series-7-45mm", "apple-watch-series-7", "Apple", "Watch Series 7 45mm", "45mm", "watch", 8600, 11900, 0.9, 7, 0, 0, ["watch 7", "watch series 7", "watch series 7 45mm", "apple"]],
["apple-watch-series-8-41mm", "apple-watch-series-8", "Apple", "Watch Series 8 41mm", "41mm", "watch", 10000, 13500, 0.9, 6, 0, 0, ["watch 8", "watch series 8", "watch series 8 41mm", "apple"]],
["apple-watch-series-8-45mm", "apple-watch-series-8", "Apple", "Watch Series 8 45mm", "45mm", "watch", 10800, 14600, 0.9, 6, 0, 0, ["watch 8", "watch series 8", "watch series 8 45mm", "apple"]],
["apple-watch-series-9-41mm", "apple-watch-series-9", "Apple", "Watch Series 9 41mm", "41mm", "watch", 12000, 16000, 1.0, 6, 17999, 0, ["watch 9", "watch series 9", "watch series 9 41mm", "apple"]],
["apple-watch-series-9-45mm", "apple-watch-series-9", "Apple", "Watch Series 9 45mm", "45mm", "watch", 13000, 17300, 1.0, 6, 19499, 0, ["watch 9", "watch series 9", "watch series 9 45mm", "apple"]],
["apple-watch-series-10-42mm", "apple-watch-series-10", "Apple", "Watch Series 10 42mm", "42mm", "watch", 11900, 15300, 1.1, 6, 16999, 1, ["watch 10", "series 10", "watch series 10", "watch series 10 42mm", "apple"]],
["apple-watch-series-10-46mm", "apple-watch-series-10", "Apple", "Watch Series 10 46mm", "46mm", "watch", 12900, 16600, 1.1, 6, 18499, 1, ["watch 10", "series 10", "watch series 10", "watch series 10 46mm", "apple"]],
["apple-watch-ultra-2-49mm", "apple-watch-ultra-2", "Apple", "Watch Ultra 2 49mm", "49mm", "watch", 24000, 30000, 1.3, 6, 0, 0, ["ultra 2", "watch ultra 2", "watch ultra 2 49mm", "apple"]],
["apple-watch-ultra-3-49mm", "apple-watch-ultra-3", "Apple", "Watch Ultra 3 49mm", "49mm", "watch", 28000, 35000, 1.4, 6, 39999, 1, ["ultra 3", "watch ultra 3", "watch ultra 3 49mm", "apple"]],
["samsung-galaxy-watch-4-40mm", "samsung-galaxy-watch-4", "Samsung", "Galaxy Watch 4 40mm", "40mm", "watch", 4000, 6000, 0.6, 10, 0, 0, ["watch 4", "galaxy watch 4", "galaxy watch 4 40mm", "samsung"]],
["samsung-galaxy-watch-4-44mm", "samsung-galaxy-watch-4", "Samsung", "Galaxy Watch 4 44mm", "44mm", "watch", 4300, 6500, 0.6, 10, 0, 0, ["watch 4", "galaxy watch 4", "galaxy watch 4 44mm", "samsung"]],
["samsung-galaxy-watch-5-40mm", "samsung-galaxy-watch-5", "Samsung", "Galaxy Watch 5 40mm", "40mm", "watch", 5000, 7000, 0.7, 9, 0, 0, ["watch 5", "galaxy watch 5", "galaxy watch 5 40mm", "samsung"]],
["samsung-galaxy-watch-5-44mm", "samsung-galaxy-watch-5", "Samsung", "Galaxy Watch 5 44mm", "44mm", "watch", 5400, 7600, 0.7, 9, 0, 0, ["watch 5", "galaxy watch 5", "galaxy watch 5 44mm", "samsung"]],
["samsung-galaxy-watch-5-pro-45mm", "samsung-galaxy-watch-5-pro", "Samsung", "Galaxy Watch 5 Pro 45mm", "45mm", "watch", 7600, 10300, 0.8, 9, 0, 0, ["watch 5 pro", "galaxy watch 5 pro", "galaxy watch 5 pro 45mm", "samsung"]],
["samsung-galaxy-watch-6-40mm", "samsung-galaxy-watch-6", "Samsung", "Galaxy Watch 6 40mm", "40mm", "watch", 6500, 9000, 0.8, 9, 11999, 0, ["galaxy watch", "galaxy watch 6", "galaxy watch 6 40mm", "samsung"]],
["samsung-galaxy-watch-6-44mm", "samsung-galaxy-watch-6", "Samsung", "Galaxy Watch 6 44mm", "44mm", "watch", 7000, 9700, 0.8, 9, 12999, 0, ["galaxy watch", "galaxy watch 6", "galaxy watch 6 44mm", "samsung"]],
["samsung-galaxy-watch-6-classic-43mm", "samsung-galaxy-watch-6-classic", "Samsung", "Galaxy Watch 6 Classic 43mm", "43mm", "watch", 8000, 11000, 0.9, 9, 14999, 0, ["6 classic", "galaxy watch 6 classic", "galaxy watch 6 classic 43mm", "samsung"]],
["samsung-galaxy-watch-6-classic-47mm", "samsung-galaxy-watch-6-classic", "Samsung", "Galaxy Watch 6 Classic 47mm", "47mm", "watch", 8600, 11900, 0.9, 9, 15999, 0, ["6 classic", "galaxy watch 6 classic", "galaxy watch 6 classic 47mm", "samsung"]],
["samsung-galaxy-watch-7-40mm", "samsung-galaxy-watch-7", "Samsung", "Galaxy Watch 7 40mm", "40mm", "watch", 8000, 11000, 0.9, 8, 13999, 1, ["galaxy watch 7", "galaxy watch 7 40mm", "samsung"]],
["samsung-galaxy-watch-7-44mm", "samsung-galaxy-watch-7", "Samsung", "Galaxy Watch 7 44mm", "44mm", "watch", 8600, 11900, 0.9, 8, 14999, 1, ["galaxy watch 7", "galaxy watch 7 44mm", "samsung"]],
["huawei-watch-gt3-46mm", "huawei-watch-gt3", "Huawei", "Watch GT3 46mm", "46mm", "watch", 4900, 7000, 0.7, 9, 0, 0, ["gt3", "watch gt3", "watch gt3 46mm", "huawei"]],
["huawei-watch-gt4-41mm", "huawei-watch-gt4", "Huawei", "Watch GT4 41mm", "41mm", "watch", 6000, 8500, 0.7, 9, 9999, 0, ["gt4", "watch gt4", "watch gt4 41mm", "huawei"]],
["huawei-watch-gt4-46mm", "huawei-watch-gt4", "Huawei", "Watch GT4 46mm", "46mm", "watch", 6500, 9200, 0.7, 9, 10999, 0, ["gt4", "watch gt4", "watch gt4 46mm", "huawei"]],
["huawei-watch-fit-3", "huawei-watch-fit-3", "Huawei", "Watch Fit 3", "", "watch", 3000, 4500, 0.6, 9, 5999, 0, ["watch fit", "watch fit 3", "huawei"]],
["amazfit-gts-4", "amazfit-gts-4", "Amazfit", "GTS 4", "", "watch", 4000, 6000, 0.6, 10, 6999, 0, ["amazfit", "gts", "gts 4"]],
["amazfit-bip-u-pro", "amazfit-bip-u-pro", "Amazfit", "Bip U Pro", "", "watch", 1200, 2000, 0.4, 10, 2999, 0, ["bip", "bip u pro", "amazfit"]],
["amazfit-t-rex-2", "amazfit-t-rex-2", "Amazfit", "T-Rex 2", "", "watch", 4500, 6500, 0.7, 10, 7999, 0, ["t-rex", "t-rex 2", "amazfit"]],
["xiaomi-mi-band-7", "xiaomi-mi-band-7", "Xiaomi", "Mi Band 7", "", "watch", 500, 900, 0.35, 9, 0, 0, ["mi band 7", "xiaomi"]],
["xiaomi-mi-band-8", "xiaomi-mi-band-8", "Xiaomi", "Mi Band 8", "", "watch", 800, 1300, 0.4, 9, 1999, 0, ["mi band", "miband", "mi band 8", "xiaomi"]],
["xiaomi-mi-band-9", "xiaomi-mi-band-9", "Xiaomi", "Mi Band 9", "", "watch", 1100, 1700, 0.45, 9, 2499, 1, ["mi band 9", "xiaomi"]],
["huawei-band-8", "huawei-band-8", "Huawei", "Band 8", "", "watch", 800, 1300, 0.4, 9, 1999, 0, ["huawei band", "band 8", "huawei"]],
["huawei-band-9", "huawei-band-9", "Huawei", "Band 9", "", "watch", 1100, 1700, 0.45, 9, 2499, 1, ["band 9", "huawei"]],
["apple-airpods-2", "apple-airpods-2", "Apple", "AirPods 2", "", "headphone", 2800, 4000, 0.8, 8, 0, 0, ["airpods 2", "apple"]],
["apple-airpods-3", "apple-airpods-3", "Apple", "AirPods 3", "", "headphone", 3800, 5200, 0.8, 8, 0, 0, ["airpods 3", "apple"]],
["apple-airpods-4", "apple-airpods-4", "Apple", "AirPods 4", "", "headphone", 4500, 5800, 0.8, 8, 6499, 1, ["airpods 4", "apple"]],
["apple-airpods-pro-2", "apple-airpods-pro-2", "Apple", "AirPods Pro 2", "", "headphone", 5500, 7500, 0.8, 8, 12999, 0, ["airpods pro 2", "apple"]],
["apple-airpods-pro-3", "apple-airpods-pro-3", "Apple", "AirPods Pro 3", "", "headphone", 8000, 10500, 1.0, 8, 11999, 1, ["airpods pro 3", "apple"]],
["apple-airpods-max", "apple-airpods-max", "Apple", "AirPods Max", "", "headphone", 14000, 18000, 1.0, 8, 24999, 0, ["airpods max", "apple"]],
["samsung-galaxy-buds-2", "samsung-galaxy-buds-2", "Samsung", "Galaxy Buds 2", "", "headphone", 2500, 3700, 0.8, 8, 4499, 0, ["galaxy buds 2", "samsung"]],
["samsung-galaxy-buds-2-pro", "samsung-galaxy-buds-2-pro", "Samsung", "Galaxy Buds 2 Pro", "", "headphone", 4000, 5500, 0.8, 8, 7499, 0, ["galaxy buds 2 pro", "samsung"]],
["samsung-galaxy-buds-fe", "samsung-galaxy-buds-fe", "Samsung", "Galaxy Buds FE", "", "headphone", 2200, 3200, 0.8, 8, 4499, 0, ["galaxy buds fe", "samsung"]],
["samsung-galaxy-buds-3", "samsung-galaxy-buds-3", "Samsung", "Galaxy Buds 3", "", "headphone", 4200, 5800, 0.8, 8, 5999, 1, ["galaxy buds 3", "samsung"]],
["samsung-galaxy-buds-3-pro", "samsung-galaxy-buds-3-pro", "Samsung", "Galaxy Buds 3 Pro", "", "headphone", 5600, 7200, 1.0, 8, 7999, 1, ["galaxy buds 3 pro", "samsung"]],
["sony-wh-1000xm4", "sony-wh-1000xm4", "Sony", "WH-1000XM4", "", "headphone", 6000, 8500, 1.0, 8, 9999, 0, ["wh-1000xm4", "sony"]],
["sony-wh-1000xm5", "sony-wh-1000xm5", "Sony", "WH-1000XM5", "", "headphone", 9000, 12500, 1.0, 8, 15999, 0, ["wh-1000xm5", "sony"]],
["sony-wh-1000xm6", "sony-wh-1000xm6", "Sony", "WH-1000XM6", "", "headphone", 13000, 17000, 1.0, 8, 19999, 1, ["wh-1000xm6", "sony"]],
["sony-wf-1000xm4", "sony-wf-1000xm4", "Sony", "WF-1000XM4", "", "headphone", 5000, 7000, 0.8, 8, 8999, 0, ["wf-1000xm4", "sony"]],
["sony-wh-ch520", "sony-wh-ch520", "Sony", "WH-CH520", "", "headphone", 1400, 2200, 0.5, 10, 2999, 0, ["wh-ch520", "sony"]],
["sony-srs-xb100-hoparlor", "sony-srs-xb100-hoparlor", "Sony", "SRS-XB100 Hoparlör", "", "headphone", 1500, 2400, 0.5, 10, 3499, 0, ["srs-xb100", "srs-xb100 hoparlör", "sony"]],
["jbl-tune-510bt", "jbl-tune-510bt", "JBL", "Tune 510BT", "", "headphone", 1000, 1700, 0.5, 10, 1999, 0, ["tune 510bt", "jbl"]],
["jbl-tune-520bt", "jbl-tune-520bt", "JBL", "Tune 520BT", "", "headphone", 1300, 2000, 0.5, 10, 2499, 0, ["tune 520bt", "jbl"]],
["jbl-tune-760nc", "jbl-tune-760nc", "JBL", "Tune 760NC", "", "headphone", 2200, 3300, 0.8, 8, 4499, 0, ["tune 760nc", "jbl"]],
["jbl-live-660nc", "jbl-live-660nc", "JBL", "Live 660NC", "", "headphone", 2800, 4000, 0.8, 8, 4999, 0, ["live 660nc", "jbl"]],
["jbl-go-3-hoparlor", "jbl-go-3-hoparlor", "JBL", "Go 3 Hoparlör", "", "headphone", 900, 1500, 0.5, 10, 1999, 0, ["go 3", "go 3 hoparlör", "jbl"]],
["jbl-flip-5-hoparlor", "jbl-flip-5-hoparlor", "JBL", "Flip 5 Hoparlör", "", "headphone", 2500, 3700, 0.8, 8, 0, 0, ["flip 5", "flip 5 hoparlör", "jbl"]],
["jbl-flip-6-hoparlor", "jbl-flip-6-hoparlor", "JBL", "Flip 6 Hoparlör", "", "headphone", 3200, 4600, 0.8, 8, 5999, 0, ["flip 6", "flip 6 hoparlör", "jbl"]],
["jbl-charge-5-hoparlor", "jbl-charge-5-hoparlor", "JBL", "Charge 5 Hoparlör", "", "headphone", 4500, 6500, 0.8, 8, 8499, 0, ["charge 5", "charge 5 hoparlör", "jbl"]],
["jbl-boombox-3-hoparlor", "jbl-boombox-3-hoparlor", "JBL", "Boombox 3 Hoparlör", "", "headphone", 10000, 14000, 1.0, 8, 18999, 0, ["boombox 3", "boombox 3 hoparlör", "jbl"]],
["beats-studio-buds", "beats-studio-buds", "Beats", "Studio Buds", "", "headphone", 3500, 5000, 0.8, 8, 6999, 0, ["studio buds", "beats"]],
["xiaomi-redmi-buds-4", "xiaomi-redmi-buds-4", "Xiaomi", "Redmi Buds 4", "", "headphone", 700, 1100, 0.3, 10, 1499, 0, ["redmi buds 4", "xiaomi"]],
["xiaomi-redmi-buds-5", "xiaomi-redmi-buds-5", "Xiaomi", "Redmi Buds 5", "", "headphone", 900, 1400, 0.5, 10, 1999, 0, ["redmi buds 5", "xiaomi"]],
["anker-soundcore-q30", "anker-soundcore-q30", "Anker", "Soundcore Q30", "", "headphone", 1500, 2400, 0.5, 10, 2999, 0, ["soundcore q30", "anker"]],
["anker-soundcore-motionplus", "anker-soundcore-motionplus", "Anker", "Soundcore Motion+", "", "headphone", 2800, 4200, 0.8, 8, 5499, 0, ["soundcore motion+", "anker"]],
["qcy-t13", "qcy-t13", "QCY", "T13", "", "headphone", 400, 700, 0.3, 10, 999, 0, ["t13", "qcy"]],
["qcy-t17", "qcy-t17", "QCY", "T17", "", "headphone", 400, 800, 0.3, 10, 999, 0, ["t17", "qcy"]],
["haylou-gt7", "haylou-gt7", "Haylou", "GT7", "", "headphone", 400, 700, 0.3, 10, 999, 0, ["gt7", "haylou"]],
["haylou-x1", "haylou-x1", "Haylou", "X1", "", "headphone", 500, 800, 0.3, 10, 999, 0, ["x1", "haylou"]],
["lenovo-lp40-pro", "lenovo-lp40-pro", "Lenovo", "LP40 Pro", "", "headphone", 300, 600, 0.3, 10, 999, 0, ["lp40 pro", "lenovo"]],
["huawei-freebuds-se", "huawei-freebuds-se", "Huawei", "FreeBuds SE", "", "headphone", 700, 1100, 0.3, 10, 1499, 0, ["freebuds se", "huawei"]],
["huawei-freebuds-5i", "huawei-freebuds-5i", "Huawei", "FreeBuds 5i", "", "headphone", 1300, 2000, 0.5, 10, 2999, 0, ["freebuds 5i", "huawei"]],
["edifier-w820nb", "edifier-w820nb", "Edifier", "W820NB", "", "headphone", 1400, 2200, 0.5, 10, 2999, 0, ["w820nb", "edifier"]],
["marshall-emberton-ii-hoparlor", "marshall-emberton-ii-hoparlor", "Marshall", "Emberton II Hoparlör", "", "headphone", 4500, 6500, 0.8, 8, 8999, 0, ["emberton ii", "emberton ii hoparlör", "marshall"]],
["samsung-hw-b550-soundbar", "samsung-hw-b550-soundbar", "Samsung", "HW-B550 Soundbar", "", "headphone", 4500, 6500, 0.8, 8, 8999, 0, ["hw-b550", "hw-b550 soundbar", "samsung"]],
["samsung-hw-q600-soundbar", "samsung-hw-q600-soundbar", "Samsung", "HW-Q600 Soundbar", "", "headphone", 8000, 11500, 1.0, 8, 14999, 0, ["hw-q600", "hw-q600 soundbar", "samsung"]],
["lg-sn5-soundbar", "lg-sn5-soundbar", "LG", "SN5 Soundbar", "", "headphone", 4500, 6500, 0.8, 8, 8499, 0, ["sn5", "sn5 soundbar"]],
["sony-ht-s350-soundbar", "sony-ht-s350-soundbar", "Sony", "HT-S350 Soundbar", "", "headphone", 5500, 8000, 1.0, 8, 10999, 0, ["ht-s350", "ht-s350 soundbar", "sony"]],
["jbl-bar-2-0-soundbar", "jbl-bar-2-0-soundbar", "JBL", "Bar 2.0 Soundbar", "", "headphone", 3500, 5200, 0.8, 8, 6999, 0, ["bar 2.0", "bar 2.0 soundbar", "jbl"]],
["philips-tab5305-soundbar", "philips-tab5305-soundbar", "Philips", "TAB5305 Soundbar", "", "headphone", 2200, 3300, 0.8, 8, 4499, 0, ["tab5305", "tab5305 soundbar", "philips"]],
["canon-eos-4000d-18-55-kit", "canon-eos-4000d", "Canon", "EOS 4000D 18-55 Kit", "18-55 Kit", "camera", 7500, 10500, 0.9, 10, 13999, 0, ["eos 4000d", "eos 4000d 18-55 kit", "canon"]],
["canon-eos-2000d-18-55-kit", "canon-eos-2000d", "Canon", "EOS 2000D 18-55 Kit", "18-55 Kit", "camera", 9000, 12500, 0.9, 10, 16999, 0, ["eos 2000d", "eos 2000d 18-55 kit", "canon"]],
["canon-eos-250d-18-55-kit", "canon-eos-250d", "Canon", "EOS 250D 18-55 Kit", "18-55 Kit", "camera", 13000, 17000, 0.9, 10, 24999, 0, ["eos 250d", "eos 250d 18-55 kit", "canon"]],
["canon-eos-250d-govde", "canon-eos-250d", "Canon", "EOS 250D Gövde", "Gövde", "camera", 11400, 15000, 0.9, 10, 21999, 0, ["eos 250d", "eos 250d gövde", "canon"]],
["canon-eos-700d-18-55-kit", "canon-eos-700d", "Canon", "EOS 700D 18-55 Kit", "18-55 Kit", "camera", 8000, 11000, 0.9, 10, 0, 0, ["eos 700d", "eos 700d 18-55 kit", "canon"]],
["canon-eos-700d-govde", "canon-eos-700d", "Canon", "EOS 700D Gövde", "Gövde", "camera", 7000, 9700, 0.9, 10, 0, 0, ["eos 700d", "eos 700d gövde", "canon"]],
["canon-eos-m50-15-45-kit", "canon-eos-m50", "Canon", "EOS M50 15-45 Kit", "15-45 Kit", "camera", 15000, 20000, 0.9, 10, 0, 0, ["eos m50", "eos m50 15-45 kit", "canon"]],
["canon-eos-r50-18-45-kit", "canon-eos-r50", "Canon", "EOS R50 18-45 Kit", "18-45 Kit", "camera", 24000, 30000, 0.9, 10, 37999, 1, ["eos r50", "eos r50 18-45 kit", "canon"]],
["canon-eos-r50-govde", "canon-eos-r50", "Canon", "EOS R50 Gövde", "Gövde", "camera", 21100, 26400, 0.9, 10, 33499, 1, ["eos r50", "eos r50 gövde", "canon"]],
["canon-eos-r8-govde", "canon-eos-r8", "Canon", "EOS R8 Gövde", "Gövde", "camera", 35200, 43100, 1.0, 10, 48499, 1, ["eos r8", "eos r8 gövde", "canon"]],
["nikon-d3500-18-55-kit", "nikon-d3500", "Nikon", "D3500 18-55 Kit", "18-55 Kit", "camera", 10000, 13500, 0.9, 10, 0, 0, ["d3500", "d3500 18-55 kit", "nikon"]],
["nikon-d5600-18-55-kit", "nikon-d5600", "Nikon", "D5600 18-55 Kit", "18-55 Kit", "camera", 14000, 18500, 0.9, 10, 0, 0, ["d5600", "d5600 18-55 kit", "nikon"]],
["nikon-d5600-govde", "nikon-d5600", "Nikon", "D5600 Gövde", "Gövde", "camera", 12300, 16300, 0.9, 10, 0, 0, ["d5600", "d5600 gövde", "nikon"]],
["nikon-d7200-govde", "nikon-d7200", "Nikon", "D7200 Gövde", "Gövde", "camera", 11400, 15400, 0.9, 10, 0, 0, ["d7200", "d7200 gövde", "nikon"]],
["nikon-z50-16-50-kit", "nikon-z50", "Nikon", "Z50 16-50 Kit", "16-50 Kit", "camera", 22000, 28000, 0.9, 10, 34999, 0, ["z50", "z50 16-50 kit", "nikon"]],
["nikon-z50-govde", "nikon-z50", "Nikon", "Z50 Gövde", "Gövde", "camera", 19400, 24600, 0.9, 10, 30999, 0, ["z50", "z50 gövde", "nikon"]],
["sony-a6000-16-50-kit", "sony-a6000", "Sony", "A6000 16-50 Kit", "16-50 Kit", "camera", 11000, 15000, 0.9, 10, 0, 0, ["a6000", "a6000 16-50 kit", "sony"]],
["sony-a6000-govde", "sony-a6000", "Sony", "A6000 Gövde", "Gövde", "camera", 9700, 13200, 0.9, 10, 0, 0, ["a6000", "a6000 gövde", "sony"]],
["sony-a6100-16-50-kit", "sony-a6100", "Sony", "A6100 16-50 Kit", "16-50 Kit", "camera", 16000, 21000, 0.9, 10, 0, 0, ["a6100", "a6100 16-50 kit", "sony"]],
["sony-a6400-16-50-kit", "sony-a6400", "Sony", "A6400 16-50 Kit", "16-50 Kit", "camera", 22000, 28000, 0.9, 10, 34999, 0, ["a6400", "a6400 16-50 kit", "sony"]],
["sony-a6400-govde", "sony-a6400", "Sony", "A6400 Gövde", "Gövde", "camera", 19400, 24600, 0.9, 10, 30999, 0, ["a6400", "a6400 gövde", "sony"]],
["sony-zv-e10-16-50-kit", "sony-zv-e10", "Sony", "ZV-E10 16-50 Kit", "16-50 Kit", "camera", 21000, 27000, 0.9, 10, 0, 0, ["zv-e10", "zv-e10 16-50 kit", "sony"]],
["sony-zv-e10-govde", "sony-zv-e10", "Sony", "ZV-E10 Gövde", "Gövde", "camera", 18500, 23800, 0.9, 10, 0, 0, ["zv-e10", "zv-e10 gövde", "sony"]],
["sony-zv-e10-ii-16-50-kit", "sony-zv-e10-ii", "Sony", "ZV-E10 II 16-50 Kit", "16-50 Kit", "camera", 30000, 37000, 1.0, 10, 41999, 1, ["zv-e10 ii", "zv-e10 ii 16-50 kit", "sony"]],
["sony-a7-iii-govde", "sony-a7-iii", "Sony", "A7 III Gövde", "Gövde", "camera", 33400, 42200, 1.0, 10, 0, 0, ["a7 iii", "a7 iii gövde", "sony"]],
["sony-a7-iv-govde", "sony-a7-iv", "Sony", "A7 IV Gövde", "Gövde", "camera", 54600, 66000, 1.0, 10, 74999, 1, ["a7 iv", "a7 iv gövde", "sony"]],
["sony-rx100-v", "sony-rx100-v", "Sony", "RX100 V", "", "camera", 16000, 21000, 0.9, 10, 0, 0, ["rx100 v", "sony"]],
["fujifilm-x-t20-govde", "fujifilm-x-t20", "Fujifilm", "X-T20 Gövde", "Gövde", "camera", 12300, 16300, 0.9, 10, 0, 0, ["x-t20", "x-t20 gövde", "fujifilm"]],
["fujifilm-x-t30-govde", "fujifilm-x-t30", "Fujifilm", "X-T30 Gövde", "Gövde", "camera", 17600, 22900, 0.9, 10, 28999, 0, ["x-t30", "x-t30 gövde", "fujifilm"]],
["fujifilm-x-s10-govde", "fujifilm-x-s10", "Fujifilm", "X-S10 Gövde", "Gövde", "camera", 22900, 29000, 1.0, 10, 0, 0, ["x-s10", "x-s10 gövde", "fujifilm"]],
["fujifilm-instax-mini-12", "fujifilm-instax-mini-12", "Fujifilm", "Instax Mini 12", "", "camera", 2200, 3200, 0.9, 10, 3999, 0, ["instax mini 12", "fujifilm"]],
["gopro-hero-11-black", "gopro-hero-11-black", "GoPro", "Hero 11 Black", "", "camera", 9000, 12500, 0.9, 10, 14999, 0, ["hero 11 black", "gopro"]],
["gopro-hero-12-black", "gopro-hero-12-black", "GoPro", "Hero 12 Black", "", "camera", 12000, 16000, 0.9, 10, 18999, 0, ["hero 12 black", "gopro"]],
["gopro-hero-13-black", "gopro-hero-13-black", "GoPro", "Hero 13 Black", "", "camera", 15000, 19500, 0.9, 10, 22999, 1, ["hero 13 black", "gopro"]],
["dji-osmo-pocket-3", "dji-osmo-pocket-3", "DJI", "Osmo Pocket 3", "", "camera", 15000, 19000, 0.9, 10, 21999, 1, ["osmo pocket 3", "dji"]],
["dji-mini-3-drone", "dji-mini-3-drone", "DJI", "Mini 3 Drone", "", "camera", 16000, 21000, 0.9, 10, 24999, 0, ["mini 3 drone", "dji"]],
["dji-mini-4-pro-drone", "dji-mini-4-pro-drone", "DJI", "Mini 4 Pro Drone", "", "camera", 24000, 30000, 0.9, 10, 34999, 1, ["mini 4 pro drone", "dji"]],
["dji-mic-2", "dji-mic-2", "DJI", "Mic 2", "", "camera", 6500, 9000, 0.9, 10, 11999, 0, ["mic 2", "dji"]],
["canon-ef-50mm-f-1-8-lens", "canon-ef-50mm-f-1-8-lens", "Canon", "EF 50mm f/1.8 Lens", "", "camera", 3200, 4500, 0.7, 12, 5999, 0, ["ef 50mm f/1.8", "ef 50mm f/1.8 lens", "canon"]],
["canon-ef-s-18-135mm-lens", "canon-ef-s-18-135mm-lens", "Canon", "EF-S 18-135mm Lens", "", "camera", 6500, 9000, 0.7, 12, 0, 0, ["ef-s 18-135mm", "ef-s 18-135mm lens", "canon"]],
["canon-rf-50mm-f-1-8-lens", "canon-rf-50mm-f-1-8-lens", "Canon", "RF 50mm f/1.8 Lens", "", "camera", 5500, 7500, 0.7, 12, 9499, 0, ["rf 50mm f/1.8", "rf 50mm f/1.8 lens", "canon"]],
["nikon-af-s-50mm-f-1-8-lens", "nikon-af-s-50mm-f-1-8-lens", "Nikon", "AF-S 50mm f/1.8 Lens", "", "camera", 3800, 5200, 0.7, 12, 6999, 0, ["af-s 50mm f/1.8", "af-s 50mm f/1.8 lens", "nikon"]],
["nikon-18-140mm-lens", "nikon-18-140mm-lens", "Nikon", "18-140mm Lens", "", "camera", 6000, 8500, 0.7, 12, 0, 0, ["18-140mm", "18-140mm lens", "nikon"]],
["sony-e-50mm-f-1-8-lens", "sony-e-50mm-f-1-8-lens", "Sony", "E 50mm f/1.8 Lens", "", "camera", 5500, 7500, 0.7, 12, 9999, 0, ["e 50mm f/1.8", "e 50mm f/1.8 lens", "sony"]],
["sony-16-50mm-kit-lens", "sony-16-50mm-kit-lens", "Sony", "16-50mm Kit Lens", "", "camera", 3200, 4500, 0.7, 12, 0, 0, ["16-50mm kit", "16-50mm kit lens", "sony"]],
["sigma-17-50mm-f-2-8-lens", "sigma-17-50mm-f-2-8-lens", "Sigma", "17-50mm f/2.8 Lens", "", "camera", 6000, 8500, 0.7, 12, 0, 0, ["17-50mm f/2.8", "17-50mm f/2.8 lens", "sigma"]],
["sigma-105mm-macro-lens", "sigma-105mm-macro-lens", "Sigma", "105mm Macro Lens", "", "camera", 9000, 12500, 0.7, 12, 0, 0, ["105mm macro", "105mm macro lens", "sigma"]],
["tamron-28-75mm-f-2-8-lens", "tamron-28-75mm-f-2-8-lens", "Tamron", "28-75mm f/2.8 Lens", "", "camera", 14000, 18500, 0.7, 12, 22999, 0, ["28-75mm f/2.8", "28-75mm f/2.8 lens", "tamron"]],
["yongnuo-50mm-f-1-8-lens", "yongnuo-50mm-f-1-8-lens", "Yongnuo", "50mm f/1.8 Lens", "", "camera", 1500, 2300, 0.7, 12, 2999, 0, ["50mm f/1.8", "50mm f/1.8 lens", "yongnuo"]],
["godox-tt685-flas", "godox-tt685-flas", "Godox", "TT685 Flaş", "", "camera", 2200, 3200, 0.7, 12, 4499, 0, ["tt685 flaş", "godox"]],
["arcelik-camasir-makinesi-8-kg", "arcelik-camasir-makinesi", "Arçelik", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 8300, 12400, 1.0, 14, 17499, 0, ["çamaşır makinesi", "camasir", "arçelik çamaşır", "çamaşır makinesi 8 kg", "arçelik"]],
["arcelik-camasir-makinesi-9-kg", "arcelik-camasir-makinesi", "Arçelik", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 9000, 13500, 1.0, 14, 18999, 0, ["çamaşır makinesi", "camasir", "arçelik çamaşır", "çamaşır makinesi 9 kg", "arçelik"]],
["arcelik-camasir-makinesi-10-5-kg", "arcelik-camasir-makinesi", "Arçelik", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 10100, 15100, 1.0, 14, 21499, 0, ["çamaşır makinesi", "camasir", "arçelik çamaşır", "çamaşır makinesi 10.5 kg", "arçelik"]],
["arcelik-camasir-makinesi-12-kg", "arcelik-camasir-makinesi", "Arçelik", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 11200, 16900, 1.0, 14, 23499, 0, ["çamaşır makinesi", "camasir", "arçelik çamaşır", "çamaşır makinesi 12 kg", "arçelik"]],
["beko-camasir-makinesi-8-kg", "beko-camasir-makinesi", "Beko", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 7400, 11000, 0.9, 14, 15499, 0, ["çamaşır makinesi", "camasir", "beko çamaşır", "çamaşır", "çamaşır makinesi 8 kg", "beko"]],
["beko-camasir-makinesi-9-kg", "beko-camasir-makinesi", "Beko", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 8000, 12000, 0.9, 14, 16999, 0, ["çamaşır makinesi", "camasir", "beko çamaşır", "çamaşır", "çamaşır makinesi 9 kg", "beko"]],
["beko-camasir-makinesi-10-5-kg", "beko-camasir-makinesi", "Beko", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 9000, 13400, 0.9, 14, 18999, 0, ["çamaşır makinesi", "camasir", "beko çamaşır", "çamaşır", "çamaşır makinesi 10.5 kg", "beko"]],
["beko-camasir-makinesi-12-kg", "beko-camasir-makinesi", "Beko", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 10000, 15000, 0.9, 14, 20999, 0, ["çamaşır makinesi", "camasir", "beko çamaşır", "çamaşır", "çamaşır makinesi 12 kg", "beko"]],
["bosch-camasir-makinesi-8-kg", "bosch-camasir-makinesi", "Bosch", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 10100, 14700, 1.0, 14, 22999, 0, ["çamaşır makinesi", "camasir", "bosch çamaşır", "çamaşır makinesi 8 kg", "bosch"]],
["bosch-camasir-makinesi-9-kg", "bosch-camasir-makinesi", "Bosch", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 11000, 16000, 1.0, 14, 24999, 0, ["çamaşır makinesi", "camasir", "bosch çamaşır", "çamaşır makinesi 9 kg", "bosch"]],
["bosch-camasir-makinesi-10-5-kg", "bosch-camasir-makinesi", "Bosch", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 12300, 17900, 1.0, 14, 27999, 0, ["çamaşır makinesi", "camasir", "bosch çamaşır", "çamaşır makinesi 10.5 kg", "bosch"]],
["bosch-camasir-makinesi-12-kg", "bosch-camasir-makinesi", "Bosch", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 13800, 20000, 1.0, 14, 30999, 0, ["çamaşır makinesi", "camasir", "bosch çamaşır", "çamaşır makinesi 12 kg", "bosch"]],
["siemens-camasir-makinesi-8-kg", "siemens-camasir-makinesi", "Siemens", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 11000, 15600, 1.0, 14, 24999, 0, ["çamaşır makinesi", "camasir", "siemens çamaşır", "çamaşır makinesi 8 kg", "siemens"]],
["siemens-camasir-makinesi-9-kg", "siemens-camasir-makinesi", "Siemens", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 12000, 17000, 1.0, 14, 26999, 0, ["çamaşır makinesi", "camasir", "siemens çamaşır", "çamaşır makinesi 9 kg", "siemens"]],
["siemens-camasir-makinesi-10-5-kg", "siemens-camasir-makinesi", "Siemens", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 13400, 19000, 1.0, 14, 29999, 0, ["çamaşır makinesi", "camasir", "siemens çamaşır", "çamaşır makinesi 10.5 kg", "siemens"]],
["siemens-camasir-makinesi-12-kg", "siemens-camasir-makinesi", "Siemens", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 15000, 21200, 1.0, 14, 33499, 0, ["çamaşır makinesi", "camasir", "siemens çamaşır", "çamaşır makinesi 12 kg", "siemens"]],
["samsung-camasir-makinesi-8-kg", "samsung-camasir-makinesi", "Samsung", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 9200, 13800, 1.0, 14, 19999, 0, ["çamaşır makinesi", "camasir", "samsung çamaşır", "çamaşır makinesi 8 kg", "samsung"]],
["samsung-camasir-makinesi-9-kg", "samsung-camasir-makinesi", "Samsung", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 10000, 15000, 1.0, 14, 21999, 0, ["çamaşır makinesi", "camasir", "samsung çamaşır", "çamaşır makinesi 9 kg", "samsung"]],
["samsung-camasir-makinesi-10-5-kg", "samsung-camasir-makinesi", "Samsung", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 11200, 16800, 1.0, 14, 24499, 0, ["çamaşır makinesi", "camasir", "samsung çamaşır", "çamaşır makinesi 10.5 kg", "samsung"]],
["samsung-camasir-makinesi-12-kg", "samsung-camasir-makinesi", "Samsung", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 12500, 18800, 1.0, 14, 27499, 0, ["çamaşır makinesi", "camasir", "samsung çamaşır", "çamaşır makinesi 12 kg", "samsung"]],
["lg-camasir-makinesi-8-kg", "lg-camasir-makinesi", "LG", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 9200, 13800, 1.0, 14, 20999, 0, ["çamaşır makinesi", "camasir", "lg çamaşır", "çamaşır makinesi 8 kg"]],
["lg-camasir-makinesi-9-kg", "lg-camasir-makinesi", "LG", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 10000, 15000, 1.0, 14, 22999, 0, ["çamaşır makinesi", "camasir", "lg çamaşır", "çamaşır makinesi 9 kg"]],
["lg-camasir-makinesi-10-5-kg", "lg-camasir-makinesi", "LG", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 11200, 16800, 1.0, 14, 25999, 0, ["çamaşır makinesi", "camasir", "lg çamaşır", "çamaşır makinesi 10.5 kg"]],
["lg-camasir-makinesi-12-kg", "lg-camasir-makinesi", "LG", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 12500, 18800, 1.0, 14, 28499, 0, ["çamaşır makinesi", "camasir", "lg çamaşır", "çamaşır makinesi 12 kg"]],
["vestel-camasir-makinesi-7-kg", "vestel-camasir-makinesi", "Vestel", "Çamaşır Makinesi 7 kg", "7 kg", "appliance", 5500, 8500, 0.8, 14, 11999, 0, ["çamaşır makinesi", "camasir", "vestel çamaşır", "çamaşır makinesi 7 kg", "vestel"]],
["vestel-camasir-makinesi-9-kg", "vestel-camasir-makinesi", "Vestel", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 6500, 10000, 0.8, 14, 13999, 0, ["çamaşır makinesi", "camasir", "vestel çamaşır", "çamaşır makinesi 9 kg", "vestel"]],
["vestel-camasir-makinesi-10-5-kg", "vestel-camasir-makinesi", "Vestel", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 7300, 11200, 0.8, 14, 15499, 0, ["çamaşır makinesi", "camasir", "vestel çamaşır", "çamaşır makinesi 10.5 kg", "vestel"]],
["profilo-camasir-makinesi-7-kg", "profilo-camasir-makinesi", "Profilo", "Çamaşır Makinesi 7 kg", "7 kg", "appliance", 6000, 8900, 0.8, 14, 12499, 0, ["çamaşır makinesi", "camasir", "profilo çamaşır", "çamaşır makinesi 7 kg", "profilo"]],
["profilo-camasir-makinesi-9-kg", "profilo-camasir-makinesi", "Profilo", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 7000, 10500, 0.8, 14, 14999, 0, ["çamaşır makinesi", "camasir", "profilo çamaşır", "çamaşır makinesi 9 kg", "profilo"]],
["profilo-camasir-makinesi-10-5-kg", "profilo-camasir-makinesi", "Profilo", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 7800, 11800, 0.8, 14, 16999, 0, ["çamaşır makinesi", "camasir", "profilo çamaşır", "çamaşır makinesi 10.5 kg", "profilo"]],
["grundig-camasir-makinesi-8-kg", "grundig-camasir-makinesi", "Grundig", "Çamaşır Makinesi 8 kg", "8 kg", "appliance", 6900, 10100, 0.9, 14, 14499, 0, ["çamaşır makinesi", "camasir", "grundig çamaşır", "çamaşır makinesi 8 kg", "grundig"]],
["grundig-camasir-makinesi-9-kg", "grundig-camasir-makinesi", "Grundig", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 7500, 11000, 0.9, 14, 15999, 0, ["çamaşır makinesi", "camasir", "grundig çamaşır", "çamaşır makinesi 9 kg", "grundig"]],
["grundig-camasir-makinesi-10-5-kg", "grundig-camasir-makinesi", "Grundig", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 8400, 12300, 0.9, 14, 17999, 0, ["çamaşır makinesi", "camasir", "grundig çamaşır", "çamaşır makinesi 10.5 kg", "grundig"]],
["grundig-camasir-makinesi-12-kg", "grundig-camasir-makinesi", "Grundig", "Çamaşır Makinesi 12 kg", "12 kg", "appliance", 9400, 13800, 0.9, 14, 19999, 0, ["çamaşır makinesi", "camasir", "grundig çamaşır", "çamaşır makinesi 12 kg", "grundig"]],
["altus-camasir-makinesi-7-kg", "altus-camasir-makinesi", "Altus", "Çamaşır Makinesi 7 kg", "7 kg", "appliance", 5100, 7600, 0.75, 14, 10999, 0, ["çamaşır makinesi", "camasir", "altus çamaşır", "çamaşır makinesi 7 kg", "altus"]],
["altus-camasir-makinesi-9-kg", "altus-camasir-makinesi", "Altus", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 6000, 9000, 0.75, 14, 12999, 0, ["çamaşır makinesi", "camasir", "altus çamaşır", "çamaşır makinesi 9 kg", "altus"]],
["altus-camasir-makinesi-10-5-kg", "altus-camasir-makinesi", "Altus", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 6700, 10100, 0.75, 14, 14499, 0, ["çamaşır makinesi", "camasir", "altus çamaşır", "çamaşır makinesi 10.5 kg", "altus"]],
["regal-camasir-makinesi-7-kg", "regal-camasir-makinesi", "Regal", "Çamaşır Makinesi 7 kg", "7 kg", "appliance", 4700, 7200, 0.7, 14, 9999, 0, ["çamaşır makinesi", "camasir", "regal çamaşır", "çamaşır makinesi 7 kg", "regal"]],
["regal-camasir-makinesi-9-kg", "regal-camasir-makinesi", "Regal", "Çamaşır Makinesi 9 kg", "9 kg", "appliance", 5500, 8500, 0.7, 14, 11999, 0, ["çamaşır makinesi", "camasir", "regal çamaşır", "çamaşır makinesi 9 kg", "regal"]],
["regal-camasir-makinesi-10-5-kg", "regal-camasir-makinesi", "Regal", "Çamaşır Makinesi 10.5 kg", "10.5 kg", "appliance", 6200, 9500, 0.7, 14, 13499, 0, ["çamaşır makinesi", "camasir", "regal çamaşır", "çamaşır makinesi 10.5 kg", "regal"]],
["arcelik-bulasik-makinesi", "arcelik-bulasik-makinesi", "Arçelik", "Bulaşık Makinesi", "", "appliance", 9400, 14200, 1.0, 14, 19999, 0, ["bulaşık makinesi", "bulasik", "arçelik bulaşık", "arçelik"]],
["beko-bulasik-makinesi", "beko-bulasik-makinesi", "Beko", "Bulaşık Makinesi", "", "appliance", 8400, 12600, 0.9, 14, 17999, 0, ["bulaşık makinesi", "bulasik", "beko bulaşık", "beko"]],
["bosch-bulasik-makinesi", "bosch-bulasik-makinesi", "Bosch", "Bulaşık Makinesi", "", "appliance", 11600, 16800, 1.0, 14, 25999, 0, ["bulaşık makinesi", "bulasik", "bosch bulaşık", "bosch"]],
["siemens-bulasik-makinesi", "siemens-bulasik-makinesi", "Siemens", "Bulaşık Makinesi", "", "appliance", 12600, 17800, 1.0, 14, 28499, 0, ["bulaşık makinesi", "bulasik", "siemens bulaşık", "siemens"]],
["samsung-bulasik-makinesi", "samsung-bulasik-makinesi", "Samsung", "Bulaşık Makinesi", "", "appliance", 10500, 15800, 1.0, 14, 22999, 0, ["bulaşık makinesi", "bulasik", "samsung bulaşık", "samsung"]],
["lg-bulasik-makinesi", "lg-bulasik-makinesi", "LG", "Bulaşık Makinesi", "", "appliance", 10500, 15800, 1.0, 14, 23999, 0, ["bulaşık makinesi", "bulasik", "lg bulaşık"]],
["vestel-bulasik-makinesi", "vestel-bulasik-makinesi", "Vestel", "Bulaşık Makinesi", "", "appliance", 6800, 10500, 0.8, 14, 14499, 0, ["bulaşık makinesi", "bulasik", "vestel bulaşık", "vestel"]],
["profilo-bulasik-makinesi", "profilo-bulasik-makinesi", "Profilo", "Bulaşık Makinesi", "", "appliance", 7400, 11000, 0.8, 14, 15499, 0, ["bulaşık makinesi", "bulasik", "profilo bulaşık", "profilo"]],
["grundig-bulasik-makinesi", "grundig-bulasik-makinesi", "Grundig", "Bulaşık Makinesi", "", "appliance", 7900, 11600, 0.9, 14, 16999, 0, ["bulaşık makinesi", "bulasik", "grundig bulaşık", "grundig"]],
["arcelik-no-frost-buzdolabi-ustten-donduruculu", "arcelik-no-frost-buzdolabi", "Arçelik", "No-Frost Buzdolabı Üstten Donduruculu", "Üstten Donduruculu", "appliance", 10200, 15300, 1.0, 15, 23999, 0, ["buzdolabı", "buzdolabi", "arçelik buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı üstten donduruculu", "arçelik"]],
["arcelik-no-frost-buzdolabi-alttan-donduruculu", "arcelik-no-frost-buzdolabi", "Arçelik", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 12000, 18000, 1.0, 15, 27999, 0, ["buzdolabı", "buzdolabi", "arçelik buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "arçelik"]],
["beko-no-frost-buzdolabi-ustten-donduruculu", "beko-no-frost-buzdolabi", "Beko", "No-Frost Buzdolabı Üstten Donduruculu", "Üstten Donduruculu", "appliance", 8500, 12800, 1.0, 15, 20499, 0, ["buzdolabı", "buzdolabi", "beko buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı üstten donduruculu", "beko"]],
["beko-no-frost-buzdolabi-alttan-donduruculu", "beko-no-frost-buzdolabi", "Beko", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 10000, 15000, 1.0, 15, 23999, 0, ["buzdolabı", "buzdolabi", "beko buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "beko"]],
["bosch-no-frost-buzdolabi-alttan-donduruculu", "bosch-no-frost-buzdolabi", "Bosch", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 15000, 22000, 1.0, 15, 34999, 0, ["buzdolabı", "buzdolabi", "bosch buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "bosch"]],
["bosch-no-frost-buzdolabi-gardirop-tipi", "bosch-no-frost-buzdolabi", "Bosch", "No-Frost Buzdolabı Gardırop Tipi", "Gardırop Tipi", "appliance", 20200, 29700, 1.0, 15, 46999, 0, ["buzdolabı", "buzdolabi", "bosch buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı gardırop tipi", "bosch"]],
["samsung-no-frost-buzdolabi-alttan-donduruculu", "samsung-no-frost-buzdolabi", "Samsung", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 14000, 21000, 1.0, 15, 33999, 0, ["buzdolabı", "buzdolabi", "samsung buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "samsung"]],
["samsung-no-frost-buzdolabi-gardirop-tipi", "samsung-no-frost-buzdolabi", "Samsung", "No-Frost Buzdolabı Gardırop Tipi", "Gardırop Tipi", "appliance", 18900, 28400, 1.0, 15, 45999, 0, ["buzdolabı", "buzdolabi", "samsung buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı gardırop tipi", "samsung"]],
["lg-no-frost-buzdolabi-alttan-donduruculu", "lg-no-frost-buzdolabi", "LG", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 15000, 22000, 1.0, 15, 34999, 0, ["buzdolabı", "buzdolabi", "lg buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu"]],
["lg-no-frost-buzdolabi-gardirop-tipi", "lg-no-frost-buzdolabi", "LG", "No-Frost Buzdolabı Gardırop Tipi", "Gardırop Tipi", "appliance", 20200, 29700, 1.0, 15, 46999, 0, ["buzdolabı", "buzdolabi", "lg buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı gardırop tipi"]],
["vestel-no-frost-buzdolabi-ustten-donduruculu", "vestel-no-frost-buzdolabi", "Vestel", "No-Frost Buzdolabı Üstten Donduruculu", "Üstten Donduruculu", "appliance", 6800, 10200, 1.0, 15, 15499, 0, ["buzdolabı", "buzdolabi", "vestel buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı üstten donduruculu", "vestel"]],
["vestel-no-frost-buzdolabi-alttan-donduruculu", "vestel-no-frost-buzdolabi", "Vestel", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 8000, 12000, 1.0, 15, 17999, 0, ["buzdolabı", "buzdolabi", "vestel buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "vestel"]],
["altus-no-frost-buzdolabi-ustten-donduruculu", "altus-no-frost-buzdolabi", "Altus", "No-Frost Buzdolabı Üstten Donduruculu", "Üstten Donduruculu", "appliance", 6000, 8900, 1.0, 15, 12499, 0, ["buzdolabı", "buzdolabi", "altus buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı üstten donduruculu", "altus"]],
["altus-no-frost-buzdolabi-alttan-donduruculu", "altus-no-frost-buzdolabi", "Altus", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 7000, 10500, 1.0, 15, 14999, 0, ["buzdolabı", "buzdolabi", "altus buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "altus"]],
["regal-no-frost-buzdolabi-ustten-donduruculu", "regal-no-frost-buzdolabi", "Regal", "No-Frost Buzdolabı Üstten Donduruculu", "Üstten Donduruculu", "appliance", 5500, 8500, 1.0, 15, 11999, 0, ["buzdolabı", "buzdolabi", "regal buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı üstten donduruculu", "regal"]],
["regal-no-frost-buzdolabi-alttan-donduruculu", "regal-no-frost-buzdolabi", "Regal", "No-Frost Buzdolabı Alttan Donduruculu", "Alttan Donduruculu", "appliance", 6500, 10000, 1.0, 15, 13999, 0, ["buzdolabı", "buzdolabi", "regal buzdolabı", "no-frost buzdolabı", "no-frost buzdolabı alttan donduruculu", "regal"]],
["arcelik-klima-9000-btu", "arcelik-klima", "Arçelik", "Klima 9000 BTU", "9000 BTU", "appliance", 8500, 12800, 1.0, 12, 19499, 0, ["klima", "arçelik klima", "klima 9000 btu", "arçelik"]],
["arcelik-klima-12000-btu", "arcelik-klima", "Arçelik", "Klima 12000 BTU", "12000 BTU", "appliance", 10000, 15000, 1.0, 12, 22999, 0, ["klima", "arçelik klima", "klima 12000 btu", "arçelik"]],
["arcelik-klima-18000-btu", "arcelik-klima", "Arçelik", "Klima 18000 BTU", "18000 BTU", "appliance", 13000, 19500, 1.0, 12, 29999, 0, ["klima", "arçelik klima", "klima 18000 btu", "arçelik"]],
["arcelik-klima-24000-btu", "arcelik-klima", "Arçelik", "Klima 24000 BTU", "24000 BTU", "appliance", 16000, 24000, 1.0, 12, 36999, 0, ["klima", "arçelik klima", "klima 24000 btu", "arçelik"]],
["beko-klima-9000-btu", "beko-klima", "Beko", "Klima 9000 BTU", "9000 BTU", "appliance", 7600, 11500, 1.0, 12, 16999, 0, ["klima", "beko klima", "klima 9000 btu", "beko"]],
["beko-klima-12000-btu", "beko-klima", "Beko", "Klima 12000 BTU", "12000 BTU", "appliance", 9000, 13500, 1.0, 12, 19999, 0, ["klima", "beko klima", "klima 12000 btu", "beko"]],
["beko-klima-18000-btu", "beko-klima", "Beko", "Klima 18000 BTU", "18000 BTU", "appliance", 11700, 17600, 1.0, 12, 25999, 0, ["klima", "beko klima", "klima 18000 btu", "beko"]],
["beko-klima-24000-btu", "beko-klima", "Beko", "Klima 24000 BTU", "24000 BTU", "appliance", 14400, 21600, 1.0, 12, 31999, 0, ["klima", "beko klima", "klima 24000 btu", "beko"]],
["vestel-klima-9000-btu", "vestel-klima", "Vestel", "Klima 9000 BTU", "9000 BTU", "appliance", 6800, 10200, 1.0, 12, 15499, 0, ["klima", "vestel klima", "klima 9000 btu", "vestel"]],
["vestel-klima-12000-btu", "vestel-klima", "Vestel", "Klima 12000 BTU", "12000 BTU", "appliance", 8000, 12000, 1.0, 12, 17999, 0, ["klima", "vestel klima", "klima 12000 btu", "vestel"]],
["vestel-klima-18000-btu", "vestel-klima", "Vestel", "Klima 18000 BTU", "18000 BTU", "appliance", 10400, 15600, 1.0, 12, 23499, 0, ["klima", "vestel klima", "klima 18000 btu", "vestel"]],
["vestel-klima-24000-btu", "vestel-klima", "Vestel", "Klima 24000 BTU", "24000 BTU", "appliance", 12800, 19200, 1.0, 12, 28999, 0, ["klima", "vestel klima", "klima 24000 btu", "vestel"]],
["samsung-klima-9000-btu", "samsung-klima", "Samsung", "Klima 9000 BTU", "9000 BTU", "appliance", 9400, 14000, 1.0, 12, 21999, 0, ["klima", "samsung klima", "klima 9000 btu", "samsung"]],
["samsung-klima-12000-btu", "samsung-klima", "Samsung", "Klima 12000 BTU", "12000 BTU", "appliance", 11000, 16500, 1.0, 12, 25999, 0, ["klima", "samsung klima", "klima 12000 btu", "samsung"]],
["samsung-klima-18000-btu", "samsung-klima", "Samsung", "Klima 18000 BTU", "18000 BTU", "appliance", 14300, 21400, 1.0, 12, 33999, 0, ["klima", "samsung klima", "klima 18000 btu", "samsung"]],
["samsung-klima-24000-btu", "samsung-klima", "Samsung", "Klima 24000 BTU", "24000 BTU", "appliance", 17600, 26400, 1.0, 12, 41499, 0, ["klima", "samsung klima", "klima 24000 btu", "samsung"]],
["mitsubishi-klima-9000-btu", "mitsubishi-klima", "Mitsubishi", "Klima 9000 BTU", "9000 BTU", "appliance", 13600, 20400, 1.0, 12, 32499, 0, ["klima", "mitsubishi klima", "klima 9000 btu", "mitsubishi"]],
["mitsubishi-klima-12000-btu", "mitsubishi-klima", "Mitsubishi", "Klima 12000 BTU", "12000 BTU", "appliance", 16000, 24000, 1.0, 12, 37999, 0, ["klima", "mitsubishi klima", "klima 12000 btu", "mitsubishi"]],
["mitsubishi-klima-18000-btu", "mitsubishi-klima", "Mitsubishi", "Klima 18000 BTU", "18000 BTU", "appliance", 20800, 31200, 1.0, 12, 49499, 0, ["klima", "mitsubishi klima", "klima 18000 btu", "mitsubishi"]],
["mitsubishi-klima-24000-btu", "mitsubishi-klima", "Mitsubishi", "Klima 24000 BTU", "24000 BTU", "appliance", 25600, 38400, 1.0, 12, 60999, 0, ["klima", "mitsubishi klima", "klima 24000 btu", "mitsubishi"]],
["beko-kurutma-makinesi", "beko-kurutma-makinesi", "Beko", "Kurutma Makinesi", "", "appliance", 9000, 13000, 0.9, 15, 19999, 0, ["kurutma", "kurutma makinesi", "beko"]],
["arcelik-kurutma-makinesi", "arcelik-kurutma-makinesi", "Arçelik", "Kurutma Makinesi", "", "appliance", 9500, 14000, 0.9, 15, 21999, 0, ["kurutma", "kurutma makinesi", "arçelik"]],
["bosch-kurutma-makinesi", "bosch-kurutma-makinesi", "Bosch", "Kurutma Makinesi", "", "appliance", 12000, 17000, 0.9, 15, 27999, 0, ["kurutma", "kurutma makinesi", "bosch"]],
["grundig-kurutma-makinesi", "grundig-kurutma-makinesi", "Grundig", "Kurutma Makinesi", "", "appliance", 8500, 12500, 0.9, 15, 18999, 0, ["kurutma", "kurutma makinesi", "grundig"]],
["vestel-ankastre-firin", "vestel-ankastre-firin", "Vestel", "Ankastre Fırın", "", "appliance", 6000, 9500, 0.8, 16, 12999, 0, ["fırın", "firin", "ankastre", "ankastre fırın", "vestel"]],
["arcelik-ankastre-firin", "arcelik-ankastre-firin", "Arçelik", "Ankastre Fırın", "", "appliance", 7500, 11500, 0.8, 16, 16999, 0, ["fırın", "firin", "ankastre", "ankastre fırın", "arçelik"]],
["beko-ankastre-firin", "beko-ankastre-firin", "Beko", "Ankastre Fırın", "", "appliance", 7000, 10500, 0.8, 16, 15999, 0, ["fırın", "firin", "ankastre", "ankastre fırın", "beko"]],
["bosch-ankastre-firin", "bosch-ankastre-firin", "Bosch", "Ankastre Fırın", "", "appliance", 9500, 14000, 0.8, 16, 21999, 0, ["fırın", "firin", "ankastre", "ankastre fırın", "bosch"]],
["simfer-ankastre-firin", "simfer-ankastre-firin", "Simfer", "Ankastre Fırın", "", "appliance", 4500, 7000, 0.8, 16, 9999, 0, ["fırın", "firin", "ankastre", "ankastre fırın", "simfer"]],
["beko-mikrodalga-firin", "beko-mikrodalga-firin", "Beko", "Mikrodalga Fırın", "", "appliance", 2000, 3200, 0.5, 14, 4499, 0, ["mikrodalga", "mikrodalga fırın", "beko"]],
["arcelik-mikrodalga-firin", "arcelik-mikrodalga-firin", "Arçelik", "Mikrodalga Fırın", "", "appliance", 2200, 3500, 0.5, 14, 4999, 0, ["mikrodalga", "mikrodalga fırın", "arçelik"]],
["samsung-mikrodalga-firin", "samsung-mikrodalga-firin", "Samsung", "Mikrodalga Fırın", "", "appliance", 2500, 3800, 0.5, 14, 5499, 0, ["mikrodalga", "mikrodalga fırın", "samsung"]],
["vestel-mikrodalga-firin", "vestel-mikrodalga-firin", "Vestel", "Mikrodalga Fırın", "", "appliance", 1600, 2600, 0.5, 14, 3999, 0, ["mikrodalga", "mikrodalga fırın", "vestel"]],
["kumtel-mikrodalga-firin", "kumtel-mikrodalga-firin", "Kumtel", "Mikrodalga Fırın", "", "appliance", 1200, 2000, 0.5, 14, 2999, 0, ["mikrodalga", "mikrodalga fırın", "kumtel"]],
["bosch-ankastre-ocak", "bosch-ankastre-ocak", "Bosch", "Ankastre Ocak", "", "appliance", 3500, 5500, 0.6, 16, 7999, 0, ["ocak", "set üstü", "ankastre ocak", "bosch"]],
["arcelik-ankastre-ocak", "arcelik-ankastre-ocak", "Arçelik", "Ankastre Ocak", "", "appliance", 3000, 4800, 0.6, 16, 6999, 0, ["ocak", "set üstü", "ankastre ocak", "arçelik"]],
["franke-ankastre-ocak", "franke-ankastre-ocak", "Franke", "Ankastre Ocak", "", "appliance", 4000, 6200, 0.6, 16, 8999, 0, ["ocak", "set üstü", "ankastre ocak", "franke"]],
["vestel-ankastre-ocak", "vestel-ankastre-ocak", "Vestel", "Ankastre Ocak", "", "appliance", 2200, 3600, 0.6, 16, 5499, 0, ["ocak", "set üstü", "ankastre ocak", "vestel"]],
["silverline-davlumbaz", "silverline-davlumbaz", "Silverline", "Davlumbaz", "", "appliance", 2000, 3300, 0.5, 17, 4999, 0, ["davlumbaz", "aspiratör", "silverline"]],
["franke-davlumbaz", "franke-davlumbaz", "Franke", "Davlumbaz", "", "appliance", 2800, 4400, 0.5, 17, 6499, 0, ["davlumbaz", "aspiratör", "franke"]],
["arcelik-davlumbaz", "arcelik-davlumbaz", "Arçelik", "Davlumbaz", "", "appliance", 2200, 3600, 0.5, 17, 5499, 0, ["davlumbaz", "aspiratör", "arçelik"]],
["ugur-derin-dondurucu-205-lt", "ugur-derin-dondurucu", "Uğur", "Derin Dondurucu 205 Lt", "205 Lt", "appliance", 5600, 8400, 0.9, 13, 11999, 0, ["derin dondurucu", "uğur", "ugur", "derin dondurucu 205 lt"]],
["ugur-derin-dondurucu-305-lt", "ugur-derin-dondurucu", "Uğur", "Derin Dondurucu 305 Lt", "305 Lt", "appliance", 7000, 10500, 0.9, 13, 14999, 0, ["derin dondurucu", "uğur", "ugur", "derin dondurucu 305 lt"]],
["ugur-derin-dondurucu-508-lt", "ugur-derin-dondurucu", "Uğur", "Derin Dondurucu 508 Lt", "508 Lt", "appliance", 9400, 14200, 0.9, 13, 19999, 0, ["derin dondurucu", "uğur", "ugur", "derin dondurucu 508 lt"]],
["vestel-derin-dondurucu", "vestel-derin-dondurucu", "Vestel", "Derin Dondurucu", "", "appliance", 6500, 10000, 0.85, 13, 13999, 0, ["vestel dondurucu", "derin dondurucu", "vestel"]],
["ugur-su-sebili", "ugur-su-sebili", "Uğur", "Su Sebili", "", "appliance", 2200, 3500, 0.5, 15, 4999, 0, ["su sebili", "sebil", "uğur"]],
["dyson-v8-sarjli-supurge", "dyson-v8-sarjli-supurge", "Dyson", "V8 Şarjlı Süpürge", "", "smallapp", 7000, 10000, 1.0, 10, 16999, 0, ["dyson v8", "v8 şarjlı süpürge", "dyson"]],
["dyson-v10-sarjli-supurge", "dyson-v10-sarjli-supurge", "Dyson", "V10 Şarjlı Süpürge", "", "smallapp", 9500, 13500, 1.1, 8, 21999, 0, ["dyson v10", "v10 şarjlı süpürge", "dyson"]],
["dyson-v11-sarjli-supurge", "dyson-v11-sarjli-supurge", "Dyson", "V11 Şarjlı Süpürge", "", "smallapp", 12000, 17000, 1.2, 8, 27999, 0, ["dyson v11", "dyson", "v11 şarjlı süpürge"]],
["dyson-v12-detect-slim", "dyson-v12-detect-slim", "Dyson", "V12 Detect Slim", "", "smallapp", 15000, 20500, 1.3, 8, 31999, 0, ["v12", "v12 detect slim", "dyson"]],
["dyson-v15-detect", "dyson-v15-detect", "Dyson", "V15 Detect", "", "smallapp", 18000, 24000, 1.4, 8, 36999, 0, ["v15", "v15 detect", "dyson"]],
["dyson-gen5detect", "dyson-gen5detect", "Dyson", "Gen5detect", "", "smallapp", 27000, 36000, 1.5, 8, 44999, 1, ["gen5", "gen5detect", "dyson"]],
["dyson-airwrap", "dyson-airwrap", "Dyson", "Airwrap", "", "smallapp", 16000, 21000, 1.3, 8, 29999, 0, ["airwrap", "dyson"]],
["dyson-supersonic-fon", "dyson-supersonic-fon", "Dyson", "Supersonic Fön", "", "smallapp", 12000, 16000, 1.2, 8, 22999, 0, ["supersonic", "supersonic fön", "dyson"]],
["dreame-v12-dikey-supurge", "dreame-v12-dikey-supurge", "Dreame", "V12 Dikey Süpürge", "", "smallapp", 6500, 9500, 0.9, 10, 13999, 0, ["dreame", "v12 dikey süpürge"]],
["dreame-l10s-robot-supurge", "dreame-l10s-robot-supurge", "Dreame", "L10s Robot Süpürge", "", "smallapp", 11000, 15000, 1.0, 8, 20999, 0, ["dreame robot", "l10s robot süpürge", "dreame"]],
["tineco-floor-one-s5", "tineco-floor-one-s5", "Tineco", "Floor One S5", "", "smallapp", 9000, 13000, 1.0, 8, 17999, 0, ["tineco", "floor one s5"]],
["roborock-s7-robot-supurge", "roborock-s7-robot-supurge", "Roborock", "S7 Robot Süpürge", "", "smallapp", 11000, 15000, 1.0, 8, 0, 0, ["roborock s7", "s7 robot süpürge", "roborock"]],
["roborock-s8-robot-supurge", "roborock-s8-robot-supurge", "Roborock", "S8 Robot Süpürge", "", "smallapp", 15000, 20000, 1.1, 8, 29999, 0, ["roborock", "robot süpürge", "s8 robot süpürge"]],
["roborock-q7-max-robot", "roborock-q7-max-robot", "Roborock", "Q7 Max Robot", "", "smallapp", 9500, 13500, 1.0, 8, 18999, 0, ["q7", "q7 max robot", "roborock"]],
["xiaomi-robot-vacuum-s10", "xiaomi-robot-vacuum-s10", "Xiaomi", "Robot Vacuum S10", "", "smallapp", 7000, 10000, 0.8, 10, 15999, 0, ["xiaomi robot", "robot vacuum s10", "xiaomi"]],
["xiaomi-robot-vacuum-s12", "xiaomi-robot-vacuum-s12", "Xiaomi", "Robot Vacuum S12", "", "smallapp", 8500, 12000, 0.9, 8, 17999, 0, ["s12", "robot vacuum s12", "xiaomi"]],
["xiaomi-g10-dikey-supurge", "xiaomi-g10-dikey-supurge", "Xiaomi", "G10 Dikey Süpürge", "", "smallapp", 5000, 7500, 0.7, 10, 10999, 0, ["xiaomi g10", "g10 dikey süpürge", "xiaomi"]],
["xiaomi-g9-dikey-supurge", "xiaomi-g9-dikey-supurge", "Xiaomi", "G9 Dikey Süpürge", "", "smallapp", 4000, 6200, 0.6, 10, 8999, 0, ["xiaomi g9", "g9 dikey süpürge", "xiaomi"]],
["philips-torbali-supurge", "philips-torbali-supurge", "Philips", "Torbalı Süpürge", "", "smallapp", 2500, 4000, 0.6, 10, 5999, 0, ["torbalı süpürge", "philips"]],
["philips-speedpro-max", "philips-speedpro-max", "Philips", "SpeedPro Max", "", "smallapp", 5500, 8000, 0.8, 10, 11999, 0, ["speedpro", "speedpro max", "philips"]],
["arcelik-torbali-supurge", "arcelik-torbali-supurge", "Arçelik", "Torbalı Süpürge", "", "smallapp", 2200, 3600, 0.5, 10, 5499, 0, ["arçelik süpürge", "torbalı süpürge", "arçelik"]],
["beko-torbali-supurge", "beko-torbali-supurge", "Beko", "Torbalı Süpürge", "", "smallapp", 2000, 3300, 0.5, 10, 4999, 0, ["beko süpürge", "torbalı süpürge", "beko"]],
["bosch-torbali-supurge", "bosch-torbali-supurge", "Bosch", "Torbalı Süpürge", "", "smallapp", 2800, 4400, 0.6, 10, 6999, 0, ["bosch süpürge", "torbalı süpürge", "bosch"]],
["fantom-pratik-supurge", "fantom-pratik-supurge", "Fantom", "Pratik Süpürge", "", "smallapp", 1500, 2500, 0.45, 12, 3999, 0, ["fantom", "pratik süpürge"]],
["arnica-bora-5000-supurge", "arnica-bora-5000-supurge", "Arnica", "Bora 5000 Süpürge", "", "smallapp", 2500, 4000, 0.6, 10, 5999, 0, ["arnica", "bora 5000 süpürge"]],
["fakir-elektrikli-supurge", "fakir-elektrikli-supurge", "Fakir", "Elektrikli Süpürge", "", "smallapp", 3000, 4500, 0.6, 10, 6499, 0, ["fakir süpürge", "fakir", "elektrikli süpürge"]],
["rowenta-x-force-supurge", "rowenta-x-force-supurge", "Rowenta", "X-Force Süpürge", "", "smallapp", 4000, 6000, 0.7, 10, 8999, 0, ["rowenta", "x-force süpürge"]],
["sinbo-elektrikli-supurge", "sinbo-elektrikli-supurge", "Sinbo", "Elektrikli Süpürge", "", "smallapp", 800, 1400, 0.4, 12, 2499, 0, ["sinbo", "elektrikli süpürge"]],
["nespresso-essenza-mini", "nespresso-essenza-mini", "Nespresso", "Essenza Mini", "", "smallapp", 3500, 5500, 0.6, 10, 7499, 0, ["nespresso", "essenza mini"]],
["nespresso-vertuo", "nespresso-vertuo", "Nespresso", "Vertuo", "", "smallapp", 4500, 6500, 0.7, 10, 9499, 0, ["vertuo", "nespresso"]],
["delonghi-magnifica-espresso", "delonghi-magnifica-espresso", "DeLonghi", "Magnifica Espresso", "", "smallapp", 9000, 13500, 0.9, 8, 19999, 0, ["delonghi", "magnifica", "magnifica espresso"]],
["delonghi-dedica", "delonghi-dedica", "DeLonghi", "Dedica", "", "smallapp", 5500, 8000, 0.8, 10, 11999, 0, ["dedica", "delonghi"]],
["philips-3200-lattego", "philips-3200-lattego", "Philips", "3200 LatteGo", "", "smallapp", 14000, 19000, 1.1, 8, 27999, 0, ["lattego", "3200 lattego", "philips"]],
["arzum-okka", "arzum-okka", "Arzum", "Okka", "", "smallapp", 2800, 4200, 0.6, 10, 5999, 0, ["okka", "türk kahvesi", "arzum"]],
["beko-turk-kahve-makinesi", "beko-turk-kahve-makinesi", "Beko", "Türk Kahve Makinesi", "", "smallapp", 1400, 2200, 0.4, 12, 3499, 0, ["beko kahve", "türk kahve makinesi", "beko"]],
["arcelik-telve", "arcelik-telve", "Arçelik", "Telve", "", "smallapp", 2000, 3100, 0.5, 10, 4499, 0, ["telve", "arçelik"]],
["karaca-hatir-mod", "karaca-hatir-mod", "Karaca", "Hatır Mod", "", "smallapp", 2400, 3600, 0.5, 10, 5499, 0, ["hatır", "hatir", "hatır mod", "karaca"]],
["philips-filtre-kahve-makinesi", "philips-filtre-kahve-makinesi", "Philips", "Filtre Kahve Makinesi", "", "smallapp", 1200, 1900, 0.4, 12, 2999, 0, ["filtre kahve", "filtre kahve makinesi", "philips"]],
["braun-filtre-kahve-makinesi", "braun-filtre-kahve-makinesi", "Braun", "Filtre Kahve Makinesi", "", "smallapp", 1400, 2200, 0.4, 12, 3499, 0, ["braun kahve", "filtre kahve makinesi", "braun"]],
["arzum-cay-makinesi", "arzum-cay-makinesi", "Arzum", "Çay Makinesi", "", "smallapp", 900, 1500, 0.4, 12, 2499, 0, ["çay makinesi", "arzum"]],
["karaca-caysever", "karaca-caysever", "Karaca", "Çaysever", "", "smallapp", 1000, 1600, 0.4, 12, 2499, 0, ["karaca çay", "çaysever", "karaca"]],
["beko-cay-makinesi", "beko-cay-makinesi", "Beko", "Çay Makinesi", "", "smallapp", 1100, 1700, 0.4, 12, 2499, 0, ["beko çay", "çay makinesi", "beko"]],
["fakir-cay-makinesi", "fakir-cay-makinesi", "Fakir", "Çay Makinesi", "", "smallapp", 1000, 1600, 0.4, 12, 2499, 0, ["fakir çay", "çay makinesi", "fakir"]],
["korkmaz-kettle", "korkmaz-kettle", "Korkmaz", "Kettle", "", "smallapp", 700, 1200, 0.4, 12, 1999, 0, ["kettle", "su ısıtıcı", "korkmaz"]],
["philips-kettle", "philips-kettle", "Philips", "Kettle", "", "smallapp", 800, 1300, 0.4, 12, 1999, 0, ["philips kettle", "kettle", "philips"]],
["tefal-kettle", "tefal-kettle", "Tefal", "Kettle", "", "smallapp", 800, 1300, 0.4, 12, 1999, 0, ["tefal kettle", "kettle", "tefal"]],
["arzum-kettle", "arzum-kettle", "Arzum", "Kettle", "", "smallapp", 600, 1000, 0.35, 12, 1499, 0, ["arzum kettle", "kettle", "arzum"]],
["arcelik-tost-makinesi", "arcelik-tost-makinesi", "Arçelik", "Tost Makinesi", "", "smallapp", 1400, 2200, 0.45, 12, 3499, 0, ["tost makinesi", "tost", "arçelik"]],
["beko-tost-makinesi", "beko-tost-makinesi", "Beko", "Tost Makinesi", "", "smallapp", 1300, 2000, 0.45, 12, 2999, 0, ["beko tost", "tost makinesi", "beko"]],
["tefal-tost-makinesi", "tefal-tost-makinesi", "Tefal", "Tost Makinesi", "", "smallapp", 1500, 2400, 0.5, 12, 3499, 0, ["tefal tost", "tost makinesi", "tefal"]],
["philips-tost-makinesi", "philips-tost-makinesi", "Philips", "Tost Makinesi", "", "smallapp", 1400, 2200, 0.45, 12, 3499, 0, ["philips tost", "tost makinesi", "philips"]],
["korkmaz-tost-makinesi", "korkmaz-tost-makinesi", "Korkmaz", "Tost Makinesi", "", "smallapp", 1200, 1900, 0.4, 12, 2999, 0, ["korkmaz tost", "tost makinesi", "korkmaz"]],
["sinbo-tost-makinesi", "sinbo-tost-makinesi", "Sinbo", "Tost Makinesi", "", "smallapp", 600, 1000, 0.3, 12, 1499, 0, ["sinbo tost", "tost makinesi", "sinbo"]],
["arzum-prostick-blender-seti", "arzum-prostick-blender-seti", "Arzum", "Prostick Blender Seti", "", "smallapp", 1500, 2400, 0.5, 12, 3499, 0, ["prostick", "blender", "prostick blender seti", "arzum"]],
["braun-multiquick-blender", "braun-multiquick-blender", "Braun", "MultiQuick Blender", "", "smallapp", 1800, 2800, 0.5, 12, 3999, 0, ["multiquick", "braun", "multiquick blender"]],
["philips-el-blenderi", "philips-el-blenderi", "Philips", "El Blenderı", "", "smallapp", 1300, 2000, 0.45, 12, 2999, 0, ["philips blender", "el blenderı", "philips"]],
["tefal-blender-seti", "tefal-blender-seti", "Tefal", "Blender Seti", "", "smallapp", 1400, 2200, 0.45, 12, 3499, 0, ["tefal blender", "blender seti", "tefal"]],
["fakir-blender-seti", "fakir-blender-seti", "Fakir", "Blender Seti", "", "smallapp", 1100, 1800, 0.4, 12, 2499, 0, ["fakir blender", "blender seti", "fakir"]],
["kitchenaid-artisan-mikser", "kitchenaid-artisan-mikser", "KitchenAid", "Artisan Mikser", "", "smallapp", 10000, 15000, 1.0, 8, 22999, 0, ["kitchenaid", "mikser", "artisan mikser"]],
["arzum-prochef-mutfak-robotu", "arzum-prochef-mutfak-robotu", "Arzum", "Prochef Mutfak Robotu", "", "smallapp", 2800, 4300, 0.6, 10, 6499, 0, ["prochef", "mutfak robotu", "prochef mutfak robotu", "arzum"]],
["tefal-masterchef-robotu", "tefal-masterchef-robotu", "Tefal", "Masterchef Robotu", "", "smallapp", 3200, 4800, 0.6, 10, 7499, 0, ["masterchef", "masterchef robotu", "tefal"]],
["philips-mutfak-robotu", "philips-mutfak-robotu", "Philips", "Mutfak Robotu", "", "smallapp", 2600, 4000, 0.55, 10, 5999, 0, ["philips robot", "mutfak robotu", "philips"]],
["tefal-buhar-kazanli-utu", "tefal-buhar-kazanli-utu", "Tefal", "Buhar Kazanlı Ütü", "", "smallapp", 2500, 4000, 0.6, 10, 6999, 0, ["ütü", "utu", "buhar kazanlı", "buhar kazanlı ütü", "tefal"]],
["philips-azur-utu", "philips-azur-utu", "Philips", "Azur Ütü", "", "smallapp", 1500, 2400, 0.5, 12, 3999, 0, ["azur", "azur ütü", "philips"]],
["braun-carestyle-utu", "braun-carestyle-utu", "Braun", "CareStyle Ütü", "", "smallapp", 2800, 4300, 0.6, 10, 6999, 0, ["carestyle", "carestyle ütü", "braun"]],
["arzum-utu", "arzum-utu", "Arzum", "Ütü", "", "smallapp", 900, 1500, 0.4, 12, 2499, 0, ["arzum ütü", "ütü", "arzum"]],
["philips-dik-buharli-utu", "philips-dik-buharli-utu", "Philips", "Dik Buharlı Ütü", "", "smallapp", 1800, 2900, 0.5, 12, 4499, 0, ["dik ütü", "steamer", "dik buharlı ütü", "philips"]],
["tefal-cook4me", "tefal-cook4me", "Tefal", "Cook4me", "", "smallapp", 5500, 8000, 0.8, 10, 12999, 0, ["cook4me", "tefal"]],
["kumtel-mini-firin", "kumtel-mini-firin", "Kumtel", "Mini Fırın", "", "smallapp", 1200, 2000, 0.4, 12, 2999, 0, ["mini fırın", "kumtel"]],
["luxell-mini-firin", "luxell-mini-firin", "Luxell", "Mini Fırın", "", "smallapp", 1400, 2300, 0.45, 12, 3499, 0, ["luxell", "mini fırın"]],
["babyliss-air-styler", "babyliss-air-styler", "Babyliss", "Air Styler", "", "smallapp", 2200, 3400, 0.5, 10, 4999, 0, ["babyliss", "air styler"]],
["remington-fon-makinesi", "remington-fon-makinesi", "Remington", "Fön Makinesi", "", "smallapp", 1000, 1600, 0.4, 12, 2499, 0, ["remington", "fön makinesi"]],
["remington-sac-duzlestirici", "remington-sac-duzlestirici", "Remington", "Saç Düzleştirici", "", "smallapp", 800, 1300, 0.35, 12, 1999, 0, ["düzleştirici", "duzlestirici", "saç düzleştirici", "remington"]],
["philips-oneblade", "philips-oneblade", "Philips", "OneBlade", "", "smallapp", 900, 1400, 0.4, 12, 1999, 0, ["oneblade", "philips"]],
["philips-tiras-makinesi-s5000", "philips-tiras-makinesi-s5000", "Philips", "Tıraş Makinesi S5000", "", "smallapp", 1600, 2500, 0.5, 12, 3999, 0, ["tıraş makinesi", "tiras", "tıraş makinesi s5000", "philips"]],
["braun-series-3-tiras", "braun-series-3-tiras", "Braun", "Series 3 Tıraş", "", "smallapp", 1400, 2200, 0.45, 12, 3499, 0, ["braun tıraş", "series 3 tıraş", "braun"]],
["wahl-sac-kesme-makinesi", "wahl-sac-kesme-makinesi", "Wahl", "Saç Kesme Makinesi", "", "smallapp", 900, 1500, 0.4, 12, 2499, 0, ["wahl", "saç kesme", "saç kesme makinesi"]],
["braun-silk-epil-epilator", "braun-silk-epil-epilator", "Braun", "Silk-épil Epilatör", "", "smallapp", 2400, 3700, 0.5, 10, 5499, 0, ["epilatör", "silk", "silk-épil epilatör", "braun"]],
["philips-lumea-ipl", "philips-lumea-ipl", "Philips", "Lumea IPL", "", "smallapp", 7500, 11000, 0.9, 8, 15999, 0, ["lumea", "ipl", "lumea ipl", "philips"]],
["kumtel-i-nfrared-isitici", "kumtel-i-nfrared-isitici", "Kumtel", "İnfrared Isıtıcı", "", "smallapp", 700, 1200, 0.35, 12, 1999, 0, ["ısıtıcı", "isitici", "elektrikli soba", "i̇nfrared isıtıcı", "kumtel"]],
["luxell-i-nfrared-isitici", "luxell-i-nfrared-isitici", "Luxell", "İnfrared Isıtıcı", "", "smallapp", 800, 1300, 0.35, 12, 1999, 0, ["luxell ısıtıcı", "i̇nfrared isıtıcı", "luxell"]],
["arzum-vantilator", "arzum-vantilator", "Arzum", "Vantilatör", "", "smallapp", 500, 900, 0.3, 12, 1499, 0, ["vantilatör", "fan", "arzum"]],
["singer-dikis-makinesi", "singer-dikis-makinesi", "Singer", "Dikiş Makinesi", "", "smallapp", 2800, 4500, 0.6, 10, 6999, 0, ["dikiş makinesi", "dikis", "singer"]],
["brother-dikis-makinesi", "brother-dikis-makinesi", "Brother", "Dikiş Makinesi", "", "smallapp", 3200, 5000, 0.6, 10, 7999, 0, ["brother", "dikiş makinesi"]],
["zhiyun-smooth-5-gimbal", "zhiyun-smooth-5-gimbal", "Zhiyun", "Smooth 5 Gimbal", "", "smallapp", 2500, 3800, 0.5, 10, 5499, 0, ["gimbal", "zhiyun", "smooth 5 gimbal"]],
["philips-airfryer-4-1-l", "philips-airfryer", "Philips", "Airfryer 4.1 L", "4.1 L", "smallapp", 3600, 5400, 0.65, 10, 7499, 0, ["airfryer", "fritöz", "airfryer 4.1 l", "philips"]],
["philips-airfryer-6-2-l", "philips-airfryer", "Philips", "Airfryer 6.2 L", "6.2 L", "smallapp", 4200, 6400, 0.65, 10, 8999, 0, ["airfryer", "fritöz", "airfryer 6.2 l", "philips"]],
["tefal-easyfry-4-1-l", "tefal-easyfry", "Tefal", "EasyFry 4.1 L", "4.1 L", "smallapp", 2800, 4200, 0.6, 10, 5999, 0, ["easyfry", "easyfry 4.1 l", "tefal"]],
["tefal-easyfry-6-2-l", "tefal-easyfry", "Tefal", "EasyFry 6.2 L", "6.2 L", "smallapp", 3300, 5000, 0.6, 10, 6999, 0, ["easyfry", "easyfry 6.2 l", "tefal"]],
["xiaomi-smart-airfryer-4-1-l", "xiaomi-smart-airfryer", "Xiaomi", "Smart Airfryer 4.1 L", "4.1 L", "smallapp", 2500, 3800, 0.5, 10, 5499, 0, ["xiaomi airfryer", "smart airfryer", "smart airfryer 4.1 l", "xiaomi"]],
["xiaomi-smart-airfryer-6-2-l", "xiaomi-smart-airfryer", "Xiaomi", "Smart Airfryer 6.2 L", "6.2 L", "smallapp", 3000, 4500, 0.5, 10, 6499, 0, ["xiaomi airfryer", "smart airfryer", "smart airfryer 6.2 l", "xiaomi"]],
["cosori-airfryer-4-1-l", "cosori-airfryer", "Cosori", "Airfryer 4.1 L", "4.1 L", "smallapp", 3200, 4800, 0.6, 10, 6999, 0, ["cosori", "airfryer", "airfryer 4.1 l"]],
["cosori-airfryer-6-2-l", "cosori-airfryer", "Cosori", "Airfryer 6.2 L", "6.2 L", "smallapp", 3800, 5700, 0.6, 10, 8499, 0, ["cosori", "airfryer", "airfryer 6.2 l"]],
["arzum-airfryer-4-1-l", "arzum-airfryer", "Arzum", "Airfryer 4.1 L", "4.1 L", "smallapp", 2200, 3400, 0.5, 10, 4999, 0, ["arzum airfryer", "airfryer", "airfryer 4.1 l", "arzum"]],
["arzum-airfryer-6-2-l", "arzum-airfryer", "Arzum", "Airfryer 6.2 L", "6.2 L", "smallapp", 2600, 4000, 0.5, 10, 5999, 0, ["arzum airfryer", "airfryer", "airfryer 6.2 l", "arzum"]],
["ninja-foodi-airfryer-4-1-l", "ninja-foodi-airfryer", "Ninja", "Foodi Airfryer 4.1 L", "4.1 L", "smallapp", 4500, 6500, 0.7, 10, 9999, 0, ["ninja", "foodi airfryer", "foodi airfryer 4.1 l"]],
["ninja-foodi-airfryer-6-2-l", "ninja-foodi-airfryer", "Ninja", "Foodi Airfryer 6.2 L", "6.2 L", "smallapp", 5300, 7700, 0.7, 10, 11999, 0, ["ninja", "foodi airfryer", "foodi airfryer 6.2 l"]],
["tefal-optigrill", "tefal-optigrill", "Tefal", "OptiGrill", "", "smallapp", 4500, 6800, 0.7, 10, 9999, 0, ["optigrill", "tost izgara", "tefal"]],
["salcano-ng750-dag-bisikleti-26-jant", "salcano-ng750-dag-bisikleti", "Salcano", "NG750 Dağ Bisikleti 26 Jant", "26 Jant", "bike", 3600, 6300, 0.6, 12, 9999, 0, ["salcano", "dağ bisikleti", "bisiklet", "ng750 dağ bisikleti", "ng750 dağ bisikleti 26 jant"]],
["salcano-ng750-dag-bisikleti-27-5-jant", "salcano-ng750-dag-bisikleti", "Salcano", "NG750 Dağ Bisikleti 27.5 Jant", "27.5 Jant", "bike", 4000, 7000, 0.6, 12, 10999, 0, ["salcano", "dağ bisikleti", "bisiklet", "ng750 dağ bisikleti", "ng750 dağ bisikleti 27.5 jant"]],
["salcano-ng750-dag-bisikleti-29-jant", "salcano-ng750-dag-bisikleti", "Salcano", "NG750 Dağ Bisikleti 29 Jant", "29 Jant", "bike", 4600, 8000, 0.6, 12, 12499, 0, ["salcano", "dağ bisikleti", "bisiklet", "ng750 dağ bisikleti", "ng750 dağ bisikleti 29 jant"]],
["salcano-helen-sehir-bisikleti-24-jant", "salcano-helen-sehir-bisikleti", "Salcano", "Helen Şehir Bisikleti 24 Jant", "24 Jant", "bike", 4000, 6900, 0.6, 12, 10499, 0, ["helen", "kadın bisikleti", "helen şehir bisikleti", "helen şehir bisikleti 24 jant", "salcano"]],
["salcano-helen-sehir-bisikleti-26-jant", "salcano-helen-sehir-bisikleti", "Salcano", "Helen Şehir Bisikleti 26 Jant", "26 Jant", "bike", 3200, 5400, 0.6, 12, 7999, 0, ["helen", "kadın bisikleti", "helen şehir bisikleti", "helen şehir bisikleti 26 jant", "salcano"]],
["kron-xc100-mtb-26-jant", "kron-xc100-mtb", "Kron", "XC100 MTB 26 Jant", "26 Jant", "bike", 3200, 5400, 0.6, 12, 8499, 0, ["kron", "xc100 mtb", "xc100 mtb 26 jant"]],
["kron-xc100-mtb-27-5-jant", "kron-xc100-mtb", "Kron", "XC100 MTB 27.5 Jant", "27.5 Jant", "bike", 3500, 6000, 0.6, 12, 9499, 0, ["kron", "xc100 mtb", "xc100 mtb 27.5 jant"]],
["kron-xc100-mtb-29-jant", "kron-xc100-mtb", "Kron", "XC100 MTB 29 Jant", "29 Jant", "bike", 4000, 6900, 0.6, 12, 10999, 0, ["kron", "xc100 mtb", "xc100 mtb 29 jant"]],
["kron-cx50-sehir-28-jant", "kron-cx50-sehir", "Kron", "CX50 Şehir 28 Jant", "28 Jant", "bike", 3200, 5500, 0.6, 12, 8499, 0, ["kron cx", "cx50 şehir", "cx50 şehir 28 jant", "kron"]],
["carraro-dag-bisikleti-26-jant", "carraro-dag-bisikleti", "Carraro", "Dağ Bisikleti 26 Jant", "26 Jant", "bike", 3400, 5800, 0.6, 12, 8999, 0, ["carraro", "dağ bisikleti", "dağ bisikleti 26 jant"]],
["carraro-dag-bisikleti-27-5-jant", "carraro-dag-bisikleti", "Carraro", "Dağ Bisikleti 27.5 Jant", "27.5 Jant", "bike", 3800, 6500, 0.6, 12, 9999, 0, ["carraro", "dağ bisikleti", "dağ bisikleti 27.5 jant"]],
["carraro-dag-bisikleti-29-jant", "carraro-dag-bisikleti", "Carraro", "Dağ Bisikleti 29 Jant", "29 Jant", "bike", 4400, 7500, 0.6, 12, 11499, 0, ["carraro", "dağ bisikleti", "dağ bisikleti 29 jant"]],
["bisan-sehir-bisikleti-26-jant", "bisan-sehir-bisikleti", "Bisan", "Şehir Bisikleti 26 Jant", "26 Jant", "bike", 2200, 4000, 0.6, 12, 6499, 0, ["bisan", "şehir bisikleti", "şehir bisikleti 26 jant"]],
["bisan-sehir-bisikleti-28-jant", "bisan-sehir-bisikleti", "Bisan", "Şehir Bisikleti 28 Jant", "28 Jant", "bike", 2600, 4700, 0.6, 12, 7999, 0, ["bisan", "şehir bisikleti", "şehir bisikleti 28 jant"]],
["corelli-snoop-dag-bisikleti-27-5-jant", "corelli-snoop-dag-bisikleti", "Corelli", "Snoop Dağ Bisikleti 27.5 Jant", "27.5 Jant", "bike", 3200, 5500, 0.6, 12, 8499, 0, ["corelli", "snoop dağ bisikleti", "snoop dağ bisikleti 27.5 jant"]],
["corelli-snoop-dag-bisikleti-29-jant", "corelli-snoop-dag-bisikleti", "Corelli", "Snoop Dağ Bisikleti 29 Jant", "29 Jant", "bike", 3700, 6300, 0.6, 12, 9999, 0, ["corelli", "snoop dağ bisikleti", "snoop dağ bisikleti 29 jant"]],
["mosso-771-mtb-27-5-jant", "mosso-771-mtb", "Mosso", "771 MTB 27.5 Jant", "27.5 Jant", "bike", 5500, 9000, 0.6, 12, 13999, 0, ["mosso", "771 mtb", "771 mtb 27.5 jant"]],
["mosso-771-mtb-29-jant", "mosso-771-mtb", "Mosso", "771 MTB 29 Jant", "29 Jant", "bike", 6300, 10400, 0.6, 12, 15999, 0, ["mosso", "771 mtb", "771 mtb 29 jant"]],
["bianchi-sehir-bisikleti-28-jant", "bianchi-sehir-bisikleti", "Bianchi", "Şehir Bisikleti 28 Jant", "28 Jant", "bike", 5800, 9400, 0.6, 12, 15499, 0, ["bianchi", "şehir bisikleti", "şehir bisikleti 28 jant"]],
["decathlon-rockrider-mtb-27-5-jant", "decathlon-rockrider-mtb", "Decathlon", "Rockrider MTB 27.5 Jant", "27.5 Jant", "bike", 4500, 7500, 0.6, 12, 11999, 0, ["rockrider", "decathlon", "rockrider mtb", "rockrider mtb 27.5 jant"]],
["decathlon-rockrider-mtb-29-jant", "decathlon-rockrider-mtb", "Decathlon", "Rockrider MTB 29 Jant", "29 Jant", "bike", 5200, 8600, 0.6, 12, 13999, 0, ["rockrider", "decathlon", "rockrider mtb", "rockrider mtb 29 jant"]],
["decathlon-elops-sehir-28-jant", "decathlon-elops-sehir", "Decathlon", "Elops Şehir 28 Jant", "28 Jant", "bike", 3700, 6300, 0.6, 12, 9499, 0, ["elops", "elops şehir", "elops şehir 28 jant", "decathlon"]],
["umit-cocuk-bisikleti-16-jant", "umit-cocuk-bisikleti", "Ümit", "Çocuk Bisikleti 16 Jant", "16 Jant", "bike", 800, 1600, 0.6, 12, 2999, 0, ["çocuk bisikleti", "çocuk bisikleti 16 jant", "ümit"]],
["umit-cocuk-bisikleti-20-jant", "umit-cocuk-bisikleti", "Ümit", "Çocuk Bisikleti 20 Jant", "20 Jant", "bike", 1000, 2000, 0.6, 12, 3499, 0, ["çocuk bisikleti", "çocuk bisikleti 20 jant", "ümit"]],
["umit-cocuk-bisikleti-24-jant", "umit-cocuk-bisikleti", "Ümit", "Çocuk Bisikleti 24 Jant", "24 Jant", "bike", 1200, 2300, 0.6, 12, 3999, 0, ["çocuk bisikleti", "çocuk bisikleti 24 jant", "ümit"]],
["btwin-cocuk-bisikleti-16-jant", "btwin-cocuk-bisikleti", "Btwin", "Çocuk Bisikleti 16 Jant", "16 Jant", "bike", 1200, 2200, 0.6, 12, 3499, 0, ["btwin", "çocuk bisikleti", "çocuk bisikleti 16 jant"]],
["btwin-cocuk-bisikleti-20-jant", "btwin-cocuk-bisikleti", "Btwin", "Çocuk Bisikleti 20 Jant", "20 Jant", "bike", 1500, 2800, 0.6, 12, 4499, 0, ["btwin", "çocuk bisikleti", "çocuk bisikleti 20 jant"]],
["xiaomi-elektrikli-scooter-pro-2", "xiaomi-elektrikli-scooter-pro-2", "Xiaomi", "Elektrikli Scooter Pro 2", "", "bike", 5000, 7800, 0.8, 10, 12999, 0, ["scooter", "elektrikli scooter", "elektrikli scooter pro 2", "xiaomi"]],
["xiaomi-elektrikli-scooter-4", "xiaomi-elektrikli-scooter-4", "Xiaomi", "Elektrikli Scooter 4", "", "bike", 6000, 9000, 0.8, 10, 14999, 0, ["scooter 4", "elektrikli scooter 4", "xiaomi"]],
["segway-ninebot-f2", "segway-ninebot-f2", "Segway", "Ninebot F2", "", "bike", 8000, 12000, 0.8, 10, 19999, 0, ["ninebot", "segway", "ninebot f2"]],
["segway-ninebot-g30-max", "segway-ninebot-g30-max", "Segway", "Ninebot G30 Max", "", "bike", 10000, 15000, 0.8, 10, 23999, 0, ["g30", "ninebot g30 max", "segway"]],
["rks-elektrikli-scooter", "rks-elektrikli-scooter", "RKS", "Elektrikli Scooter", "", "bike", 4000, 6500, 0.8, 10, 9999, 0, ["rks", "elektrikli scooter"]],
["arora-elektrikli-scooter", "arora-elektrikli-scooter", "Arora", "Elektrikli Scooter", "", "bike", 3500, 6000, 0.8, 10, 8999, 0, ["arora", "elektrikli scooter"]],
["volta-elektrikli-bisiklet-vsm", "volta-elektrikli-bisiklet-vsm", "Volta", "Elektrikli Bisiklet VSM", "", "bike", 9000, 14000, 0.8, 10, 21999, 0, ["volta", "elektrikli bisiklet", "elektrikli bisiklet vsm"]],
["volta-vb1-elektrikli", "volta-vb1-elektrikli", "Volta", "VB1 Elektrikli", "", "bike", 7500, 12000, 0.8, 10, 18999, 0, ["vb1", "vb1 elektrikli", "volta"]],
["i-stikbal-koltuk-takimi-3plus3plus1", "i-stikbal-koltuk-takimi-3plus3plus1", "İstikbal", "Koltuk Takımı (3+3+1)", "", "furniture", 9000, 16000, 0.9, 20, 34999, 0, ["koltuk takımı", "koltuk", "istikbal", "koltuk takımı (3+3+1)", "i̇stikbal"]],
["i-stikbal-kose-koltuk", "i-stikbal-kose-koltuk", "İstikbal", "Köşe Koltuk", "", "furniture", 11000, 19000, 0.9, 20, 44999, 0, ["köşe koltuk", "i̇stikbal"]],
["i-stikbal-cekyat", "i-stikbal-cekyat", "İstikbal", "Çekyat", "", "furniture", 4500, 8000, 0.6, 15, 15999, 0, ["çekyat", "cekyat", "i̇stikbal"]],
["i-stikbal-yatak-cift-kisilik", "i-stikbal-yatak-cift-kisilik", "İstikbal", "Yatak (Çift Kişilik)", "", "furniture", 4500, 8000, 0.6, 15, 16999, 0, ["istikbal yatak", "yatak (çift kişilik)", "i̇stikbal"]],
["i-stikbal-5-kapili-gardirop", "i-stikbal-5-kapili-gardirop", "İstikbal", "5 Kapılı Gardırop", "", "furniture", 6000, 10500, 0.9, 20, 21999, 0, ["istikbal gardırop", "5 kapılı gardırop", "i̇stikbal"]],
["i-stikbal-tv-unitesi", "i-stikbal-tv-unitesi", "İstikbal", "TV Ünitesi", "", "furniture", 3000, 5500, 0.6, 15, 10999, 0, ["tv ünitesi", "tv unitesi", "i̇stikbal"]],
["i-stikbal-yemek-masasi-takimi", "i-stikbal-yemek-masasi-takimi", "İstikbal", "Yemek Masası Takımı", "", "furniture", 6500, 11500, 0.9, 20, 22999, 0, ["yemek masası", "yemek masası takımı", "i̇stikbal"]],
["bellona-koltuk-takimi", "bellona-koltuk-takimi", "Bellona", "Koltuk Takımı", "", "furniture", 8500, 15000, 0.9, 20, 32999, 0, ["bellona koltuk", "koltuk takımı", "bellona"]],
["bellona-baza-plus-baslik-set", "bellona-baza-plus-baslik-set", "Bellona", "Baza + Başlık Set", "", "furniture", 5000, 9000, 0.6, 20, 18999, 0, ["baza", "bellona", "baza + başlık set"]],
["bellona-cift-kisilik-yatak", "bellona-cift-kisilik-yatak", "Bellona", "Çift Kişilik Yatak", "", "furniture", 4000, 7500, 0.6, 15, 14999, 0, ["yatak", "çift kişilik yatak", "bellona"]],
["bellona-cekyat", "bellona-cekyat", "Bellona", "Çekyat", "", "furniture", 4000, 7200, 0.6, 15, 13999, 0, ["bellona çekyat", "çekyat", "bellona"]],
["yatas-yatak-cift-kisilik", "yatas-yatak-cift-kisilik", "Yataş", "Yatak (Çift Kişilik)", "", "furniture", 6000, 10500, 0.9, 20, 21999, 0, ["yataş", "yatas", "yatak (çift kişilik)"]],
["yatas-baza-plus-baslik-set", "yatas-baza-plus-baslik-set", "Yataş", "Baza + Başlık Set", "", "furniture", 6500, 11000, 0.9, 20, 22999, 0, ["yataş baza", "baza + başlık set", "yataş"]],
["dogtas-yemek-odasi-takimi", "dogtas-yemek-odasi-takimi", "Doğtaş", "Yemek Odası Takımı", "", "furniture", 12000, 20000, 0.9, 20, 54999, 0, ["doğtaş", "dogtas", "yemek odası takımı"]],
["dogtas-koltuk-takimi", "dogtas-koltuk-takimi", "Doğtaş", "Koltuk Takımı", "", "furniture", 10000, 17500, 0.9, 20, 44999, 0, ["doğtaş koltuk", "koltuk takımı", "doğtaş"]],
["mondi-cekyat", "mondi-cekyat", "Mondi", "Çekyat", "", "furniture", 3200, 5800, 0.6, 15, 10999, 0, ["mondi", "çekyat"]],
["vivense-koltuk", "vivense-koltuk", "Vivense", "Koltuk", "", "furniture", 5500, 9500, 0.6, 20, 18999, 0, ["vivense", "koltuk"]],
["ikea-malm-sifonyer", "ikea-malm-sifonyer", "IKEA", "MALM Şifonyer", "", "furniture", 2500, 4500, 0.6, 15, 7999, 0, ["şifonyer", "malm", "malm şifonyer", "ikea"]],
["ikea-billy-kitaplik", "ikea-billy-kitaplik", "IKEA", "BILLY Kitaplık", "", "furniture", 1200, 2200, 0.6, 15, 3999, 0, ["kitaplık", "billy", "billy kitaplık", "ikea"]],
["ikea-kallax-raf", "ikea-kallax-raf", "IKEA", "KALLAX Raf", "", "furniture", 1500, 2800, 0.6, 15, 4999, 0, ["kallax", "raf", "kallax raf", "ikea"]],
["ikea-micke-calisma-masasi", "ikea-micke-calisma-masasi", "IKEA", "MICKE Çalışma Masası", "", "furniture", 1000, 2200, 0.6, 15, 3999, 0, ["çalışma masası", "masa", "micke", "micke çalışma masası", "ikea"]],
["ikea-poang-koltuk", "ikea-poang-koltuk", "IKEA", "POÄNG Koltuk", "", "furniture", 1800, 3200, 0.6, 15, 5999, 0, ["poäng", "poang", "poäng koltuk", "ikea"]],
["ikea-hemnes-yatak", "ikea-hemnes-yatak", "IKEA", "HEMNES Yatak", "", "furniture", 3500, 6000, 0.6, 15, 11999, 0, ["hemnes", "hemnes yatak", "ikea"]],
["ikea-lack-sehpa", "ikea-lack-sehpa", "IKEA", "LACK Sehpa", "", "furniture", 300, 600, 0.6, 15, 999, 0, ["sehpa", "lack", "lack sehpa", "ikea"]],
["ikea-besta-tv-unitesi", "ikea-besta-tv-unitesi", "IKEA", "BESTA TV Ünitesi", "", "furniture", 2200, 4000, 0.6, 15, 7499, 0, ["besta", "besta tv ünitesi", "ikea"]],
["ikea-ekedalen-yemek-masasi", "ikea-ekedalen-yemek-masasi", "IKEA", "EKEDALEN Yemek Masası", "", "furniture", 2800, 5000, 0.6, 15, 9499, 0, ["ekedalen", "ekedalen yemek masası", "ikea"]],
["xdrive-oyuncu-koltugu", "xdrive-oyuncu-koltugu", "xDrive", "Oyuncu Koltuğu", "", "furniture", 2500, 4500, 0.6, 15, 7999, 0, ["oyuncu koltuğu", "gaming koltuk", "xdrive"]],
["hawk-oyuncu-koltugu", "hawk-oyuncu-koltugu", "Hawk", "Oyuncu Koltuğu", "", "furniture", 2200, 4000, 0.6, 15, 6999, 0, ["hawk", "oyuncu koltuğu"]],
["seduna-ofis-koltugu", "seduna-ofis-koltugu", "Seduna", "Ofis Koltuğu", "", "furniture", 1500, 2800, 0.6, 15, 4999, 0, ["ofis koltuğu", "seduna"]],
["ikea-pax-gardirop-150-cm", "ikea-pax-gardirop", "IKEA", "PAX Gardırop 150 cm", "150 cm", "furniture", 2600, 4500, 0.9, 20, 8999, 0, ["gardırop", "gardirop", "pax", "ikea", "pax gardırop", "pax gardırop 150 cm"]],
["ikea-pax-gardirop-200-cm", "ikea-pax-gardirop", "IKEA", "PAX Gardırop 200 cm", "200 cm", "furniture", 3200, 5600, 0.9, 20, 10999, 0, ["gardırop", "gardirop", "pax", "ikea", "pax gardırop", "pax gardırop 200 cm"]],
["ikea-pax-gardirop-250-cm", "ikea-pax-gardirop", "IKEA", "PAX Gardırop 250 cm", "250 cm", "furniture", 4000, 7000, 0.9, 20, 13999, 0, ["gardırop", "gardirop", "pax", "ikea", "pax gardırop", "pax gardırop 250 cm"]],
["samsung-galaxy-s9-64-gb", "samsung-galaxy-s9", "Samsung", "Galaxy S9 64 GB", "64 GB", "phone", 5500, 7500, 0.6, 9, 0, 0, ["s9", "galaxy s9", "galaxy s9 64 gb", "samsung"]],
["samsung-galaxy-a14-128-gb", "samsung-galaxy-a14", "Samsung", "Galaxy A14 128 GB", "128 GB", "phone", 5500, 7500, 0.5, 9, 9999, 0, ["a14", "galaxy a14", "galaxy a14 128 gb", "samsung"]],
["samsung-galaxy-a14-256-gb", "samsung-galaxy-a14", "Samsung", "Galaxy A14 256 GB", "256 GB", "phone", 6000, 8200, 0.5, 9, 10999, 0, ["a14", "galaxy a14", "galaxy a14 256 gb", "samsung"]],
["samsung-galaxy-a15-128-gb", "samsung-galaxy-a15", "Samsung", "Galaxy A15 128 GB", "128 GB", "phone", 6500, 9000, 0.55, 9, 11999, 0, ["a15", "galaxy a15", "galaxy a15 128 gb", "samsung"]],
["samsung-galaxy-a15-256-gb", "samsung-galaxy-a15", "Samsung", "Galaxy A15 256 GB", "256 GB", "phone", 7100, 9800, 0.55, 9, 12999, 0, ["a15", "galaxy a15", "galaxy a15 256 gb", "samsung"]],
["samsung-galaxy-a16-128-gb", "samsung-galaxy-a16", "Samsung", "Galaxy A16 128 GB", "128 GB", "phone", 7500, 10000, 0.55, 9, 13499, 1, ["a16", "galaxy a16", "galaxy a16 128 gb", "samsung"]],
["samsung-galaxy-a16-256-gb", "samsung-galaxy-a16", "Samsung", "Galaxy A16 256 GB", "256 GB", "phone", 8200, 10900, 0.55, 9, 14499, 1, ["a16", "galaxy a16", "galaxy a16 256 gb", "samsung"]],
["samsung-galaxy-a23-128-gb", "samsung-galaxy-a23", "Samsung", "Galaxy A23 128 GB", "128 GB", "phone", 5500, 7500, 0.5, 10, 0, 0, ["a23", "galaxy a23", "galaxy a23 128 gb", "samsung"]],
["samsung-galaxy-a23-256-gb", "samsung-galaxy-a23", "Samsung", "Galaxy A23 256 GB", "256 GB", "phone", 6000, 8200, 0.5, 10, 0, 0, ["a23", "galaxy a23", "galaxy a23 256 gb", "samsung"]],
["samsung-galaxy-a33-128-gb", "samsung-galaxy-a33", "Samsung", "Galaxy A33 128 GB", "128 GB", "phone", 7000, 9500, 0.55, 9, 0, 0, ["a33", "galaxy a33", "galaxy a33 128 gb", "samsung"]],
["samsung-galaxy-a33-256-gb", "samsung-galaxy-a33", "Samsung", "Galaxy A33 256 GB", "256 GB", "phone", 7600, 10400, 0.55, 9, 0, 0, ["a33", "galaxy a33", "galaxy a33 256 gb", "samsung"]],
["samsung-galaxy-a53-128-gb", "samsung-galaxy-a53", "Samsung", "Galaxy A53 128 GB", "128 GB", "phone", 8000, 11000, 0.6, 9, 0, 0, ["a53", "galaxy a53", "galaxy a53 128 gb", "samsung"]],
["samsung-galaxy-a53-256-gb", "samsung-galaxy-a53", "Samsung", "Galaxy A53 256 GB", "256 GB", "phone", 8700, 12000, 0.6, 9, 0, 0, ["a53", "galaxy a53", "galaxy a53 256 gb", "samsung"]],
["samsung-galaxy-a56-128-gb", "samsung-galaxy-a56", "Samsung", "Galaxy A56 128 GB", "128 GB", "phone", 14000, 18000, 0.8, 8, 20999, 1, ["a56", "galaxy a56", "galaxy a56 128 gb", "samsung"]],
["samsung-galaxy-a56-256-gb", "samsung-galaxy-a56", "Samsung", "Galaxy A56 256 GB", "256 GB", "phone", 15300, 19600, 0.8, 8, 23999, 1, ["a56", "galaxy a56", "galaxy a56 256 gb", "samsung"]],
["samsung-galaxy-s24-fe-128-gb", "samsung-galaxy-s24-fe", "Samsung", "Galaxy S24 FE 128 GB", "128 GB", "phone", 20400, 26100, 1.1, 6, 28999, 1, ["s24 fe", "galaxy s24 fe", "galaxy s24 fe 128 gb", "samsung"]],
["samsung-galaxy-s24-fe-256-gb", "samsung-galaxy-s24-fe", "Samsung", "Galaxy S24 FE 256 GB", "256 GB", "phone", 22500, 28800, 1.1, 6, 31999, 1, ["s24 fe", "galaxy s24 fe", "galaxy s24 fe 256 gb", "samsung"]],
["samsung-galaxy-s25plus-256-gb", "samsung-galaxy-s25plus", "Samsung", "Galaxy S25+ 256 GB", "256 GB", "phone", 42100, 54000, 1.5, 5, 59999, 1, ["s25+", "s25 plus", "galaxy s25+", "galaxy s25+ 256 gb", "samsung"]],
["samsung-galaxy-s25plus-512-gb", "samsung-galaxy-s25plus", "Samsung", "Galaxy S25+ 512 GB", "512 GB", "phone", 55200, 67200, 1.5, 5, 69999, 1, ["s25+", "s25 plus", "galaxy s25+", "galaxy s25+ 512 gb", "samsung"]],
["xiaomi-redmi-note-9-pro-128-gb", "xiaomi-redmi-note-9-pro", "Xiaomi", "Redmi Note 9 Pro 128 GB", "128 GB", "phone", 4200, 6000, 0.45, 10, 0, 0, ["note 9 pro", "redmi note 9 pro", "redmi note 9 pro 128 gb", "xiaomi"]],
["xiaomi-redmi-note-9-pro-256-gb", "xiaomi-redmi-note-9-pro", "Xiaomi", "Redmi Note 9 Pro 256 GB", "256 GB", "phone", 4600, 6500, 0.45, 10, 0, 0, ["note 9 pro", "redmi note 9 pro", "redmi note 9 pro 256 gb", "xiaomi"]],
["xiaomi-redmi-note-10-pro-128-gb", "xiaomi-redmi-note-10-pro", "Xiaomi", "Redmi Note 10 Pro 128 GB", "128 GB", "phone", 5200, 7200, 0.5, 9, 0, 0, ["note 10 pro", "redmi note 10 pro", "redmi note 10 pro 128 gb", "xiaomi"]],
["xiaomi-redmi-note-10-pro-256-gb", "xiaomi-redmi-note-10-pro", "Xiaomi", "Redmi Note 10 Pro 256 GB", "256 GB", "phone", 5700, 7800, 0.5, 9, 0, 0, ["note 10 pro", "redmi note 10 pro", "redmi note 10 pro 256 gb", "xiaomi"]],
["xiaomi-redmi-note-11-pro-128-gb", "xiaomi-redmi-note-11-pro", "Xiaomi", "Redmi Note 11 Pro 128 GB", "128 GB", "phone", 6000, 8200, 0.5, 9, 0, 0, ["note 11 pro", "redmi note 11 pro", "redmi note 11 pro 128 gb", "xiaomi"]],
["xiaomi-redmi-note-11-pro-256-gb", "xiaomi-redmi-note-11-pro", "Xiaomi", "Redmi Note 11 Pro 256 GB", "256 GB", "phone", 6500, 8900, 0.5, 9, 0, 0, ["note 11 pro", "redmi note 11 pro", "redmi note 11 pro 256 gb", "xiaomi"]],
["xiaomi-redmi-note-12-pro-128-gb", "xiaomi-redmi-note-12-pro", "Xiaomi", "Redmi Note 12 Pro 128 GB", "128 GB", "phone", 7500, 10000, 0.55, 9, 13999, 0, ["note 12 pro", "redmi note 12 pro", "redmi note 12 pro 128 gb", "xiaomi"]],
["xiaomi-redmi-note-12-pro-256-gb", "xiaomi-redmi-note-12-pro", "Xiaomi", "Redmi Note 12 Pro 256 GB", "256 GB", "phone", 8200, 10900, 0.55, 9, 15499, 0, ["note 12 pro", "redmi note 12 pro", "redmi note 12 pro 256 gb", "xiaomi"]],
["xiaomi-poco-f6-256-gb", "xiaomi-poco-f6", "Xiaomi", "Poco F6 256 GB", "256 GB", "phone", 18500, 24000, 0.8, 8, 32499, 1, ["poco f6", "poco f6 256 gb", "xiaomi"]],
["xiaomi-poco-f6-512-gb", "xiaomi-poco-f6", "Xiaomi", "Poco F6 512 GB", "512 GB", "phone", 20400, 26400, 0.8, 8, 35999, 1, ["poco f6", "poco f6 512 gb", "xiaomi"]],
["xiaomi-poco-c65-128-gb", "xiaomi-poco-c65", "Xiaomi", "Poco C65 128 GB", "128 GB", "phone", 3800, 5400, 0.4, 10, 6999, 0, ["c65", "poco c65", "poco c65 128 gb", "xiaomi"]],
["xiaomi-poco-c65-256-gb", "xiaomi-poco-c65", "Xiaomi", "Poco C65 256 GB", "256 GB", "phone", 4100, 5900, 0.4, 10, 7499, 0, ["c65", "poco c65", "poco c65 256 gb", "xiaomi"]],
["oppo-a96-128-gb", "oppo-a96", "Oppo", "A96 128 GB", "128 GB", "phone", 6500, 8800, 0.5, 10, 0, 0, ["a96", "a96 128 gb", "oppo"]],
["oppo-reno-6-128-gb", "oppo-reno-6", "Oppo", "Reno 6 128 GB", "128 GB", "phone", 7000, 9500, 0.55, 9, 0, 0, ["reno 6", "reno 6 128 gb", "oppo"]],
["huawei-p-smart-2021-128-gb", "huawei-p-smart-2021", "Huawei", "P Smart 2021 128 GB", "128 GB", "phone", 3200, 4600, 0.4, 10, 0, 0, ["p smart", "p smart 2021", "p smart 2021 128 gb", "huawei"]],
["honor-magic5-lite-256-gb", "honor-magic5-lite", "Honor", "Magic5 Lite 256 GB", "256 GB", "phone", 8200, 10900, 0.55, 9, 0, 0, ["magic5", "magic5 lite", "magic5 lite 256 gb", "honor"]],
["realme-8-128-gb", "realme-8", "Realme", "8 128 GB", "128 GB", "phone", 5200, 7200, 0.5, 10, 0, 0, ["realme 8", "8", "8 128 gb", "realme"]],
["realme-8-256-gb", "realme-8", "Realme", "8 256 GB", "256 GB", "phone", 5700, 7800, 0.5, 10, 0, 0, ["realme 8", "8", "8 256 gb", "realme"]],
["realme-note-50-128-gb", "realme-note-50", "Realme", "Note 50 128 GB", "128 GB", "phone", 3200, 4600, 0.4, 10, 5999, 0, ["note 50", "note 50 128 gb", "realme"]],
["realme-note-50-256-gb", "realme-note-50", "Realme", "Note 50 256 GB", "256 GB", "phone", 3500, 5000, 0.4, 10, 6499, 0, ["note 50", "note 50 256 gb", "realme"]],
["infinix-smart-8-64-gb", "infinix-smart-8", "Infinix", "Smart 8 64 GB", "64 GB", "phone", 3000, 4400, 0.35, 11, 5499, 0, ["smart 8", "smart 8 64 gb", "infinix"]],
["infinix-smart-8-128-gb", "infinix-smart-8", "Infinix", "Smart 8 128 GB", "128 GB", "phone", 3000, 4400, 0.35, 11, 5499, 0, ["smart 8", "smart 8 128 gb", "infinix"]],
["tecno-pova-5-256-gb", "tecno-pova-5", "Tecno", "Pova 5 256 GB", "256 GB", "phone", 6000, 8200, 0.45, 10, 10499, 0, ["pova", "pova 5", "pova 5 256 gb", "tecno"]],
["vivo-v29-lite-256-gb", "vivo-v29-lite", "vivo", "V29 Lite 256 GB", "256 GB", "phone", 9300, 12500, 0.6, 9, 17499, 0, ["v29", "v29 lite", "v29 lite 256 gb", "vivo"]],
["samsung-qled-q80d-55i", "samsung-qled-q80d", "Samsung", "QLED Q80D 55\"", "55\"", "tv", 25000, 33000, 1.0, 12, 42999, 0, ["q80", "qled q80d", "qled q80d 55\"", "samsung"]],
["samsung-qled-q80d-65i", "samsung-qled-q80d", "Samsung", "QLED Q80D 65\"", "65\"", "tv", 34000, 45000, 1.3, 14, 58499, 0, ["q80", "qled q80d", "qled q80d 65\"", "samsung"]],
["samsung-crystal-cu7000-43i", "samsung-crystal-cu7000", "Samsung", "Crystal CU7000 43\"", "43\"", "tv", 7500, 10500, 0.7, 12, 13499, 0, ["cu7000", "crystal cu7000", "crystal cu7000 43\"", "samsung"]],
["samsung-crystal-cu7000-50i", "samsung-crystal-cu7000", "Samsung", "Crystal CU7000 50\"", "50\"", "tv", 9500, 13500, 0.8, 12, 17499, 0, ["cu7000", "crystal cu7000", "crystal cu7000 50\"", "samsung"]],
["samsung-crystal-cu7000-55i", "samsung-crystal-cu7000", "Samsung", "Crystal CU7000 55\"", "55\"", "tv", 11500, 16500, 1.0, 12, 21499, 0, ["cu7000", "crystal cu7000", "crystal cu7000 55\"", "samsung"]],
["samsung-crystal-cu7000-65i", "samsung-crystal-cu7000", "Samsung", "Crystal CU7000 65\"", "65\"", "tv", 16500, 23500, 1.3, 14, 30499, 0, ["cu7000", "crystal cu7000", "crystal cu7000 65\"", "samsung"]],
["lg-uhd-ur78-43i", "lg-uhd-ur78", "LG", "UHD UR78 43\"", "43\"", "tv", 7200, 10200, 0.7, 12, 13499, 0, ["ur78", "uhd ur78", "uhd ur78 43\""]],
["lg-uhd-ur78-50i", "lg-uhd-ur78", "LG", "UHD UR78 50\"", "50\"", "tv", 9000, 12800, 0.8, 12, 16499, 0, ["ur78", "uhd ur78", "uhd ur78 50\""]],
["lg-uhd-ur78-55i", "lg-uhd-ur78", "LG", "UHD UR78 55\"", "55\"", "tv", 11000, 16000, 1.0, 12, 20999, 0, ["ur78", "uhd ur78", "uhd ur78 55\""]],
["lg-uhd-ur78-65i", "lg-uhd-ur78", "LG", "UHD UR78 65\"", "65\"", "tv", 16000, 23000, 1.3, 14, 29999, 0, ["ur78", "uhd ur78", "uhd ur78 65\""]],
["sony-bravia-x75wl-43i", "sony-bravia-x75wl", "Sony", "Bravia X75WL 43\"", "43\"", "tv", 10500, 14500, 0.7, 12, 18999, 0, ["x75", "bravia x75wl", "bravia x75wl 43\"", "sony"]],
["sony-bravia-x75wl-50i", "sony-bravia-x75wl", "Sony", "Bravia X75WL 50\"", "50\"", "tv", 12500, 17500, 0.8, 12, 22999, 0, ["x75", "bravia x75wl", "bravia x75wl 50\"", "sony"]],
["sony-bravia-x75wl-55i", "sony-bravia-x75wl", "Sony", "Bravia X75WL 55\"", "55\"", "tv", 14500, 20000, 1.0, 12, 25999, 0, ["x75", "bravia x75wl", "bravia x75wl 55\"", "sony"]],
["hisense-a6k-4k-43i", "hisense-a6k-4k", "Hisense", "A6K 4K 43\"", "43\"", "tv", 6000, 8800, 0.7, 12, 11499, 0, ["a6k", "a6k 4k", "a6k 4k 43\"", "hisense"]],
["hisense-a6k-4k-50i", "hisense-a6k-4k", "Hisense", "A6K 4K 50\"", "50\"", "tv", 7500, 11000, 0.8, 12, 14499, 0, ["a6k", "a6k 4k", "a6k 4k 50\"", "hisense"]],
["hisense-a6k-4k-55i", "hisense-a6k-4k", "Hisense", "A6K 4K 55\"", "55\"", "tv", 9000, 13000, 1.0, 12, 16999, 0, ["a6k", "a6k 4k", "a6k 4k 55\"", "hisense"]],
["hisense-a6k-4k-65i", "hisense-a6k-4k", "Hisense", "A6K 4K 65\"", "65\"", "tv", 13000, 18500, 1.3, 14, 23999, 0, ["a6k", "a6k 4k", "a6k 4k 65\"", "hisense"]],
["philips-pus7008-43i", "philips-pus7008", "Philips", "PUS7008 43\"", "43\"", "tv", 8000, 11000, 0.7, 12, 14499, 0, ["pus7008", "pus7008 43\"", "philips"]],
["philips-pus7008-50i", "philips-pus7008", "Philips", "PUS7008 50\"", "50\"", "tv", 9500, 13000, 0.8, 12, 16999, 0, ["pus7008", "pus7008 50\"", "philips"]],
["philips-pus7008-55i", "philips-pus7008", "Philips", "PUS7008 55\"", "55\"", "tv", 11000, 15000, 1.0, 12, 19499, 0, ["pus7008", "pus7008 55\"", "philips"]],
["beko-4k-smart-tv-43i", "beko-4k-smart-tv", "Beko", "4K Smart TV 43\"", "43\"", "tv", 5800, 8500, 0.7, 12, 10999, 0, ["beko tv", "beko televizyon", "beko 43", "4k smart tv", "4k smart tv 43\"", "beko"]],
["beko-4k-smart-tv-50i", "beko-4k-smart-tv", "Beko", "4K Smart TV 50\"", "50\"", "tv", 7000, 10000, 0.8, 12, 12999, 0, ["beko tv", "beko televizyon", "beko 50", "4k smart tv", "4k smart tv 50\"", "beko"]],
["beko-4k-smart-tv-55i", "beko-4k-smart-tv", "Beko", "4K Smart TV 55\"", "55\"", "tv", 8000, 11500, 1.0, 12, 14999, 0, ["beko tv", "beko televizyon", "beko 55", "4k smart tv", "4k smart tv 55\"", "beko"]],
["finlux-4k-smart-tv-32i", "finlux-4k-smart-tv", "Finlux", "4K Smart TV 32\"", "32\"", "tv", 2400, 3600, 0.55, 12, 4499, 0, ["finlux", "finlux 32", "finlux tv", "4k smart tv", "4k smart tv 32\""]],
["finlux-4k-smart-tv-43i", "finlux-4k-smart-tv", "Finlux", "4K Smart TV 43\"", "43\"", "tv", 4600, 6800, 0.7, 12, 8999, 0, ["finlux", "finlux 43", "finlux tv", "4k smart tv", "4k smart tv 43\""]],
["finlux-4k-smart-tv-55i", "finlux-4k-smart-tv", "Finlux", "4K Smart TV 55\"", "55\"", "tv", 6200, 9200, 1.0, 12, 11999, 0, ["finlux", "finlux 55", "finlux tv", "4k smart tv", "4k smart tv 55\""]],
["hi-level-4k-smart-tv-32i", "hi-level-4k-smart-tv", "Hi-Level", "4K Smart TV 32\"", "32\"", "tv", 2400, 3600, 0.55, 12, 4499, 0, ["hi-level", "hilevel", "hi-level 32", "hi-level tv", "4k smart tv", "4k smart tv 32\""]],
["hi-level-4k-smart-tv-43i", "hi-level-4k-smart-tv", "Hi-Level", "4K Smart TV 43\"", "43\"", "tv", 4600, 6800, 0.7, 12, 8999, 0, ["hi-level", "hilevel", "hi-level 43", "hi-level tv", "4k smart tv", "4k smart tv 43\""]],
["hi-level-4k-smart-tv-55i", "hi-level-4k-smart-tv", "Hi-Level", "4K Smart TV 55\"", "55\"", "tv", 6200, 9200, 1.0, 12, 11999, 0, ["hi-level", "hilevel", "hi-level 55", "hi-level tv", "4k smart tv", "4k smart tv 55\""]],
["profilo-4k-smart-tv-43i", "profilo-4k-smart-tv", "Profilo", "4K Smart TV 43\"", "43\"", "tv", 5000, 7400, 0.7, 12, 9499, 0, ["profilo tv", "profilo 43", "4k smart tv", "4k smart tv 43\"", "profilo"]],
["profilo-4k-smart-tv-50i", "profilo-4k-smart-tv", "Profilo", "4K Smart TV 50\"", "50\"", "tv", 6000, 8800, 0.8, 12, 11499, 0, ["profilo tv", "profilo 50", "4k smart tv", "4k smart tv 50\"", "profilo"]],
["profilo-4k-smart-tv-55i", "profilo-4k-smart-tv", "Profilo", "4K Smart TV 55\"", "55\"", "tv", 7000, 10200, 1.0, 12, 13499, 0, ["profilo tv", "profilo 55", "4k smart tv", "4k smart tv 55\"", "profilo"]],
["nvidia-rtx-3060-12gb-ekran-karti", "nvidia-rtx-3060-12gb-ekran-karti", "Nvidia", "RTX 3060 12GB Ekran Kartı", "", "laptop", 7500, 10500, 0.6, 10, 0, 0, ["rtx 3060", "ekran kartı", "ekran karti", "rtx 3060 12gb ekran kartı", "nvidia"]],
["nvidia-rtx-3070-ekran-karti", "nvidia-rtx-3070-ekran-karti", "Nvidia", "RTX 3070 Ekran Kartı", "", "laptop", 10500, 14000, 0.6, 10, 0, 0, ["rtx 3070", "rtx 3070 ekran kartı", "nvidia"]],
["nvidia-rtx-4060-ekran-karti", "nvidia-rtx-4060-ekran-karti", "Nvidia", "RTX 4060 Ekran Kartı", "", "laptop", 11500, 15000, 0.6, 10, 18999, 0, ["rtx 4060", "rtx 4060 ekran kartı", "nvidia"]],
["nvidia-gtx-1660-super-ekran-karti", "nvidia-gtx-1660-super-ekran-karti", "Nvidia", "GTX 1660 Super Ekran Kartı", "", "laptop", 4500, 6500, 0.6, 10, 0, 0, ["gtx 1660", "1660 super", "gtx 1660 super ekran kartı", "nvidia"]],
["amd-rx-580-ekran-karti", "amd-rx-580-ekran-karti", "AMD", "RX 580 Ekran Kartı", "", "laptop", 2800, 4200, 0.6, 10, 0, 0, ["rx 580", "rx 580 ekran kartı", "amd"]],
["logitech-g502-mouse", "logitech-g502-mouse", "Logitech", "G502 Mouse", "", "laptop", 1200, 1900, 0.6, 10, 2999, 0, ["g502", "logitech", "mouse", "g502 mouse"]],
["logitech-mx-master-3s", "logitech-mx-master-3s", "Logitech", "MX Master 3S", "", "laptop", 2800, 4200, 0.6, 10, 5999, 0, ["mx master", "mx master 3s", "logitech"]],
["razer-blackwidow-klavye", "razer-blackwidow-klavye", "Razer", "BlackWidow Klavye", "", "laptop", 2500, 3900, 0.6, 10, 5999, 0, ["razer", "mekanik klavye", "blackwidow klavye"]],
["tp-link-archer-ax55-modem", "tp-link-archer-ax55-modem", "TP-Link", "Archer AX55 Modem", "", "laptop", 1800, 2800, 0.6, 10, 4499, 0, ["modem", "tp-link", "router", "archer ax55 modem"]],
["keenetic-hopper-modem", "keenetic-hopper-modem", "Keenetic", "Hopper Modem", "", "laptop", 2500, 3800, 0.6, 10, 5999, 0, ["keenetic", "hopper modem"]],
["asus-rt-ax58u-modem", "asus-rt-ax58u-modem", "Asus", "RT-AX58U Modem", "", "laptop", 2800, 4300, 0.6, 10, 6499, 0, ["asus modem", "rt-ax58u modem", "asus"]],
["apple-macbook-pro-16-m1-pro-16-512-gb", "apple-macbook-pro-16-m1-pro", "Apple", "MacBook Pro 16 M1 Pro 16/512 GB", "16/512 GB", "laptop", 67100, 85400, 0.9, 9, 0, 0, ["macbook pro 16 m1 pro", "macbook pro 16 m1 pro 16/512 gb", "apple"]],
["apple-mac-studio-m1-max", "apple-mac-studio-m1-max", "Apple", "Mac Studio M1 Max", "", "laptop", 45000, 58000, 0.9, 9, 0, 0, ["mac studio m1 max", "apple"]],
["hp-15s-i5-8-gb", "hp-15s", "HP", "15s i5 / 8 GB", "i5 / 8 GB", "laptop", 10100, 14300, 0.9, 9, 16499, 0, ["15s", "15s i5 / 8 gb"]],
["hp-15s-i5-16-gb", "hp-15s", "HP", "15s i5 / 16 GB", "i5 / 16 GB", "laptop", 11000, 15500, 0.9, 9, 17999, 0, ["15s", "15s i5 / 16 gb"]],
["asus-x540-i5-8-gb", "asus-x540", "Asus", "X540 i5 / 8 GB", "i5 / 8 GB", "laptop", 6000, 8700, 0.9, 9, 0, 0, ["x540", "x540 i5 / 8 gb", "asus"]],
["acer-predator-helios-rtx-4060", "acer-predator-helios", "Acer", "Predator Helios RTX 4060", "RTX 4060", "laptop", 41500, 53700, 0.9, 9, 69499, 0, ["predator helios", "predator helios rtx 4060", "acer"]],
["msi-gf63-thin-rtx-3050", "msi-gf63-thin", "MSI", "GF63 Thin RTX 3050", "RTX 3050", "laptop", 17100, 22500, 0.9, 9, 27999, 0, ["gf63 thin", "gf63 thin rtx 3050", "msi"]],
["monster-huma-h4-i5-16-gb", "monster-huma-h4", "Monster", "Huma H4 i5 / 16 GB", "i5 / 16 GB", "laptop", 15000, 20000, 0.9, 9, 24999, 0, ["huma h4", "huma h4 i5 / 16 gb", "monster"]],
["casper-excalibur-g870-rtx-4060", "casper-excalibur-g870", "Casper", "Excalibur G870 RTX 4060", "RTX 4060", "laptop", 34200, 43900, 0.9, 9, 54999, 0, ["excalibur g870", "excalibur g870 rtx 4060", "casper"]],
["apple-ipad-6-nesil-32-gb", "apple-ipad-6-nesil", "Apple", "iPad 6. Nesil 32 GB", "32 GB", "tablet", 5500, 7800, 0.6, 11, 0, 0, ["ipad 6", "ipad 6. nesil", "ipad 6. nesil 32 gb", "apple"]],
["apple-ipad-6-nesil-128-gb", "apple-ipad-6-nesil", "Apple", "iPad 6. Nesil 128 GB", "128 GB", "tablet", 5500, 7800, 0.6, 11, 0, 0, ["ipad 6", "ipad 6. nesil", "ipad 6. nesil 128 gb", "apple"]],
["apple-ipad-mini-5-64-gb", "apple-ipad-mini-5", "Apple", "iPad mini 5 64 GB", "64 GB", "tablet", 11000, 14500, 0.6, 11, 0, 0, ["mini 5", "ipad mini 5", "ipad mini 5 64 gb", "apple"]],
["apple-ipad-mini-5-256-gb", "apple-ipad-mini-5", "Apple", "iPad mini 5 256 GB", "256 GB", "tablet", 12000, 15800, 0.6, 11, 0, 0, ["mini 5", "ipad mini 5", "ipad mini 5 256 gb", "apple"]],
["samsung-galaxy-tab-s7-fe-64-gb", "samsung-galaxy-tab-s7-fe", "Samsung", "Galaxy Tab S7 FE 64 GB", "64 GB", "tablet", 10000, 13500, 0.6, 11, 0, 0, ["s7 fe", "galaxy tab s7 fe", "galaxy tab s7 fe 64 gb", "samsung"]],
["samsung-galaxy-tab-s7-fe-128-gb", "samsung-galaxy-tab-s7-fe", "Samsung", "Galaxy Tab S7 FE 128 GB", "128 GB", "tablet", 10000, 13500, 0.6, 11, 0, 0, ["s7 fe", "galaxy tab s7 fe", "galaxy tab s7 fe 128 gb", "samsung"]],
["samsung-galaxy-tab-a-10-1-2019-32-gb", "samsung-galaxy-tab-a-10-1-2019", "Samsung", "Galaxy Tab A 10.1 (2019) 32 GB", "32 GB", "tablet", 3500, 5000, 0.6, 11, 0, 0, ["tab a 10", "galaxy tab a 10.1 (2019)", "galaxy tab a 10.1 (2019) 32 gb", "samsung"]],
["lenovo-tab-m8-32-gb", "lenovo-tab-m8", "Lenovo", "Tab M8 32 GB", "32 GB", "tablet", 2800, 4000, 0.6, 11, 5499, 0, ["tab m8", "tab m8 32 gb", "lenovo"]],
["apple-watch-series-4-40mm", "apple-watch-series-4", "Apple", "Watch Series 4 40mm", "40mm", "watch", 3500, 5000, 0.6, 10, 0, 0, ["series 4", "watch series 4", "watch series 4 40mm", "apple"]],
["apple-watch-series-4-44mm", "apple-watch-series-4", "Apple", "Watch Series 4 44mm", "44mm", "watch", 3800, 5400, 0.6, 10, 0, 0, ["series 4", "watch series 4", "watch series 4 44mm", "apple"]],
["apple-watch-series-5-40mm", "apple-watch-series-5", "Apple", "Watch Series 5 40mm", "40mm", "watch", 4200, 6000, 0.6, 10, 0, 0, ["series 5", "watch series 5", "watch series 5 40mm", "apple"]],
["apple-watch-series-5-44mm", "apple-watch-series-5", "Apple", "Watch Series 5 44mm", "44mm", "watch", 4500, 6500, 0.6, 10, 0, 0, ["series 5", "watch series 5", "watch series 5 44mm", "apple"]],
["samsung-galaxy-watch-active-2-40mm", "samsung-galaxy-watch-active-2", "Samsung", "Galaxy Watch Active 2 40mm", "40mm", "watch", 2800, 4200, 0.6, 10, 0, 0, ["active 2", "galaxy watch active 2", "galaxy watch active 2 40mm", "samsung"]],
["samsung-galaxy-watch-active-2-44mm", "samsung-galaxy-watch-active-2", "Samsung", "Galaxy Watch Active 2 44mm", "44mm", "watch", 3000, 4500, 0.6, 10, 0, 0, ["active 2", "galaxy watch active 2", "galaxy watch active 2 44mm", "samsung"]],
["amazfit-gtr-4", "amazfit-gtr-4", "Amazfit", "GTR 4", "", "watch", 4200, 6200, 0.6, 10, 7499, 0, ["gtr", "gtr 4", "amazfit"]],
["honor-band-7", "honor-band-7", "Honor", "Band 7", "", "watch", 700, 1200, 0.6, 10, 1499, 0, ["honor band", "band 7", "honor"]],
["apple-airpods-pro-1-nesil", "apple-airpods-pro-1-nesil", "Apple", "AirPods Pro (1. Nesil)", "", "headphone", 3800, 5400, 0.8, 10, 0, 0, ["airpods pro 1", "airpods pro (1. nesil)", "apple"]],
["sony-wh-1000xm3", "sony-wh-1000xm3", "Sony", "WH-1000XM3", "", "headphone", 4500, 6500, 0.8, 10, 0, 0, ["xm3", "wh-1000xm3", "sony"]],
["sony-wi-c100", "sony-wi-c100", "Sony", "WI-C100", "", "headphone", 700, 1200, 0.5, 10, 1499, 0, ["wi-c100", "sony"]],
["samsung-galaxy-buds-live", "samsung-galaxy-buds-live", "Samsung", "Galaxy Buds Live", "", "headphone", 1800, 2800, 0.5, 10, 0, 0, ["buds live", "galaxy buds live", "samsung"]],
["samsung-galaxy-buds-pro", "samsung-galaxy-buds-pro", "Samsung", "Galaxy Buds Pro", "", "headphone", 2500, 3800, 0.8, 10, 0, 0, ["buds pro", "galaxy buds pro", "samsung"]],
["jbl-wave-beam", "jbl-wave-beam", "JBL", "Wave Beam", "", "headphone", 1200, 1900, 0.5, 10, 2499, 0, ["wave beam", "jbl"]],
["haylou-gt1-pro", "haylou-gt1-pro", "Haylou", "GT1 Pro", "", "headphone", 400, 600, 0.3, 10, 999, 0, ["gt1", "gt1 pro", "haylou"]],
["edifier-x3", "edifier-x3", "Edifier", "X3", "", "headphone", 500, 800, 0.3, 10, 999, 0, ["edifier x3", "x3", "edifier"]],
["sony-dualsense-kol", "sony-dualsense-kol", "Sony", "DualSense Kol", "", "console", 1800, 2600, 0.6, 9, 3999, 0, ["dualsense", "ps5 kol", "dualsense kol", "sony"]],
["sony-dualshock-4-kol", "sony-dualshock-4-kol", "Sony", "DualShock 4 Kol", "", "console", 1100, 1700, 0.6, 9, 0, 0, ["dualshock", "ps4 kol", "dualshock 4 kol", "sony"]],
["microsoft-xbox-kablosuz-kol", "microsoft-xbox-kablosuz-kol", "Microsoft", "Xbox Kablosuz Kol", "", "console", 1600, 2400, 0.6, 9, 3499, 0, ["xbox kol", "xbox kablosuz kol", "microsoft"]],
["sony-ps4-fat-500-gb", "sony-ps4-fat", "Sony", "PS4 Fat 500 GB", "500 GB", "console", 7000, 9500, 0.6, 9, 0, 0, ["ps4 fat", "ps4 fat 500 gb", "sony"]],
["canon-eos-1300d", "canon-eos-1300d", "Canon", "EOS 1300D", "", "camera", 7000, 9800, 0.8, 11, 0, 0, ["1300d", "eos 1300d", "canon"]],
["canon-eos-600d", "canon-eos-600d", "Canon", "EOS 600D", "", "camera", 6000, 8500, 0.8, 11, 0, 0, ["600d", "eos 600d", "canon"]],
["nikon-d5300", "nikon-d5300", "Nikon", "D5300", "", "camera", 11000, 14500, 0.8, 11, 0, 0, ["d5300", "nikon"]],
["sony-a5100", "sony-a5100", "Sony", "A5100", "", "camera", 9500, 13000, 0.8, 11, 0, 0, ["a5100", "sony"]],
["canon-ef-s-55-250mm-lens", "canon-ef-s-55-250mm-lens", "Canon", "EF-S 55-250mm Lens", "", "camera", 3500, 5000, 0.8, 11, 0, 0, ["55-250", "ef-s 55-250mm lens", "canon"]],
["canon-ef-75-300mm-lens", "canon-ef-75-300mm-lens", "Canon", "EF 75-300mm Lens", "", "camera", 2800, 4000, 0.8, 11, 0, 0, ["75-300", "ef 75-300mm lens", "canon"]],
["nikon-af-p-70-300mm-lens", "nikon-af-p-70-300mm-lens", "Nikon", "AF-P 70-300mm Lens", "", "camera", 4500, 6300, 0.8, 11, 0, 0, ["70-300", "af-p 70-300mm lens", "nikon"]],
["sony-e-55-210mm-lens", "sony-e-55-210mm-lens", "Sony", "E 55-210mm Lens", "", "camera", 3800, 5400, 0.8, 11, 0, 0, ["55-210", "e 55-210mm lens", "sony"]],
["baymak-kombi-24-kw", "baymak-kombi", "Baymak", "Kombi 24 kW", "24 kW", "appliance", 8000, 12000, 1.0, 14, 21999, 0, ["kombi", "baymak kombi", "kombi 24 kw", "baymak"]],
["baymak-kombi-28-kw", "baymak-kombi", "Baymak", "Kombi 28 kW", "28 kW", "appliance", 9200, 13800, 1.0, 14, 25499, 0, ["kombi", "baymak kombi", "kombi 28 kw", "baymak"]],
["demirdokum-kombi-24-kw", "demirdokum-kombi", "Demirdöküm", "Kombi 24 kW", "24 kW", "appliance", 8500, 13000, 1.0, 14, 23999, 0, ["kombi", "demirdöküm kombi", "kombi 24 kw", "demirdöküm"]],
["demirdokum-kombi-28-kw", "demirdokum-kombi", "Demirdöküm", "Kombi 28 kW", "28 kW", "appliance", 9800, 14900, 1.0, 14, 27499, 0, ["kombi", "demirdöküm kombi", "kombi 28 kw", "demirdöküm"]],
["vaillant-kombi-24-kw", "vaillant-kombi", "Vaillant", "Kombi 24 kW", "24 kW", "appliance", 12000, 18000, 1.0, 14, 32999, 0, ["kombi", "vaillant kombi", "kombi 24 kw", "vaillant"]],
["vaillant-kombi-28-kw", "vaillant-kombi", "Vaillant", "Kombi 28 kW", "28 kW", "appliance", 13800, 20700, 1.0, 14, 37999, 0, ["kombi", "vaillant kombi", "kombi 28 kw", "vaillant"]],
["bosch-kombi-24-kw", "bosch-kombi", "Bosch", "Kombi 24 kW", "24 kW", "appliance", 11000, 16500, 1.0, 14, 29999, 0, ["kombi", "bosch kombi", "kombi 24 kw", "bosch"]],
["bosch-kombi-28-kw", "bosch-kombi", "Bosch", "Kombi 28 kW", "28 kW", "appliance", 12600, 19000, 1.0, 14, 34499, 0, ["kombi", "bosch kombi", "kombi 28 kw", "bosch"]],
["eca-kombi-24-kw", "eca-kombi", "ECA", "Kombi 24 kW", "24 kW", "appliance", 7500, 11500, 1.0, 14, 20999, 0, ["kombi", "eca kombi", "kombi 24 kw", "eca"]],
["eca-kombi-28-kw", "eca-kombi", "ECA", "Kombi 28 kW", "28 kW", "appliance", 8600, 13200, 1.0, 14, 23999, 0, ["kombi", "eca kombi", "kombi 28 kw", "eca"]],
["ariston-termosifon-50-lt", "ariston-termosifon", "Ariston", "Termosifon 50 Lt", "50 Lt", "appliance", 2400, 3700, 0.6, 15, 6499, 0, ["termosifon", "ariston termosifon", "termosifon 50 lt", "ariston"]],
["ariston-termosifon-65-lt", "ariston-termosifon", "Ariston", "Termosifon 65 Lt", "65 Lt", "appliance", 2800, 4400, 0.6, 15, 7499, 0, ["termosifon", "ariston termosifon", "termosifon 65 lt", "ariston"]],
["ariston-termosifon-80-lt", "ariston-termosifon", "Ariston", "Termosifon 80 Lt", "80 Lt", "appliance", 3200, 5100, 0.6, 15, 8499, 0, ["termosifon", "ariston termosifon", "termosifon 80 lt", "ariston"]],
["baymak-termosifon-50-lt", "baymak-termosifon", "Baymak", "Termosifon 50 Lt", "50 Lt", "appliance", 2100, 3400, 0.6, 15, 5999, 0, ["termosifon", "baymak termosifon", "termosifon 50 lt", "baymak"]],
["baymak-termosifon-65-lt", "baymak-termosifon", "Baymak", "Termosifon 65 Lt", "65 Lt", "appliance", 2500, 4000, 0.6, 15, 6999, 0, ["termosifon", "baymak termosifon", "termosifon 65 lt", "baymak"]],
["baymak-termosifon-80-lt", "baymak-termosifon", "Baymak", "Termosifon 80 Lt", "80 Lt", "appliance", 2900, 4600, 0.6, 15, 7999, 0, ["termosifon", "baymak termosifon", "termosifon 80 lt", "baymak"]],
["vestel-termosifon-50-lt", "vestel-termosifon", "Vestel", "Termosifon 50 Lt", "50 Lt", "appliance", 1900, 3100, 0.6, 15, 4999, 0, ["termosifon", "vestel termosifon", "termosifon 50 lt", "vestel"]],
["vestel-termosifon-65-lt", "vestel-termosifon", "Vestel", "Termosifon 65 Lt", "65 Lt", "appliance", 2200, 3600, 0.6, 15, 5999, 0, ["termosifon", "vestel termosifon", "termosifon 65 lt", "vestel"]],
["vestel-termosifon-80-lt", "vestel-termosifon", "Vestel", "Termosifon 80 Lt", "80 Lt", "appliance", 2500, 4100, 0.6, 15, 6999, 0, ["termosifon", "vestel termosifon", "termosifon 80 lt", "vestel"]],
["arcelik-termosifon-50-lt", "arcelik-termosifon", "Arçelik", "Termosifon 50 Lt", "50 Lt", "appliance", 2200, 3600, 0.6, 15, 5999, 0, ["termosifon", "arçelik termosifon", "termosifon 50 lt", "arçelik"]],
["arcelik-termosifon-65-lt", "arcelik-termosifon", "Arçelik", "Termosifon 65 Lt", "65 Lt", "appliance", 2600, 4200, 0.6, 15, 6999, 0, ["termosifon", "arçelik termosifon", "termosifon 65 lt", "arçelik"]],
["arcelik-termosifon-80-lt", "arcelik-termosifon", "Arçelik", "Termosifon 80 Lt", "80 Lt", "appliance", 3000, 4800, 0.6, 15, 7999, 0, ["termosifon", "arçelik termosifon", "termosifon 80 lt", "arçelik"]],
["vestel-mini-buzdolabi-buro-tipi", "vestel-mini-buzdolabi-buro-tipi", "Vestel", "Mini Buzdolabı (Büro Tipi)", "", "appliance", 2200, 3500, 0.5, 13, 5499, 0, ["mini buzdolabı", "büro tipi", "mini buzdolabı (büro tipi)", "vestel"]],
["ugur-mini-buzdolabi-buro-tipi", "ugur-mini-buzdolabi-buro-tipi", "Uğur", "Mini Buzdolabı (Büro Tipi)", "", "appliance", 2400, 3800, 0.5, 13, 5999, 0, ["mini buzdolabı", "büro tipi", "mini buzdolabı (büro tipi)", "uğur"]],
["regal-mini-buzdolabi-buro-tipi", "regal-mini-buzdolabi-buro-tipi", "Regal", "Mini Buzdolabı (Büro Tipi)", "", "appliance", 2000, 3200, 0.5, 13, 4999, 0, ["mini buzdolabı", "büro tipi", "mini buzdolabı (büro tipi)", "regal"]],
["daikin-klima-9000-btu", "daikin-klima", "Daikin", "Klima 9000 BTU", "9000 BTU", "appliance", 11900, 17800, 1.0, 12, 28999, 0, ["daikin klima", "klima", "klima 9000 btu", "daikin"]],
["daikin-klima-12000-btu", "daikin-klima", "Daikin", "Klima 12000 BTU", "12000 BTU", "appliance", 14000, 21000, 1.0, 12, 33999, 0, ["daikin klima", "klima", "klima 12000 btu", "daikin"]],
["daikin-klima-18000-btu", "daikin-klima", "Daikin", "Klima 18000 BTU", "18000 BTU", "appliance", 18200, 27300, 1.0, 12, 43999, 0, ["daikin klima", "klima", "klima 18000 btu", "daikin"]],
["daikin-klima-24000-btu", "daikin-klima", "Daikin", "Klima 24000 BTU", "24000 BTU", "appliance", 22400, 33600, 1.0, 12, 54499, 0, ["daikin klima", "klima", "klima 24000 btu", "daikin"]],
["lg-klima-9000-btu", "lg-klima", "LG", "Klima 9000 BTU", "9000 BTU", "appliance", 10200, 15300, 1.0, 12, 24499, 0, ["lg klima", "klima", "klima 9000 btu"]],
["lg-klima-12000-btu", "lg-klima", "LG", "Klima 12000 BTU", "12000 BTU", "appliance", 12000, 18000, 1.0, 12, 28999, 0, ["lg klima", "klima", "klima 12000 btu"]],
["lg-klima-18000-btu", "lg-klima", "LG", "Klima 18000 BTU", "18000 BTU", "appliance", 15600, 23400, 1.0, 12, 37499, 0, ["lg klima", "klima", "klima 18000 btu"]],
["lg-klima-24000-btu", "lg-klima", "LG", "Klima 24000 BTU", "24000 BTU", "appliance", 19200, 28800, 1.0, 12, 46499, 0, ["lg klima", "klima", "klima 24000 btu"]],
["bosch-klima-9000-btu", "bosch-klima", "Bosch", "Klima 9000 BTU", "9000 BTU", "appliance", 10600, 15700, 1.0, 12, 25499, 0, ["bosch klima", "klima", "klima 9000 btu", "bosch"]],
["bosch-klima-12000-btu", "bosch-klima", "Bosch", "Klima 12000 BTU", "12000 BTU", "appliance", 12500, 18500, 1.0, 12, 29999, 0, ["bosch klima", "klima", "klima 12000 btu", "bosch"]],
["bosch-klima-18000-btu", "bosch-klima", "Bosch", "Klima 18000 BTU", "18000 BTU", "appliance", 16200, 24000, 1.0, 12, 38999, 0, ["bosch klima", "klima", "klima 18000 btu", "bosch"]],
["bosch-klima-24000-btu", "bosch-klima", "Bosch", "Klima 24000 BTU", "24000 BTU", "appliance", 20000, 29600, 1.0, 12, 47999, 0, ["bosch klima", "klima", "klima 24000 btu", "bosch"]],
["samsung-galaxy-s21-ultra-128-gb", "samsung-galaxy-s21-ultra", "Samsung", "Galaxy S21 Ultra 128 GB", "128 GB", "phone", 16000, 21000, 1.0, 7, 0, 0, ["s21 ultra", "galaxy s21 ultra", "galaxy s21 ultra 128 gb", "samsung"]],
["samsung-galaxy-s21-ultra-256-gb", "samsung-galaxy-s21-ultra", "Samsung", "Galaxy S21 Ultra 256 GB", "256 GB", "phone", 17400, 22900, 1.0, 7, 0, 0, ["s21 ultra", "galaxy s21 ultra", "galaxy s21 ultra 256 gb", "samsung"]],
["samsung-galaxy-s21-ultra-512-gb", "samsung-galaxy-s21-ultra", "Samsung", "Galaxy S21 Ultra 512 GB", "512 GB", "phone", 19200, 25200, 1.0, 7, 0, 0, ["s21 ultra", "galaxy s21 ultra", "galaxy s21 ultra 512 gb", "samsung"]],
["samsung-galaxy-s20plus-128-gb", "samsung-galaxy-s20plus", "Samsung", "Galaxy S20+ 128 GB", "128 GB", "phone", 10000, 13500, 0.85, 8, 0, 0, ["s20+", "s20 plus", "galaxy s20+", "galaxy s20+ 128 gb", "samsung"]],
["samsung-galaxy-s20plus-256-gb", "samsung-galaxy-s20plus", "Samsung", "Galaxy S20+ 256 GB", "256 GB", "phone", 10900, 14700, 0.85, 8, 0, 0, ["s20+", "s20 plus", "galaxy s20+", "galaxy s20+ 256 gb", "samsung"]],
["samsung-galaxy-note-20-256-gb", "samsung-galaxy-note-20", "Samsung", "Galaxy Note 20 256 GB", "256 GB", "phone", 13100, 17400, 0.9, 8, 0, 0, ["note 20 standart", "galaxy note 20", "galaxy note 20 256 gb", "samsung"]],
["samsung-galaxy-a52s-128-gb", "samsung-galaxy-a52s", "Samsung", "Galaxy A52s 128 GB", "128 GB", "phone", 7000, 9500, 0.55, 9, 0, 0, ["a52s", "galaxy a52s", "galaxy a52s 128 gb", "samsung"]],
["samsung-galaxy-a52s-256-gb", "samsung-galaxy-a52s", "Samsung", "Galaxy A52s 256 GB", "256 GB", "phone", 7600, 10400, 0.55, 9, 0, 0, ["a52s", "galaxy a52s", "galaxy a52s 256 gb", "samsung"]],
["samsung-galaxy-a04s-64-gb", "samsung-galaxy-a04s", "Samsung", "Galaxy A04s 64 GB", "64 GB", "phone", 3800, 5400, 0.4, 10, 6999, 0, ["a04", "galaxy a04s", "galaxy a04s 64 gb", "samsung"]],
["samsung-galaxy-a04s-128-gb", "samsung-galaxy-a04s", "Samsung", "Galaxy A04s 128 GB", "128 GB", "phone", 3800, 5400, 0.4, 10, 6999, 0, ["a04", "galaxy a04s", "galaxy a04s 128 gb", "samsung"]],
["samsung-galaxy-a03s-64-gb", "samsung-galaxy-a03s", "Samsung", "Galaxy A03s 64 GB", "64 GB", "phone", 3000, 4400, 0.35, 10, 0, 0, ["a03", "galaxy a03s", "galaxy a03s 64 gb", "samsung"]],
["samsung-galaxy-m23-128-gb", "samsung-galaxy-m23", "Samsung", "Galaxy M23 128 GB", "128 GB", "phone", 5800, 7800, 0.5, 10, 0, 0, ["m23", "galaxy m23", "galaxy m23 128 gb", "samsung"]],
["samsung-galaxy-m23-256-gb", "samsung-galaxy-m23", "Samsung", "Galaxy M23 256 GB", "256 GB", "phone", 6300, 8500, 0.5, 10, 0, 0, ["m23", "galaxy m23", "galaxy m23 256 gb", "samsung"]],
["xiaomi-13-lite-128-gb", "xiaomi-13-lite", "Xiaomi", "13 Lite 128 GB", "128 GB", "phone", 10000, 13500, 0.65, 9, 0, 0, ["13 lite", "13 lite 128 gb", "xiaomi"]],
["xiaomi-13-lite-256-gb", "xiaomi-13-lite", "Xiaomi", "13 Lite 256 GB", "256 GB", "phone", 10900, 14700, 0.65, 9, 0, 0, ["13 lite", "13 lite 256 gb", "xiaomi"]],
["xiaomi-12-lite-128-gb", "xiaomi-12-lite", "Xiaomi", "12 Lite 128 GB", "128 GB", "phone", 8000, 11000, 0.6, 9, 0, 0, ["12 lite", "12 lite 128 gb", "xiaomi"]],
["xiaomi-12-lite-256-gb", "xiaomi-12-lite", "Xiaomi", "12 Lite 256 GB", "256 GB", "phone", 8700, 12000, 0.6, 9, 0, 0, ["12 lite", "12 lite 256 gb", "xiaomi"]],
["xiaomi-poco-m4-pro-128-gb", "xiaomi-poco-m4-pro", "Xiaomi", "Poco M4 Pro 128 GB", "128 GB", "phone", 6000, 8200, 0.5, 9, 0, 0, ["m4 pro", "poco m4 pro", "poco m4 pro 128 gb", "xiaomi"]],
["xiaomi-poco-m4-pro-256-gb", "xiaomi-poco-m4-pro", "Xiaomi", "Poco M4 Pro 256 GB", "256 GB", "phone", 6500, 8900, 0.5, 9, 0, 0, ["m4 pro", "poco m4 pro", "poco m4 pro 256 gb", "xiaomi"]],
["xiaomi-redmi-a3-64-gb", "xiaomi-redmi-a3", "Xiaomi", "Redmi A3 64 GB", "64 GB", "phone", 2800, 4000, 0.35, 10, 4999, 0, ["redmi a3", "redmi a3 64 gb", "xiaomi"]],
["xiaomi-redmi-a3-128-gb", "xiaomi-redmi-a3", "Xiaomi", "Redmi A3 128 GB", "128 GB", "phone", 2800, 4000, 0.35, 10, 4999, 0, ["redmi a3", "redmi a3 128 gb", "xiaomi"]],
["apple-iphone-11-256-gb", "apple-iphone-11", "Apple", "iPhone 11 256 GB", "256 GB", "phone", 13800, 18400, 0.8, 5, 0, 0, ["iphone 11 256", "iphone 11", "iphone 11 256 gb", "apple"]],
["apple-iphone-xr-256-gb", "apple-iphone-xr", "Apple", "iPhone XR 256 GB", "256 GB", "phone", 8400, 10600, 0.6, 6, 0, 0, ["xr 256", "iphone xr", "iphone xr 256 gb", "apple"]],
["lenovo-ideapad-gaming-3-rtx-3050", "lenovo-ideapad-gaming-3", "Lenovo", "IdeaPad Gaming 3 RTX 3050", "RTX 3050", "laptop", 18900, 24800, 0.9, 9, 30499, 0, ["ideapad gaming 3", "ideapad gaming 3 rtx 3050", "lenovo"]],
["lenovo-ideapad-gaming-3-rtx-4050", "lenovo-ideapad-gaming-3", "Lenovo", "IdeaPad Gaming 3 RTX 4050", "RTX 4050", "laptop", 21000, 27500, 0.9, 9, 33999, 0, ["ideapad gaming 3", "ideapad gaming 3 rtx 4050", "lenovo"]],
["asus-fx505-gaming-rtx-3050", "asus-fx505-gaming", "Asus", "FX505 Gaming RTX 3050", "RTX 3050", "laptop", 12600, 17100, 0.9, 9, 0, 0, ["fx505 gaming", "fx505 gaming rtx 3050", "asus"]],
["casper-nirvana-c650-i5-16-gb", "casper-nirvana-c650", "Casper", "Nirvana C650 i5 / 16 GB", "i5 / 16 GB", "laptop", 13000, 17500, 0.9, 9, 20999, 0, ["nirvana c650", "nirvana c650 i5 / 16 gb", "casper"]],
["monster-abra-a7-rtx-4050", "monster-abra-a7", "Monster", "Abra A7 RTX 4050", "RTX 4050", "laptop", 20000, 26000, 0.9, 9, 31999, 0, ["abra a7", "abra a7 rtx 4050", "monster"]],
["msi-sword-15-rtx-4050", "msi-sword-15", "MSI", "Sword 15 RTX 4050", "RTX 4050", "laptop", 24000, 31000, 0.9, 9, 37999, 0, ["sword 15", "sword 15 rtx 4050", "msi"]],
["msi-sword-15-rtx-4060", "msi-sword-15", "MSI", "Sword 15 RTX 4060", "RTX 4060", "laptop", 29300, 37800, 0.9, 9, 46499, 0, ["sword 15", "sword 15 rtx 4060", "msi"]],
["msi-24i-165hz-gaming-monitor", "msi-24i-165hz-gaming-monitor", "MSI", "24\" 165Hz Gaming Monitör", "", "laptop", 5500, 8000, 0.6, 10, 10999, 0, ["gaming monitör", "165hz", "24\" 165hz gaming monitör", "msi"]],
["asus-tuf-27i-gaming-monitor", "asus-tuf-27i-gaming-monitor", "Asus", "TUF 27\" Gaming Monitör", "", "laptop", 7000, 10000, 0.6, 10, 13999, 0, ["tuf monitör", "tuf 27\" gaming monitör", "asus"]],
["philips-24i-ofis-monitoru", "philips-24i-ofis-monitoru", "Philips", "24\" Ofis Monitörü", "", "laptop", 2800, 4200, 0.6, 10, 5999, 0, ["philips monitör", "24\" ofis monitörü", "philips"]],
["viewsonic-24i-monitor", "viewsonic-24i-monitor", "ViewSonic", "24\" Monitör", "", "laptop", 2600, 4000, 0.6, 10, 5499, 0, ["viewsonic", "24\" monitör"]],
["general-mobile-e-tab-20-32-gb", "general-mobile-e-tab-20", "General Mobile", "e-tab 20 32 GB", "32 GB", "tablet", 2200, 3400, 0.35, 12, 4499, 0, ["e-tab", "etab", "e-tab 20", "e-tab 20 32 gb", "general mobile"]],
["samsung-galaxy-watch-fe", "samsung-galaxy-watch-fe", "Samsung", "Galaxy Watch FE", "", "watch", 5500, 7800, 0.6, 9, 9999, 0, ["watch fe", "galaxy watch fe", "samsung"]],
["xiaomi-watch-s1", "xiaomi-watch-s1", "Xiaomi", "Watch S1", "", "watch", 3200, 4800, 0.6, 9, 0, 0, ["xiaomi watch", "watch s1", "xiaomi"]],
["jbl-tune-230nc", "jbl-tune-230nc", "JBL", "Tune 230NC", "", "headphone", 1600, 2500, 0.4, 10, 3499, 0, ["tune 230", "tune 230nc", "jbl"]],
["baseus-bowie-tws", "baseus-bowie-tws", "Baseus", "Bowie TWS", "", "headphone", 500, 900, 0.4, 10, 1499, 0, ["baseus", "bowie tws"]],
["fujifilm-instax-mini-11", "fujifilm-instax-mini-11", "Fujifilm", "Instax Mini 11", "", "camera", 1800, 2700, 0.8, 10, 0, 0, ["instax 11", "instax mini 11", "fujifilm"]],
["canon-powershot-g7x-iii", "canon-powershot-g7x-iii", "Canon", "PowerShot G7X III", "", "camera", 22000, 28000, 0.8, 10, 33999, 0, ["g7x", "powershot g7x iii", "canon"]],
["nikon-coolpix-p900", "nikon-coolpix-p900", "Nikon", "Coolpix P900", "", "camera", 13000, 17500, 0.8, 10, 0, 0, ["p900", "coolpix", "coolpix p900", "nikon"]],
["ninja-blender-pro", "ninja-blender-pro", "Ninja", "Blender Pro", "", "smallapp", 2800, 4200, 0.55, 10, 5999, 0, ["ninja blender", "blender pro", "ninja"]],
["arcelik-mini-firin", "arcelik-mini-firin", "Arçelik", "Mini Fırın", "", "smallapp", 1500, 2400, 0.45, 10, 3499, 0, ["arçelik mini fırın", "mini fırın", "arçelik"]],
["xiaomi-robot-vacuum-x10plus", "xiaomi-robot-vacuum-x10plus", "Xiaomi", "Robot Vacuum X10+", "", "smallapp", 13000, 17500, 1.0, 10, 24999, 0, ["x10", "robot vacuum x10+", "xiaomi"]],
["bianchi-cocuk-bisikleti-16-jant", "bianchi-cocuk-bisikleti", "Bianchi", "Çocuk Bisikleti 16 Jant", "16 Jant", "bike", 1400, 2600, 0.5, 12, 4499, 0, ["bianchi çocuk", "çocuk bisikleti", "çocuk bisikleti 16 jant", "bianchi"]],
["bianchi-cocuk-bisikleti-20-jant", "bianchi-cocuk-bisikleti", "Bianchi", "Çocuk Bisikleti 20 Jant", "20 Jant", "bike", 1800, 3200, 0.5, 12, 5499, 0, ["bianchi çocuk", "çocuk bisikleti", "çocuk bisikleti 20 jant", "bianchi"]],
["i-stikbal-berjer-koltuk", "i-stikbal-berjer-koltuk", "İstikbal", "Berjer Koltuk", "", "furniture", 2200, 4000, 0.6, 15, 7999, 0, ["berjer", "berjer koltuk", "i̇stikbal"]],
["bellona-tv-unitesi", "bellona-tv-unitesi", "Bellona", "TV Ünitesi", "", "furniture", 2800, 5000, 0.6, 15, 9999, 0, ["bellona tv ünitesi", "tv ünitesi", "bellona"]],
["arcelik-ankastre-set-firinplusocakplusdavlumbaz", "arcelik-ankastre-set-firinplusocakplusdavlumbaz", "Arçelik", "Ankastre Set (Fırın+Ocak+Davlumbaz)", "", "appliance", 12000, 18500, 1.0, 16, 27999, 0, ["ankastre set", "arçelik ankastre", "ankastre set (fırın+ocak+davlumbaz)", "arçelik"]],
["bosch-ankastre-set-firinplusocakplusdavlumbaz", "bosch-ankastre-set-firinplusocakplusdavlumbaz", "Bosch", "Ankastre Set (Fırın+Ocak+Davlumbaz)", "", "appliance", 16000, 24000, 1.0, 16, 37999, 0, ["ankastre set", "bosch ankastre", "ankastre set (fırın+ocak+davlumbaz)", "bosch"]],
["vestel-ankastre-set-firinplusocakplusdavlumbaz", "vestel-ankastre-set-firinplusocakplusdavlumbaz", "Vestel", "Ankastre Set (Fırın+Ocak+Davlumbaz)", "", "appliance", 9000, 14000, 1.0, 16, 20999, 0, ["ankastre set", "vestel ankastre", "ankastre set (fırın+ocak+davlumbaz)", "vestel"]],
["buderus-kombi-24-kw", "buderus-kombi", "Buderus", "Kombi 24 kW", "24 kW", "appliance", 11000, 16500, 1.0, 14, 29999, 0, ["buderus kombi", "kombi", "kombi 24 kw", "buderus"]],
["buderus-kombi-28-kw", "buderus-kombi", "Buderus", "Kombi 28 kW", "28 kW", "appliance", 12600, 19000, 1.0, 14, 34499, 0, ["buderus kombi", "kombi", "kombi 28 kw", "buderus"]],
["airfel-kombi-24-kw", "airfel-kombi", "Airfel", "Kombi 24 kW", "24 kW", "appliance", 7000, 10500, 1.0, 14, 18999, 0, ["airfel kombi", "kombi", "kombi 24 kw", "airfel"]],
["airfel-kombi-28-kw", "airfel-kombi", "Airfel", "Kombi 28 kW", "28 kW", "appliance", 8000, 12100, 1.0, 14, 21999, 0, ["airfel kombi", "kombi", "kombi 28 kw", "airfel"]],
["bosch-gsb-darbeli-matkap", "bosch-gsb-darbeli-matkap", "Bosch", "GSB Darbeli Matkap", "", "tool", 1800, 2800, 0.6, 11, 4499, 0, ["matkap", "bosch matkap", "gsb darbeli matkap", "bosch"]],
["bosch-professional-gsr-vidalama", "bosch-professional-gsr-vidalama", "Bosch", "Professional GSR Vidalama", "", "tool", 2500, 3800, 0.6, 11, 5999, 0, ["vidalama", "gsr", "professional gsr vidalama", "bosch"]],
["bosch-avuc-taslama", "bosch-avuc-taslama", "Bosch", "Avuç Taşlama", "", "tool", 1500, 2400, 0.6, 11, 3999, 0, ["taşlama", "spiral", "avuç taşlama", "bosch"]],
["makita-hp1631-darbeli-matkap", "makita-hp1631-darbeli-matkap", "Makita", "HP1631 Darbeli Matkap", "", "tool", 2200, 3400, 0.6, 11, 5499, 0, ["makita", "hp1631 darbeli matkap"]],
["makita-akulu-vidalama-seti", "makita-akulu-vidalama-seti", "Makita", "Akülü Vidalama Seti", "", "tool", 3500, 5500, 0.6, 11, 8499, 0, ["makita akülü", "akülü vidalama seti", "makita"]],
["dewalt-dcd771-akulu-matkap", "dewalt-dcd771-akulu-matkap", "Dewalt", "DCD771 Akülü Matkap", "", "tool", 3200, 5000, 0.6, 11, 7999, 0, ["dewalt", "dcd771 akülü matkap"]],
["einhell-akulu-matkap-seti", "einhell-akulu-matkap-seti", "Einhell", "Akülü Matkap Seti", "", "tool", 1800, 2800, 0.6, 11, 4499, 0, ["einhell", "akülü matkap seti"]],
["blackplusdecker-matkap-seti", "blackplusdecker-matkap-seti", "Black+Decker", "Matkap Seti", "", "tool", 1400, 2200, 0.6, 11, 3499, 0, ["black decker", "black+decker", "matkap seti"]],
["karcher-k2-basincli-yikama", "karcher-k2-basincli-yikama", "Karcher", "K2 Basınçlı Yıkama", "", "tool", 2200, 3400, 0.6, 11, 5499, 0, ["karcher", "basınçlı yıkama", "k2 basınçlı yıkama"]],
["karcher-k4-basincli-yikama", "karcher-k4-basincli-yikama", "Karcher", "K4 Basınçlı Yıkama", "", "tool", 4000, 6200, 0.6, 11, 9499, 0, ["karcher k4", "k4 basınçlı yıkama", "karcher"]],
["karcher-wd3-islak-kuru-supurge", "karcher-wd3-islak-kuru-supurge", "Karcher", "WD3 Islak-Kuru Süpürge", "", "tool", 2500, 3900, 0.6, 11, 5999, 0, ["wd3", "islak kuru", "wd3 islak-kuru süpürge", "karcher"]],
["bosch-easydrill-akulu", "bosch-easydrill-akulu", "Bosch", "EasyDrill Akülü", "", "tool", 1500, 2400, 0.6, 11, 3999, 0, ["easydrill", "easydrill akülü", "bosch"]],
["makita-akulu-avuc-taslama", "makita-akulu-avuc-taslama", "Makita", "Akülü Avuç Taşlama", "", "tool", 3800, 5800, 0.6, 11, 8999, 0, ["makita taşlama", "akülü avuç taşlama", "makita"]],
["dewalt-kirici-delici", "dewalt-kirici-delici", "Dewalt", "Kırıcı Delici", "", "tool", 4500, 7000, 0.6, 11, 10999, 0, ["kırıcı delici", "hilti", "dewalt"]],
["attlas-jenerator-3-5-kw", "attlas-jenerator-3-5-kw", "Attlas", "Jeneratör 3.5 kW", "", "tool", 6500, 10000, 0.6, 11, 15999, 0, ["jeneratör", "jenerator", "jeneratör 3.5 kw", "attlas"]],
["bosch-glm-50-lazer-metre", "bosch-glm-50-lazer-metre", "Bosch", "GLM 50 Lazer Metre", "", "tool", 1400, 2200, 0.6, 11, 3499, 0, ["lazer metre", "glm 50 lazer metre", "bosch"]],
["apple-iphone-17e-256-gb", "apple-iphone-17e", "Apple", "iPhone 17e 256 GB", "256 GB", "phone", 42000, 48000, 1.5, 4, 53999, 1, ["iphone 17e", "17e", "iphone 17e 256 gb", "apple"]],
["samsung-galaxy-s26-256-gb", "samsung-galaxy-s26", "Samsung", "Galaxy S26 256 GB", "256 GB", "phone", 44000, 52000, 1.4, 5, 59999, 1, ["s26", "galaxy s26", "galaxy s26 256 gb", "samsung"]],
["samsung-galaxy-s26-512-gb", "samsung-galaxy-s26", "Samsung", "Galaxy S26 512 GB", "512 GB", "phone", 50000, 59000, 1.4, 5, 74999, 1, ["s26", "galaxy s26", "galaxy s26 512 gb", "samsung"]],
["samsung-galaxy-s26-ultra-256-gb", "samsung-galaxy-s26-ultra", "Samsung", "Galaxy S26 Ultra 256 GB", "256 GB", "phone", 64000, 78000, 1.7, 5, 87999, 1, ["s26 ultra", "galaxy s26 ultra", "galaxy s26 ultra 256 gb", "samsung"]],
["samsung-galaxy-s26-ultra-512-gb", "samsung-galaxy-s26-ultra", "Samsung", "Galaxy S26 Ultra 512 GB", "512 GB", "phone", 71000, 87000, 1.7, 5, 99999, 1, ["s26 ultra", "galaxy s26 ultra 512 gb", "samsung"]],
["samsung-galaxy-z-fold7-256-gb", "samsung-galaxy-z-fold7", "Samsung", "Galaxy Z Fold7 256 GB", "256 GB", "phone", 68000, 83000, 1.9, 8, 94999, 1, ["fold7", "fold 7", "z fold7", "galaxy z fold7 256 gb", "samsung"]],
["samsung-galaxy-z-fold7-512-gb", "samsung-galaxy-z-fold7", "Samsung", "Galaxy Z Fold7 512 GB", "512 GB", "phone", 74000, 91000, 1.9, 8, 104999, 1, ["fold7", "z fold7", "galaxy z fold7 512 gb", "samsung"]],
["samsung-galaxy-s25-fe-256-gb", "samsung-galaxy-s25-fe", "Samsung", "Galaxy S25 FE 256 GB", "256 GB", "phone", 25000, 31000, 1.0, 6, 34999, 1, ["s25 fe", "galaxy s25 fe", "samsung"]],
["apple-watch-series-11-42mm", "apple-watch-series-11", "Apple", "Watch Series 11 42mm", "42mm", "watch", 15000, 18500, 1.1, 6, 20999, 1, ["watch 11", "series 11", "watch series 11 42mm", "apple"]],
["apple-watch-series-11-46mm", "apple-watch-series-11", "Apple", "Watch Series 11 46mm", "46mm", "watch", 16200, 20000, 1.1, 6, 22299, 1, ["watch 11", "series 11", "watch series 11 46mm", "apple"]],
["apple-watch-se-3-40mm", "apple-watch-se-3", "Apple", "Watch SE 3 40mm", "40mm", "watch", 9000, 11000, 0.8, 7, 12499, 1, ["se 3", "watch se 3", "watch se 3 40mm", "apple"]],
["apple-watch-se-3-44mm", "apple-watch-se-3", "Apple", "Watch SE 3 44mm", "44mm", "watch", 9700, 11900, 0.8, 7, 13499, 1, ["se 3", "watch se 3 44mm", "apple"]]
];
const PRODUCTS = ROWS.map(r => ({
  id: r[0], fam: r[1], brand: r[2], model: r[3], vl: r[4], cat: r[5],
  value: [r[6], r[7]], rf: r[8], days: r[9], np: r[10] || null, hot: !!r[11], kw: r[12],
}));
// Aile içi varyant sayısı ve varyantsız taban ad (öneri/liste görünümleri için)
const FAM_COUNT = {};
for (const p of PRODUCTS) FAM_COUNT[p.fam] = (FAM_COUNT[p.fam] || 0) + 1;
const famBase = (p) => p.vl ? p.model.slice(0, -(p.vl.length + 1)) : p.model;
const famSiblings = (p) => PRODUCTS.filter(x => x.fam === p.fam).sort((a, b) => a.value[1] - b.value[1]);

const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Kayseri", "Mersin", "Eskişehir", "Samsun", "Trabzon", "Diyarbakır"];

const EXAMPLES = [
  "iPhone 17 ekranı kırık, İstanbul",
  "Dyson V11 şarj tutmuyor",
  "Canon fotoğraf makinesi lens odaklamıyor",
  "Arçelik buzdolabı soğutmuyor",
];

const PLACEHOLDERS = [
  "iPhone 17 ekranı kırık…",
  "LG OLED C4 görüntü yok…",
  "Dyson V15 şarj tutmuyor…",
  "Switch 2 kolu drift yapıyor…",
  "Koltuk takımı, kumaşı yıpranmış…",
  "Canon R8, sorunu yok…",
];

/* ---------------- YARDIMCILAR ---------------- */

const trLower = (s) => (s || "").toLocaleLowerCase("tr-TR");
const r100 = (v) => Math.round(v / 100) * 100;
const fmt = (v) => new Intl.NumberFormat("tr-TR").format(r100(v)) + " TL";
const fmtRange = ([a, b]) => new Intl.NumberFormat("tr-TR").format(r100(a)) + " – " + new Intl.NumberFormat("tr-TR").format(r100(b)) + " TL";
const enc = encodeURIComponent;
const isEwaste = (cat) => !["bike", "furniture"].includes(cat);

function logEvent(name, data) {
  console.log("[analytics]", name, data || {});
}

/* ---------------- SIRALAMA (yeni model her yerde önce) ---------------- */

// Ürün sıralaması: önce SON MODELLER, sonra değeri yükseğe göre (yeni ≈ değerli)
const modelOrder = (a, b) =>
  ((b.hot ? 1 : 0) - (a.hot ? 1 : 0)) || (b.value[1] - a.value[1]);

// Canlı arama önerileri: eşleşme kalitesi → yenilik → değer
function rankSuggestions(input) {
  const q = trLower(input).trim();
  if (!q) return [];
  const brands = [...new Set(PRODUCTS.map(p => p.brand))]
    .filter(b => trLower(b).startsWith(q))
    .slice(0, 2)
    .map(b => ({ type: "brand", label: b, count: PRODUCTS.filter(p => p.brand === b).length }));
  // Eşleşme puanı → aile bazında TEK temsilci (en ucuz taban varyant) → yenilik → değer
  const best = new Map();
  for (const p of PRODUCTS) {
    const full = trLower(p.brand + " " + p.model);
    const model = trLower(p.model);
    let s = -1;
    if (model.startsWith(q) || full.startsWith(q)) s = 0;
    else if (full.includes(q)) s = 1;
    else if (p.kw.some(k => k.startsWith(q))) s = 2;
    if (s < 0) continue;
    const cur = best.get(p.fam);
    if (!cur || s < cur.s || (s === cur.s && p.value[1] < cur.p.value[1])) best.set(p.fam, { p, s });
  }
  const scored = [...best.values()].sort((a, b) => (a.s - b.s) || modelOrder(a.p, b.p));
  return [...brands, ...scored.slice(0, 6).map(x => ({ type: "product", p: x.p }))].slice(0, 7);
}

/* ---------------- YEREL AYRIŞTIRICI ---------------- */

function parseLocal(text) {
  const t = " " + trLower(text).replace(/\s+/g, " ") + " ";
  // Puanlama: eşleşen kelimenin uzunluğu + kelime ürünün MARKASIYLA başlıyorsa
  // büyük bonus ("bisan" genel "bisiklet"i yener). Eşitlikte yeni model kazanır.
  let product = null, best = 0;
  for (const p of PRODUCTS) {
    const bl = trLower(p.brand);
    const vb = p.vl && t.includes(trLower(p.vl)) ? 30 : 0; // metinde varyant geçiyorsa ("9 kg", "256 gb") o varyantı seç
    for (const k of p.kw) {
      if (!t.includes(k)) continue;
      const sc = k.length + vb + (k === bl || k.startsWith(bl + " ") || bl.startsWith(k) ? 100 : 0);
      if (sc > best || (sc === best && product && (p.fam === product.fam ? p.value[1] < product.value[1] : modelOrder(p, product) < 0))) { product = p; best = sc; }
    }
  }
  let defect = null;
  if (product) {
    for (const d of DEFECTS[product.cat]) {
      if (d.kw.some(k => t.includes(k))) { defect = d; break; }
    }
  }
  let city = null;
  for (const c of CITIES) {
    if (t.includes(trLower(c))) { city = c; break; }
  }
  return { product, defect, city };
}

/* ---------------- YAPAY ZEKÂ KATMANI ---------------- */

async function aiEstimate(text) {
  const prompt = `Türkiye ikinci el eşya piyasası uzmanısın (elektronik, beyaz eşya, kamera, ev aletleri, bisiklet, mobilya — her şey). Tarih: 2026. Kullanıcı girdisi: "${text}"

Ürünü tanı ve 2026 Türkiye ikinci el piyasası için makul TL tahminleri yap. SADECE geçerli JSON döndür, başka hiçbir şey yazma:
{"found": true/false, "brand": "...", "model": "...", "category": "phone|tv|laptop|tablet|console|watch|headphone|camera|appliance|smallapp|bike|furniture", "defect_label": "kısa arıza tanımı veya null", "broken_multiplier": 0.0-1.0, "city": "şehir veya null", "working_min": 0, "working_max": 0, "repair_min": 0, "repair_max": 0, "days": 0, "new_price": 0}

Kurallar: Ürün tanınamıyorsa found=false. Arıza belirtilmemişse defect_label=null, broken_multiplier=1. Beyaz eşya=appliance, küçük ev aletleri (süpürge, kahve makinesi vb.)=smallapp. new_price = ürünün güncel sıfır (mağaza) satış fiyatı TL; artık sıfır satılmıyorsa 0. Fiyatlar gerçekçi aralık olsun.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const raw = (data.content || []).map(c => c.text || "").join("\n");
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function aiListing(ctx) {
  const prompt = `Türkçe, dürüst ve satışa uygun kısa bir ikinci el ilan metni yaz (4-6 cümle, başlık dahil).
Ürün: ${ctx.title}
Durum: ${ctx.defectLabel}
İstenen fiyat: ${ctx.price}
Kural: Arızayı gizleme, açıkça belirt. Abartılı pazarlama dili kullanma. Sonuna "Pazarlık payı vardır." ekle. SADECE ilan metnini döndür.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return (data.content || []).map(c => c.text || "").join("\n").trim();
}

/* ---------------- KARAR MOTORU ---------------- */

function computeAnalysis(item) {
  const brokenMin = r100(item.workMin * item.mult);
  const brokenMax = r100(item.workMax * item.mult);
  const post = [item.workMin, item.workMax];
  const netRepairMin = post[0] - item.repairMax - brokenMax;
  const repairRatio = item.repairMax / post[1];

  const paths = {
    sellAsIs: [brokenMin, brokenMax],
    repairSell: [post[0] - item.repairMax, post[1] - item.repairMin],
  };

  let action, alt = null, borderline = false, reasons = [];

  if (!item.isBroken) {
    if (item.workMax < LOW_VALUE) {
      action = "donate"; alt = "sell";
      reasons.push(`Ürünün piyasa değeri düşük (${fmtRange([item.workMin, item.workMax])}). Satış çabasına değmeyebilir; çalışır durumda bağışlamak birine gerçek fayda sağlar.`);
    } else {
      action = "sell";
      reasons.push(`Ürünün sorunu yok ve piyasa değeri ${fmtRange([item.workMin, item.workMax])}. Kullanmıyorsan bekletmek sadece değer kaybettirir.`);
    }
  } else if (netRepairMin > 0 && repairRatio < 0.5) {
    action = "repair_sell";
    const gain = [paths.repairSell[0] - brokenMax, paths.repairSell[1] - brokenMin];
    reasons.push(`Tamir maliyeti (${fmtRange([item.repairMin, item.repairMax])}) tamir sonrası değerin (${fmtRange(post)}) %${Math.round(repairRatio * 100)}'i. Tamir ettirip satmak, arızalı satmaya göre en kötü senaryoda bile yaklaşık ${fmt(Math.max(gain[0], 0))} daha fazla kazandırır.`);
    if (netRepairMin < 0.12 * post[0]) {
      borderline = true; alt = "sell_broken";
      reasons.push(`Fark küçük: tamirle uğraşmak istemiyorsan arızalı satmak (${fmtRange(paths.sellAsIs)}) da makul.`);
    }
  } else if (brokenMax >= MIN_BROKEN) {
    action = "sell_broken";
    reasons.push(`Tamir maliyeti (${fmtRange([item.repairMin, item.repairMax])}) kazandıracağı değere göre yüksek. Arızalı haliyle ${fmtRange(paths.sellAsIs)} bandında satmak net kazanç açısından daha mantıklı.`);
    if (item.repairMax < 0.35 * item.workMin) {
      reasons.push(`Not: Ürünü satmayıp kendin kullanmaya devam edeceksen tamir ettirmek yine de mantıklı olabilir.`);
    }
  } else {
    action = "recycle"; alt = "donate";
    reasons.push(`Arızalı satış değeri çok düşük (${fmtRange(paths.sellAsIs)}) ve tamir ekonomik değil. ${isEwaste(item.cat) ? "Lisanslı bir e-atık noktasına vermek" : "Geri dönüşüme vermek"} hem en pratik hem en doğru seçenek.`);
  }

  const depr = CATEGORIES[item.cat] ? CATEGORIES[item.cat].deprMonthly : 0.02;
  const waitLoss = r100(((item.isBroken ? brokenMax : item.workMax) * depr) * 6);

  return { brokenMin, brokenMax, post, paths, action, alt, borderline, reasons, waitLoss, repairRatio };
}

const ACTION_META = {
  sell:        { label: "Sat",                    color: "#2563EB", bg: "#EFF4FE", icon: Banknote,       tab: "sell" },
  sell_broken: { label: "Arızalı Olarak Sat",     color: "#2563EB", bg: "#EFF4FE", icon: Banknote,       tab: "sell" },
  repair_sell: { label: "Tamir Ettir, Sonra Sat", color: "#D9660B", bg: "#FEF3E7", icon: Wrench,         tab: "repair" },
  donate:      { label: "Bağışla",                color: "#16A34A", bg: "#ECF8EF", icon: HeartHandshake, tab: "donate" },
  recycle:     { label: "Geri Dönüştür",          color: "#5B6878", bg: "#F0F2F5", icon: Recycle,        tab: "recycle" },
};

/* ---------------- STİL ---------------- */

const S = {
  ink: "#141D2E",
  muted: "#5C6A7D",
  line: "#E3E8EF",
  bg: "#F3F5F9",
  card: "#FFFFFF",
};

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
* { box-sizing: border-box; margin: 0; }
body { background: ${S.bg}; }
.ny-root { font-family: 'IBM Plex Sans', system-ui, sans-serif; color: ${S.ink}; background: ${S.bg}; min-height: 100vh; }
.ny-display { font-family: 'Sora', system-ui, sans-serif; }
.ny-fade { animation: nyFade .45s ease both; }
@keyframes nyFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.ny-btn { cursor: pointer; border: none; font-family: inherit; transition: transform .12s ease, box-shadow .12s ease, background .12s ease; }
.ny-btn:active { transform: scale(.97); }
.ny-btn:focus-visible, .ny-input:focus-visible { outline: 3px solid #2563EB55; outline-offset: 2px; }
.ny-chip:hover { background: #E9EDF4; }
.ny-plat:hover { box-shadow: 0 4px 14px rgba(20,29,46,.10); }
.ny-sug:hover { background: #F3F5F9; }
.ny-rise { opacity: 0; animation: nyFade .55s cubic-bezier(.2,.8,.2,1) forwards; }
.ny-bar { transform-origin: left; transform: scaleX(0); animation: nyBarGrow .7s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes nyBarGrow { to { transform: scaleX(1); } }
.ny-rail { display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.ny-rail::-webkit-scrollbar { display: none; }
.ny-glow { transition: box-shadow .25s ease; }
.ny-glow:focus-within { box-shadow: 0 12px 34px rgba(37,99,235,.18), 0 0 0 3px #2563EB22 !important; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } .ny-rise, .ny-bar { opacity: 1; transform: none; } }
`;

/* ---------------- KÜÇÜK BİLEŞENLER ---------------- */

function Card({ children, style, className }) {
  return (
    <div className={className} style={{ background: S.card, borderRadius: 18, border: `1px solid ${S.line}`, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function Chip({ children, onClick, active }) {
  return (
    <button className="ny-btn ny-chip" onClick={onClick} style={{
      padding: "9px 14px", borderRadius: 999, fontSize: 14, fontWeight: 500,
      background: active ? S.ink : "#EDF0F5", color: active ? "#fff" : S.ink,
      border: `1px solid ${active ? S.ink : S.line}`,
    }}>{children}</button>
  );
}

function RangeBar({ min, max, ceiling, color }) {
  const pMin = Math.max((min / ceiling) * 100, 2);
  const pMax = Math.max((max / ceiling) * 100, 4);
  return (
    <div style={{ height: 8, borderRadius: 99, background: "#EDF0F5", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, width: pMax + "%", top: 0, bottom: 0, background: color + "33", borderRadius: 99 }} />
      <div style={{ position: "absolute", left: 0, width: pMin + "%", top: 0, bottom: 0, background: color, borderRadius: 99 }} />
    </div>
  );
}

function LinkRow({ href, title, sub, onClick, accent }) {
  return (
    <a className="ny-plat" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      padding: "13px 14px", borderRadius: 14, border: `1px solid ${accent ? accent + "55" : S.line}`,
      background: accent ? accent + "0D" : "#fff",
      textDecoration: "none", color: S.ink,
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: S.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <ExternalLink size={17} color={accent || S.muted} />
    </a>
  );
}

/* ---------------- ANA UYGULAMA ---------------- */

export default function NeYapayim() {
  const [stage, setStage] = useState("landing"); // landing | loading | clarify | browse | result
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState(null);
  const [item, setItem] = useState(null);
  const [tab, setTab] = useState("sell");
  const [pickCat, setPickCat] = useState(null);
  const [listing, setListing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [aiFailed, setAiFailed] = useState(false);
  const [phIndex, setPhIndex] = useState(0);

  useEffect(() => {
    if (stage !== "landing" || input) return;
    const t = setInterval(() => setPhIndex(i => (i + 1) % PLACEHOLDERS.length), 2600);
    return () => clearInterval(t);
  }, [stage, input]);

  const analysis = useMemo(() => (item ? computeAnalysis(item) : null), [item]);

  /* ---- CANLI ARAMA ÖNERİLERİ (rankSuggestions: saf, test edilen) ---- */
  const suggestions = useMemo(() => rankSuggestions(input), [input]);

  function pickProduct(p) {
    setInput(p.brand + " " + p.model);
    setDraft({ product: p, defect: null, city: null, confidence: "high" });
    logEvent("suggestion_pick", { id: p.id });
    setStage("clarify");
  }

  /* ---- AKIŞ ---- */

  async function analyze(text) {
    const q = text.trim();
    if (!q) return;
    logEvent("search", { q });
    setListing(null); setAiFailed(false);
    const local = parseLocal(q);

    if (local.product) {
      const d = { product: local.product, defect: local.defect, city: local.city, confidence: "high" };
      setDraft(d);
      if (!local.defect) { setStage("clarify"); }
      else finalize(d);
      return;
    }

    setStage("loading");
    try {
      const ai = await aiEstimate(q);
      if (!ai.found) throw new Error("not found");
      const cat = CATEGORIES[ai.category] ? ai.category : "smallapp";
      const d = {
        ai: { ...ai, category: cat },
        defect: ai.defect_label
          ? { id: "ai", label: ai.defect_label, mult: Math.min(Math.max(ai.broken_multiplier ?? 0.5, 0.1), 1), repair: [ai.repair_min || 0, ai.repair_max || 0] }
          : null,
        city: ai.city || null,
        confidence: "low",
      };
      setDraft(d);
      if (!d.defect) setStage("clarify");
      else finalize(d);
    } catch {
      setAiFailed(true);
      setStage("browse");
    }
  }

  function finalize(d) {
    let it;
    if (d.product) {
      const p = d.product;
      const def = d.defect || DEFECTS[p.cat].find(x => x.id === "yok");
      it = {
        pid: p.id,
        title: p.brand + " " + p.model,
        brand: p.brand,
        cat: p.cat,
        workMin: p.value[0], workMax: p.value[1],
        mult: def.mult,
        repairMin: r100(def.repair[0] * p.rf), repairMax: r100(def.repair[1] * p.rf),
        defectLabel: def.label, isBroken: def.mult < 1,
        days: p.days, confidence: "high", city: d.city,
        np: p.np, hot: p.hot,
      };
    } else {
      const a = d.ai;
      const def = d.defect;
      const isBroken = !!def && def.mult < 1;
      it = {
        title: ((a.brand || "") + " " + (a.model || "")).trim() || "Ürün",
        brand: a.brand || "",
        cat: a.category,
        workMin: a.working_min || 1000, workMax: Math.max(a.working_max || 2000, (a.working_min || 1000) + 500),
        mult: isBroken ? def.mult : 1,
        repairMin: isBroken ? (def.repair[0] || 0) : 0,
        repairMax: isBroken ? (def.repair[1] || 0) : 0,
        defectLabel: def ? def.label : "Sorunu yok",
        isBroken, days: a.days || 10, confidence: "low", city: d.city,
        np: a.new_price && a.new_price > 0 ? a.new_price : null, hot: false,
      };
    }
    setItem(it);
    const act = computeAnalysis(it).action;
    setTab(ACTION_META[act].tab);
    setHistory(h => [{ label: it.title + " · " + it.defectLabel, q: it.title + " " + it.defectLabel }, ...h.filter(x => x.label !== it.title + " · " + it.defectLabel)].slice(0, 4));
    logEvent("decision_shown", { title: it.title, action: act });
    setStage("result");
  }

  function reset() {
    setStage("landing"); setDraft(null); setItem(null); setInput(""); setListing(null); setPickCat(null);
  }

  async function makeListing() {
    if (!item || !analysis) return;
    setListing({ loading: true });
    const price = fmt(item.isBroken ? analysis.brokenMax : item.workMax);
    try {
      const text = await aiListing({ title: item.title, defectLabel: item.defectLabel, price });
      setListing({ text });
    } catch {
      setListing({
        text: item.title + " — " + item.defectLabel + "\n\nKullanılmış " + item.title + " satılıktır. Durum: " + item.defectLabel.toLocaleLowerCase("tr-TR") + ". Fotoğraflardaki gibi olup açıklanan durum dışında sorunu yoktur.\n\nFiyat: " + price + "\nPazarlık payı vardır.",
      });
    }
    logEvent("listing_generated", { title: item.title });
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = t; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }

  const Header = ({ back }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 4px 10px" }}>
      {back && (
        <button className="ny-btn" onClick={reset} aria-label="Geri" style={{ background: "#fff", border: `1px solid ${S.line}`, borderRadius: 12, padding: 8, display: "flex" }}>
          <ChevronLeft size={18} />
        </button>
      )}
      <div className="ny-display" style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>
        Ne Yapayım<span style={{ color: "#2563EB" }}>?</span>
      </div>
    </div>
  );

  /* --- LANDING --- */
  if (stage === "landing") {
    return (
      <div className="ny-root">
        <style>{styles}</style>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 18px 40px", background: "radial-gradient(560px 300px at 15% -8%, #2563EB12, transparent 70%), radial-gradient(480px 260px at 95% 2%, #16A34A0E, transparent 70%)" }}>
          <Header />
          <div style={{ paddingTop: 30 }}>
            <div className="ny-display ny-rise" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
              Ne yapayım?
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              {["#2563EB", "#D9660B", "#16A34A", "#5B6878"].map((c, i) => (
                <div key={c} className="ny-bar" style={{ height: 5, flex: 1, borderRadius: 99, background: c, animationDelay: (0.15 + i * 0.09) + "s" }} />
              ))}
            </div>
            <p className="ny-rise" style={{ marginTop: 16, fontSize: 16, color: S.muted, lineHeight: 1.55, animationDelay: ".12s" }}>
              Sat, tamir ettir, bağışla ya da dönüştür — eşyanı yaz, en mantıklı kararı <strong style={{ color: S.ink }}>rakamlarla</strong> söyleyelim.
            </p>

            <Card className="ny-rise ny-glow" style={{ marginTop: 22, padding: 8, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 10px 30px rgba(20,29,46,.08)", animationDelay: ".2s" }}>
              <Search size={19} color={S.muted} style={{ marginLeft: 8, flexShrink: 0 }} />
              <input
                className="ny-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && analyze(input)}
                placeholder={PLACEHOLDERS[phIndex]}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontFamily: "inherit", padding: "12px 0", background: "transparent", minWidth: 0 }}
              />
              <button className="ny-btn" onClick={() => analyze(input)} style={{
                background: S.ink, color: "#fff", borderRadius: 13, padding: "12px 16px",
                fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}>
                Analiz <ArrowRight size={16} />
              </button>
            </Card>

            {suggestions.length > 0 && (
              <Card style={{ marginTop: 8, padding: 6, boxShadow: "0 10px 30px rgba(20,29,46,.10)" }}>
                {suggestions.map((s, i) => {
                  if (s.type === "brand") {
                    return (
                      <button key={"b-" + s.label} className="ny-btn ny-sug" onClick={() => setInput(s.label + " ")} style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 12px", borderRadius: 12, background: "transparent", textAlign: "left",
                        borderBottom: i < suggestions.length - 1 ? `1px solid ${S.line}` : "none",
                      }}>
                        <span style={{ fontSize: 15 }}>
                          <strong>{s.label}</strong>
                          <span style={{ color: S.muted, fontSize: 13 }}> · marka — {s.count} ürün</span>
                        </span>
                        <ChevronRight size={16} color={S.muted} />
                      </button>
                    );
                  }
                  const CatI = CATEGORIES[s.p.cat].icon;
                  return (
                    <button key={s.p.id} className="ny-btn ny-sug" onClick={() => pickProduct(s.p)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 12px", borderRadius: 12, background: "transparent", textAlign: "left",
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${S.line}` : "none",
                    }}>
                      <CatI size={17} color={S.muted} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{s.p.brand} {famBase(s.p)}{s.p.hot && <span style={{ marginLeft: 6, background: "#EFF4FE", color: "#2563EB", padding: "1px 7px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, verticalAlign: "middle" }}>YENİ</span>}{FAM_COUNT[s.p.fam] > 1 && <span style={{ marginLeft: 6, color: "#5C6A7D", fontSize: 12, fontWeight: 500 }}>· {FAM_COUNT[s.p.fam]} seçenek</span>}</span>
                      <span style={{ fontSize: 12.5, color: S.muted }}>{CATEGORIES[s.p.cat].label}</span>
                      <ChevronRight size={16} color={S.muted} />
                    </button>
                  );
                })}
              </Card>
            )}

            <button className="ny-btn ny-rise" onClick={() => { setStage("browse"); logEvent("browse_open"); }} style={{
              marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px", borderRadius: 14, background: "#fff", border: `1px solid ${S.line}`,
              fontWeight: 600, fontSize: 15, color: S.ink, animationDelay: ".28s",
            }}>
              <List size={17} /> Yazmak istemiyorum — listeden seç
            </button>

            {/* Kategori rayı — dokun, o kategoriden seç */}
            <div className="ny-rise" style={{ animationDelay: ".34s", marginTop: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Kategoriler</div>
              <div className="ny-rail">
                {Object.entries(CATEGORIES).map(([id, c]) => {
                  const I = c.icon;
                  return (
                    <button key={id} className="ny-btn" onClick={() => { setPickCat(id); setStage("browse"); logEvent("browse_open", { cat: id }); }} style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 14px", borderRadius: 999, background: "#fff", border: `1px solid ${S.line}`,
                      fontSize: 13.5, fontWeight: 600, color: S.ink,
                    }}>
                      <I size={16} /> {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ny-rise" style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8, animationDelay: ".4s" }}>
              {EXAMPLES.map(ex => (
                <Chip key={ex} onClick={() => { setInput(ex); analyze(ex); }}>{ex}</Chip>
              ))}
            </div>

            {history.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Bu oturumda</div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {history.map(h => <Chip key={h.label} onClick={() => { setInput(h.q); analyze(h.q); }}>{h.label}</Chip>)}
                </div>
              </div>
            )}

            <p className="ny-rise" style={{ marginTop: 26, fontSize: 12.5, color: S.muted, textAlign: "center", lineHeight: 1.7, animationDelay: ".46s" }}>
              <strong style={{ color: S.ink }}>350+ ürün</strong> · 12 kategori · listede olmayanları yapay zekâ tanır<br />Değerler tahminidir · MVP örnek veri seti kullanır
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* --- LOADING --- */
  if (stage === "loading") {
    return (
      <div className="ny-root">
        <style>{styles}</style>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 18px" }}>
          <Header back />
          <div className="ny-fade" style={{ textAlign: "center", paddingTop: 90 }}>
            <Sparkles size={34} color="#2563EB" />
            <div className="ny-display" style={{ marginTop: 16, fontSize: 20, fontWeight: 700 }}>Ürünün analiz ediliyor…</div>
            <p style={{ marginTop: 8, color: S.muted, fontSize: 15 }}>Yapay zekâ ürünü tanıyor ve piyasa tahmini yapıyor.</p>
          </div>
        </div>
      </div>
    );
  }

  /* --- BROWSE: kategori → model --- */
  if (stage === "browse") {
    return (
      <div className="ny-root">
        <style>{styles}</style>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 18px 40px" }}>
          <Header back />
          <div className="ny-fade" style={{ paddingTop: 16 }}>
            {aiFailed && (
              <Card style={{ background: "#FEF3E7", border: "1px solid #F5D9B8", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
                <AlertTriangle size={18} color="#D9660B" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>Ürün otomatik tanınamadı. Aşağıdan seçerek devam edebilirsin.</div>
              </Card>
            )}

            {!pickCat ? (
              <>
                <div className="ny-display" style={{ fontSize: 24, fontWeight: 800 }}>Kategori seç</div>
                <p style={{ fontSize: 14, color: S.muted, marginTop: 6 }}>Kategori → model → arıza. Üç dokunuşta karar.</p>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {Object.entries(CATEGORIES).map(([id, c]) => {
                    const I = c.icon;
                    return (
                      <button key={id} className="ny-btn" onClick={() => setPickCat(id)} style={{
                        padding: "16px 6px", borderRadius: 16, background: "#fff", border: `1px solid ${S.line}`, textAlign: "center",
                      }}>
                        <I size={20} color={S.ink} />
                        <div style={{ fontWeight: 600, fontSize: 12.5, marginTop: 7, lineHeight: 1.25 }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: S.muted, marginTop: 3 }}>{PRODUCTS.filter(p => p.cat === id).length} ürün</div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <button className="ny-btn" onClick={() => setPickCat(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: S.muted, fontSize: 14, fontWeight: 600, padding: "4px 0" }}>
                  <ChevronLeft size={15} /> Kategoriler
                </button>
                <div className="ny-display" style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{CATEGORIES[pickCat].label} — model seç</div>
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.values([...PRODUCTS.filter(p => p.cat === pickCat)].reduce((m, p) => { const c = m[p.fam]; if (!c || p.value[1] < c.value[1]) m[p.fam] = p; return m; }, {})).sort(modelOrder).map(p => (
                    <button key={p.id} className="ny-btn" onClick={() => pickProduct(p)} style={{
                      padding: "14px 16px", borderRadius: 14, background: "#fff", border: `1px solid ${S.line}`,
                      textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{p.brand} {famBase(p)}{p.hot && <span style={{ marginLeft: 6, background: "#EFF4FE", color: "#2563EB", padding: "1px 7px", borderRadius: 99, fontSize: 10.5, fontWeight: 700 }}>YENİ</span>}{FAM_COUNT[p.fam] > 1 && <span style={{ marginLeft: 6, color: "#5C6A7D", fontSize: 12, fontWeight: 500 }}>· {FAM_COUNT[p.fam]} seçenek</span>}</span>
                      <ArrowRight size={16} color={S.muted} />
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: S.muted, marginTop: 14, lineHeight: 1.5 }}>
                  Aradığın model listede yok mu? Ana ekrana dönüp yazarak ara — yapay zekâ listede olmayan ürünleri de tanır.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* --- CLARIFY: arıza + şehir --- */
  if (stage === "clarify" && draft) {
    const cat = draft.product ? draft.product.cat : draft.ai.category;
    const title = draft.product ? draft.product.brand + " " + draft.product.model : ((draft.ai.brand || "") + " " + (draft.ai.model || "")).trim();
    return (
      <div className="ny-root">
        <style>{styles}</style>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 18px 40px" }}>
          <Header back />
          <div className="ny-fade" style={{ paddingTop: 20 }}>
            <div style={{ fontSize: 14, color: S.muted }}>Ürün tanındı</div>
            <div className="ny-display" style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{title}</div>

            {draft.product && famSiblings(draft.product).length > 1 && (
              <div style={{ marginTop: 18 }}>
                <div className="ny-display" style={{ fontSize: 15, fontWeight: 700 }}>Hangi model / kapasite?</div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {famSiblings(draft.product).map(v => (
                    <Chip key={v.id} active={draft.product.id === v.id} onClick={() => setDraft({ ...draft, product: v })}>
                      {v.vl || v.model}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="ny-display" style={{ fontSize: 17, fontWeight: 700, marginTop: 26 }}>Ürünün durumu ne?</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {DEFECTS[cat].map(d => (
                <button key={d.id} className="ny-btn" onClick={() => finalize({ ...draft, defect: draft.product ? d : { ...d, repair: [r100(d.repair[0]), r100(d.repair[1])] } })} style={{
                  padding: "14px 16px", borderRadius: 14, background: "#fff", border: `1px solid ${S.line}`,
                  textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{d.label}</span>
                  <ArrowRight size={16} color={S.muted} />
                </button>
              ))}
            </div>

            <div className="ny-display" style={{ fontSize: 17, fontWeight: 700, marginTop: 26 }}>Şehir <span style={{ fontWeight: 400, color: S.muted, fontSize: 14 }}>(isteğe bağlı — yönlendirmeler için)</span></div>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CITIES.slice(0, 8).map(c => (
                <Chip key={c} active={draft.city === c} onClick={() => setDraft({ ...draft, city: draft.city === c ? null : c })}>{c}</Chip>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --- RESULT --- */
  if (stage === "result" && item && analysis) {
    const meta = ACTION_META[analysis.action];
    const altMeta = analysis.alt ? ACTION_META[analysis.alt === "sell" ? "sell" : analysis.alt] : null;
    const VerdictIcon = meta.icon;
    const ceiling = Math.max(item.workMax, analysis.brokenMax, item.repairMax, 1);
    const barCeil = Math.max(analysis.paths.repairSell[1], analysis.paths.sellAsIs[1], 1);
    const listPrice = item.isBroken ? analysis.brokenMax : item.workMax;
    const quickPrice = item.isBroken ? analysis.brokenMin : item.workMin;
    const cityQ = item.city || "";
    const CatIcon = CATEGORIES[item.cat].icon;
    const ew = isEwaste(item.cat);
    const repairQuery = item.cat === "bike" ? ("bisiklet tamircisi " + cityQ)
      : item.cat === "furniture" ? ("mobilya döşeme tamir " + cityQ)
      : item.cat === "camera" ? ("fotoğraf makinesi tamiri " + cityQ)
      : ((item.brand || item.title.split(" ")[0]) + " teknik servis " + cityQ);

    const TABS = [
      { id: "sell", label: "Sat", icon: Banknote, color: "#2563EB" },
      { id: "repair", label: "Tamir Et", icon: Wrench, color: "#D9660B" },
      { id: "donate", label: "Bağışla", icon: HeartHandshake, color: "#16A34A" },
      { id: "recycle", label: "Dönüştür", icon: Recycle, color: "#5B6878" },
    ];

    return (
      <div className="ny-root">
        <style>{styles}</style>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 18px 50px" }}>
          <Header back />

          <div className="ny-fade" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "#fff", border: `1px solid ${S.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CatIcon size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="ny-display" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{item.title}{item.hot && <span style={{ marginLeft: 8, background: "#EFF4FE", color: "#2563EB", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, verticalAlign: "middle" }}>YENİ</span>}</div>
              <div style={{ fontSize: 13.5, color: S.muted, marginTop: 2 }}>
                {item.defectLabel}{item.city ? " · " + item.city : ""}
                {item.confidence === "low" && <span style={{ marginLeft: 6, background: "#FEF3E7", color: "#B4550A", padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>Yapay zekâ tahmini</span>}
              </div>
            </div>
          </div>

          <Card className="ny-fade" style={{ marginTop: 16, background: meta.bg, border: `1.5px solid ${meta.color}33`, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: meta.color, fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>
              <VerdictIcon size={16} /> En mantıklı seçenek
            </div>
            <div className="ny-display" style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: meta.color, letterSpacing: "-0.02em" }}>
              {meta.label}{analysis.borderline && altMeta ? <span style={{ color: S.muted, fontWeight: 600, fontSize: 18 }}> · veya {altMeta.label.toLocaleLowerCase("tr-TR")}</span> : null}
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {analysis.reasons.map((r, i) => (
                <p key={i} style={{ fontSize: 14.5, lineHeight: 1.55, color: S.ink }}>{r}</p>
              ))}
            </div>
          </Card>

          {item.isBroken && (
            <Card className="ny-fade" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15 }}>
                <Scale size={17} /> Karar terazisi <span style={{ fontWeight: 400, color: S.muted, fontSize: 13 }}>· net eline geçecek</span>
              </div>
              {[
                { t: "Arızalı sat", v: analysis.paths.sellAsIs, c: "#2563EB" },
                { t: "Tamir ettir + sat", v: analysis.paths.repairSell, c: "#D9660B" },
              ].map(row => (
                <div key={row.t} style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{row.t}</span>
                    <span style={{ color: S.muted }}>{fmtRange([Math.max(row.v[0], 0), Math.max(row.v[1], 0)])}</span>
                  </div>
                  <RangeBar min={Math.max(row.v[0], 0)} max={Math.max(row.v[1], 0)} ceiling={barCeil} color={row.c} />
                </div>
              ))}
            </Card>
          )}

          <div className="ny-fade" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { t: item.isBroken ? "Arızalı satış değeri" : "Satış değeri", v: fmtRange([analysis.brokenMin, analysis.brokenMax]), bar: [analysis.brokenMin, analysis.brokenMax], c: "#2563EB" },
              ...(item.isBroken ? [
                { t: "Tahmini tamir maliyeti", v: fmtRange([item.repairMin, item.repairMax]), bar: [item.repairMin, item.repairMax], c: "#D9660B" },
                { t: "Tamir sonrası değer", v: fmtRange(analysis.post), bar: analysis.post, c: "#16A34A" },
              ] : []),
              { t: "Beklenen satış süresi", v: "~" + item.days + " gün" },
            ].map((card) => (
              <Card key={card.t} style={{ padding: 14 }}>
                <div style={{ fontSize: 12.5, color: S.muted, fontWeight: 600 }}>{card.t}</div>
                <div className="ny-display" style={{ fontSize: 16.5, fontWeight: 700, marginTop: 6, letterSpacing: "-0.01em" }}>{card.v}</div>
                {card.bar && <div style={{ marginTop: 10 }}><RangeBar min={card.bar[0]} max={card.bar[1]} ceiling={ceiling} color={card.c} /></div>}
              </Card>
            ))}
          </div>

          {/* SIFIR FİYATI */}
          <Card className="ny-fade" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15 }}>
              <Store size={17} color="#2563EB" /> Sıfır fiyatı
              {item.confidence === "low" && item.np && <span style={{ background: "#FEF3E7", color: "#B4550A", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600 }}>YZ tahmini</span>}
            </div>
            {item.np ? (
              <>
                <div className="ny-display" style={{ fontSize: 24, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em" }}>~{fmt(item.np)}</div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>İkinci el (çalışır)</span>
                    <span style={{ color: S.muted }}>sıfırın %{Math.round((item.workMin / item.np) * 100)}–%{Math.round((item.workMax / item.np) * 100)}'i</span>
                  </div>
                  <RangeBar min={item.workMin} max={item.workMax} ceiling={item.np} color="#2563EB" />
                </div>
                {item.isBroken && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>Mevcut haliyle ({item.defectLabel.toLocaleLowerCase("tr-TR")})</span>
                      <span style={{ color: S.muted }}>sıfırın %{Math.round((analysis.brokenMin / item.np) * 100)}–%{Math.round((analysis.brokenMax / item.np) * 100)}'i</span>
                    </div>
                    <RangeBar min={analysis.brokenMin} max={analysis.brokenMax} ceiling={item.np} color="#5B6878" />
                  </div>
                )}
                <p style={{ fontSize: 13, color: S.muted, marginTop: 12, lineHeight: 1.5 }}>
                  İlan kozu: Alıcı, sıfır yerine senin ürününü alarak yaklaşık <strong style={{ color: S.ink }}>{fmt(Math.max(item.np - item.workMax, 0))} – {fmt(Math.max(item.np - item.workMin, 0))}</strong> tasarruf eder. Bunu ilan metninde kullan.
                </p>
              </>
            ) : (
              <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
                Bu model artık sıfır olarak satılmıyor — ikinci el piyasası tek kaynak. Bu kıtlık, değerinin görece korunmasına yardımcı olur; ilanında "artık üretilmiyor" vurgusu yapabilirsin.
              </p>
            )}
            <div style={{ marginTop: 12 }}>
              {item.np ? (
                <>
                  <LinkRow
                    accent="#2563EB"
                    href={buyLink(item.brand || item.title.split(" ")[0], item.title)}
                    title={"Sıfırını satın al — " + (BUY_SEARCH[item.brand] ? item.brand + " resmî mağaza" : "Hepsiburada")}
                    sub="Doğrudan satın alma sayfasına git"
                    onClick={() => logEvent("redirect", { to: "buy_new", brand: item.brand })}
                  />
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["Trendyol'da", MARKETS.trendyol(item.title)], ["Akakçe'de fiyat karşılaştır", MARKETS.akakce(item.title)]].map(([t, h]) => (
                      <a key={t} href={h} target="_blank" rel="noreferrer" onClick={() => logEvent("redirect", { to: "market", label: t })}
                        style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", background: "#EFF4FE", padding: "7px 12px", borderRadius: 99, textDecoration: "none" }}>{t} ↗</a>
                    ))}
                  </div>
                </>
              ) : (
                <LinkRow
                  href={storeLink(item.brand || item.title.split(" ")[0], item.title)}
                  title={(item.brand || "Marka") + " resmî sitesi"}
                  sub="Güncel model ve fiyatları gör"
                  onClick={() => logEvent("redirect", { to: "brand_store", brand: item.brand })}
                />
              )}
            </div>
          </Card>

          <Card className="ny-fade" style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "flex-start", background: "#fff" }}>
            <TrendingDown size={19} color="#B4550A" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>
              <strong>Beklemenin maliyeti:</strong> Bu kategori ayda ~%{Math.round((CATEGORIES[item.cat].deprMonthly) * 100 * 10) / 10} değer kaybediyor. 6 ay beklerse tahmini <strong>{fmt(analysis.waitLoss)}</strong> eriyecek.
            </div>
          </Card>

          <div className="ny-fade" style={{ marginTop: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, background: "#E9EDF4", padding: 5, borderRadius: 16 }}>
              {TABS.map(t => {
                const I = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} className="ny-btn" onClick={() => { setTab(t.id); logEvent("tab", { tab: t.id }); }} style={{
                    padding: "10px 4px", borderRadius: 12, background: active ? "#fff" : "transparent",
                    boxShadow: active ? "0 2px 8px rgba(20,29,46,.10)" : "none",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                    <I size={17} color={active ? t.color : S.muted} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: active ? S.ink : S.muted }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>

              {tab === "sell" && (
                <>
                  <Card>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Önerilen ilan fiyatı</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      <div style={{ flex: 1, background: "#EFF4FE", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: S.muted, fontWeight: 600 }}>Hızlı satış</div>
                        <div className="ny-display" style={{ fontWeight: 800, fontSize: 17, marginTop: 4 }}>{fmt(quickPrice)}</div>
                      </div>
                      <div style={{ flex: 1, background: "#EFF4FE", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 12, color: S.muted, fontWeight: 600 }}>Sabırlı satış</div>
                        <div className="ny-display" style={{ fontWeight: 800, fontSize: 17, marginTop: 4 }}>{fmt(listPrice)}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: S.muted, marginTop: 10, lineHeight: 1.5 }}>
                      İpucu: İlanı %10 pazarlık payı bırakarak üst banttan aç; Türkiye'de pazarlıksız satış nadirdir.
                    </p>
                  </Card>

                  <Card>
                    <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles size={16} color="#2563EB" /> İlan metni
                    </div>
                    {!listing && (
                      <button className="ny-btn" onClick={makeListing} style={{ marginTop: 12, width: "100%", background: S.ink, color: "#fff", borderRadius: 12, padding: "13px", fontWeight: 600, fontSize: 15 }}>
                        Yapay zekâ ile ilan metni oluştur
                      </button>
                    )}
                    {listing && listing.loading && <p style={{ marginTop: 12, color: S.muted, fontSize: 14 }}>Metin hazırlanıyor…</p>}
                    {listing && listing.text && (
                      <>
                        <div style={{ marginTop: 12, background: "#F5F7FA", borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{listing.text}</div>
                        <button className="ny-btn" onClick={() => copyText(listing.text)} style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, background: "#fff", border: `1px solid ${S.line}`, borderRadius: 12, padding: "10px 14px", fontWeight: 600, fontSize: 14 }}>
                          {copied ? <Check size={15} color="#16A34A" /> : <Copy size={15} />} {copied ? "Kopyalandı" : "Metni kopyala"}
                        </button>
                      </>
                    )}
                  </Card>

                  <LinkRow href={"https://www.sahibinden.com/arama?query_text=" + enc(item.title + (item.isBroken ? " arızalı" : ""))} title="Sahibinden'de ara" sub="Benzer ilanları gör, fiyatını doğrula" onClick={() => logEvent("redirect", { to: "sahibinden" })} />
                  <LinkRow href={"https://dolap.com/ara?q=" + enc(item.title)} title="Dolap'ta ara" sub="Kargolu hızlı satış" onClick={() => logEvent("redirect", { to: "dolap" })} />
                  <LinkRow href={"https://www.facebook.com/marketplace/search/?query=" + enc(item.title)} title="Facebook Marketplace" sub="Yerel elden satış · Facebook girişi gerekir" onClick={() => logEvent("redirect", { to: "facebook" })} />
                  {(item.cat === "phone" || item.cat === "tablet" || item.cat === "watch") && (
                    <LinkRow href="https://getmobil.com" title="Getmobil — anında sat" sub="Cihazını hemen satın alırlar, uğraşsız" onClick={() => logEvent("redirect", { to: "getmobil" })} />
                  )}
                  {(item.cat === "furniture" || item.cat === "appliance") && (
                    <LinkRow href={"https://www.google.com/maps/search/" + enc("spotçu " + cityQ)} title="Spotçular (ikinci el eşyacı)" sub="Evden alır, nakit öder — hızlı çözüm" onClick={() => logEvent("redirect", { to: "spot" })} />
                  )}
                  <p style={{ fontSize: 12.5, color: S.muted, lineHeight: 1.5, padding: "0 4px" }}>
                    Link açılmıyor mu? Bazı siteler uygulama içi tarayıcıyı engeller — linke basılı tutup "tarayıcıda aç" seçeneğini dene.
                  </p>
                </>
              )}

              {tab === "repair" && (
                <>
                  {item.isBroken ? (
                    <Card>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Tahmini tamir maliyeti</div>
                      <div className="ny-display" style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: "#D9660B" }}>{fmtRange([item.repairMin, item.repairMax])}</div>
                      <p style={{ fontSize: 13.5, color: S.muted, marginTop: 8, lineHeight: 1.55 }}>
                        Özel servisler genelde yetkili servisten %30–50 daha uygundur; garanti süresini mutlaka sor.
                        {analysis.repairRatio >= 0.5 && " ⚠️ Bu üründe tamir maliyeti, tamir sonrası değerin yarısını aşıyor — ekonomik olarak riskli."}
                      </p>
                    </Card>
                  ) : (
                    <Card><p style={{ fontSize: 14.5, lineHeight: 1.55 }}>Ürünün bilinen bir arızası yok — tamir gerekmiyor. 🎉</p></Card>
                  )}
                  {item.brand && item.cat !== "bike" && item.cat !== "furniture" && (
                    <LinkRow
                      accent="#D9660B"
                      href={serviceLink(item.brand)}
                      title={item.brand + " Yetkili Servis"}
                      sub="Markanın resmî servis noktalarını gör"
                      onClick={() => logEvent("redirect", { to: "brand_service", brand: item.brand })}
                    />
                  )}
                  <LinkRow href={"https://www.google.com/maps/search/" + enc(repairQuery)} title={item.cat === "bike" ? "Bisiklet tamircileri" : item.cat === "furniture" ? "Döşemeciler / mobilya tamircileri" : "Yakındaki tamirciler"} sub={cityQ ? cityQ + " çevresinde ara" : "Haritada ara"} onClick={() => logEvent("redirect", { to: "maps_repair" })} />
                </>
              )}

              {tab === "donate" && (
                <>
                  <Card style={{ background: "#ECF8EF", border: "1px solid #CBEBD3" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Leaf size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 14, lineHeight: 1.55 }}>
                        {item.cat === "bike"
                          ? "Çalışır bir bisiklet, bir çocuğun okul yolunu değiştirir. Bisiklet bağışı kabul eden dernekler ve okul aile birlikleri var."
                          : item.cat === "furniture"
                          ? "Kullanılabilir mobilyalar, belediye sosyal marketleri ve dernekler aracılığıyla yeni ev kuran ihtiyaç sahibi ailelere ulaşıyor."
                          : `Çalışır bir ${CATEGORIES[item.cat].label.toLocaleLowerCase("tr-TR")} bağışlamak, ~${CATEGORIES[item.cat].ewasteKg} kg e-atığı önler — üstelik birinin hayatını kolaylaştırır.`}
                      </p>
                    </div>
                  </Card>
                  <LinkRow href="https://www.ihtiyacharitasi.org" title="İhtiyaç Haritası" sub="İhtiyaç sahipleriyle doğrudan eşleş" onClick={() => logEvent("redirect", { to: "ihtiyacharitasi" })} />
                  {ew && <LinkRow href="https://www.tegv.org" title="TEGV" sub="Eğitim gönüllüleri — çocuklar için teknoloji" onClick={() => logEvent("redirect", { to: "tegv" })} />}
                  <LinkRow href={"https://www.google.com/maps/search/" + enc((item.cat === "furniture" || item.cat === "appliance" ? "belediye sosyal market " : "bağış noktası ") + cityQ)} title={item.cat === "furniture" || item.cat === "appliance" ? "Belediye sosyal marketleri" : "Yakındaki bağış noktaları"} sub={cityQ ? cityQ + " içinde ara" : "Haritada ara"} onClick={() => logEvent("redirect", { to: "maps_donate" })} />
                  {item.isBroken && (
                    <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.5, padding: "0 4px" }}>
                      Not: Arızalı ürün bağışlamadan önce kurumla iletişime geç — çoğu kurum yalnızca çalışır ürün kabul eder.
                    </p>
                  )}
                </>
              )}

              {tab === "recycle" && (
                <>
                  <Card style={{ background: "#F0F2F5" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Recycle size={18} color="#5B6878" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 14, lineHeight: 1.55 }}>
                        {item.cat === "appliance"
                          ? "Beyaz eşya, hurda demir-bakır değeri taşır — arızalı bile olsa çöpe gitmesin. Birçok hurdacı ve belediye evden ücretsiz alır."
                          : item.cat === "bike"
                          ? "Bisiklet metal aksamıyla hurda değeri taşır; jant, vites gibi kullanılabilir parçaları ayrıca satılabilir."
                          : item.cat === "furniture"
                          ? "Mobilya için belediyelerin 'hacimli atık' hattını ara — çoğu ilçede randevuyla evden ücretsiz alınıyor."
                          : `Bu ürün ~${CATEGORIES[item.cat].ewasteKg} kg elektronik atık içeriyor. İçindeki değerli metaller lisanslı tesislerde geri kazanılıyor — çöpe giderse toprağa karışıyor.`}
                      </p>
                    </div>
                  </Card>
                  {ew ? (
                    <>
                      <LinkRow href={"https://www.google.com/maps/search/" + enc("elektronik atık geri dönüşüm " + cityQ)} title="E-atık toplama noktaları" sub={cityQ ? cityQ + " içinde ara" : "Haritada ara"} onClick={() => logEvent("redirect", { to: "maps_recycle" })} />
                      <LinkRow href={"https://www.google.com/search?q=" + enc(cityQ + " belediyesi elektronik atık")} title="Belediye geri dönüşüm merkezi" sub="Ücretsiz teslim, bazıları evden alıyor" onClick={() => logEvent("redirect", { to: "municipality" })} />
                      <LinkRow href="https://www.tap.org.tr" title="TAP — Taşınabilir Pil Derneği" sub="Pil ve batarya toplama noktaları" onClick={() => logEvent("redirect", { to: "tap" })} />
                    </>
                  ) : (
                    <>
                      <LinkRow href={"https://www.google.com/search?q=" + enc(cityQ + " belediyesi hacimli atık evden alma")} title="Belediye hacimli atık hattı" sub="Randevuyla evden ücretsiz alım" onClick={() => logEvent("redirect", { to: "bulky" })} />
                      <LinkRow href={"https://www.google.com/maps/search/" + enc("hurdacı " + cityQ)} title="Hurdacılar" sub="Metal aksam için — evden alır" onClick={() => logEvent("redirect", { to: "scrap" })} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <p style={{ marginTop: 26, fontSize: 12.5, color: S.muted, textAlign: "center", lineHeight: 1.6 }}>
            Tüm değerler tahminidir; kesin fiyat için güncel ilanları karşılaştır.<br />
            MVP örnek veri seti — üretim öncesi güncel piyasa verisiyle değiştirilmelidir.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
