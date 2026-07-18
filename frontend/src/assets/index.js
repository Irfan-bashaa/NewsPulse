// src/assets/index.js

// 1. Reliable Public CDN fallback image
const placeholder = "https://upload.wikimedia.org/wikipedia/commons/6/6b/News_default.png"; 

// 2. Verified public image links that bypass hotlink security blocks
const eenadu = "https://upload.wikimedia.org/wikipedia/commons/4/43/Eenadu_front_page_logo_new.png";
const sakshi = "https://upload.wikimedia.org/wikipedia/commons/e/ec/Sakshi_newspaper_logo.png";
const andhraJyothi = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Andhra_Jyothi_logo.png/640px-Andhra_Jyothi_logo.png";
const tv9Telugu = "https://upload.wikimedia.org/wikipedia/commons/a/a2/TV9_Telugu_logo.png";
const ntvTelugu = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/NTV_Telugu_Logo.png/640px-NTV_Telugu_Logo.png";

// 3. Fallback assignments (Everything else safe from crashing)
const tv5Telugu = placeholder;
const namastheTelangana = placeholder;
const v6News = placeholder;
const prajavani = placeholder;
const vijayaKarnataka = placeholder;
const vijayavani = placeholder;
const news18Kannada = placeholder;
const tv9Kannada = placeholder;
const dinaThanthi = placeholder;
const dinamalar = placeholder;
const theHindu = placeholder;
const puthiyaThalaimurai = placeholder;
const sunNews = placeholder;
const manorama = placeholder;
const mathrubhumi = placeholder;
const asianetNews = placeholder;
const deshabhimani = placeholder;
const lokmat = placeholder;
const sakal = placeholder;
const loksatta = placeholder;
const abpMajha = placeholder;
const zee24Taas = placeholder;
const gujaratSamachar = placeholder;
const sandesh = placeholder;
const divyaBhaskar = placeholder;
const tv9Gujarati = placeholder;
const dainikBhaskar = placeholder;
const patrika = placeholder;
const naiDunia = placeholder;
const ibc24 = placeholder;
const navaBharat = placeholder;
const navhindTimes = placeholder;
const oHeraldo = placeholder;
const prudentMedia = placeholder;
const dainikJagran = placeholder;
const amarUjala = placeholder;
const hindustan = placeholder;
const abpGanga = placeholder;
const ajit = placeholder;
const jagBani = placeholder;
const ptcNews = placeholder;
const tribune = placeholder;
const punjabKesari = placeholder;
const zeePhh = placeholder;
const divyaHimachal = placeholder;
const rajasthanPatrika = placeholder;
const firstIndia = placeholder;
const prabhatKhabar = placeholder;
const news18Bihar = placeholder;
const anandabazar = placeholder;
const bartaman = placeholder;
const abpAnanda = placeholder;
const zee24Ghanta = placeholder;
const sambad = placeholder;
const dharitri = placeholder;
const samaja = placeholder;
const otv = placeholder;
const asomiyaPratidin = placeholder;
const assamTribune = placeholder;
const newsLive = placeholder;
const dy365 = placeholder;
const arunachalTimes = placeholder;
const arunachal24 = placeholder;
const sangaiExpress = placeholder;
const imphalFreePress = placeholder;
const shillongTimes = placeholder;
const mawphor = placeholder;
const vanglaini = placeholder;
const zonet = placeholder;
const nagalandPost = placeholder;
const morungExpress = placeholder;
const sikkimExpress = placeholder;
const sikkimChronicle = placeholder;
const dainikSambad = placeholder;
const syandanPatrika = placeholder;

// 4. Export clean interface object bundle
export const icons = {
  eenadu, sakshi, andhraJyothi, tv9Telugu, ntvTelugu, tv5Telugu, namastheTelangana, v6News,
  prajavani, vijayaKarnataka, vijayavani, news18Kannada, tv9Kannada, dinaThanthi,
  dinamalar, theHindu, puthiyaThalaimurai, sunNews, manorama, mathrubhumi,
  asianetNews, deshabhimani, lokmat, sakal, loksatta, abpMajha, zee24Taas,
  gujaratSamachar, sandesh, divyaBhaskar, tv9Gujarati, dainikBhaskar, patrika,
  naiDunia, ibc24, navaBharat, navhindTimes, oHeraldo, prudentMedia, dainikJagran,
  amarUjala, hindustan, abpGanga, ajit, jagBani, ptcNews, tribune, punjabKesari,
  zeePhh, divyaHimachal, rajasthanPatrika, firstIndia, prabhatKhabar, news18Bihar,
  anandabazar, bartaman, abpAnanda, zee24Ghanta, sambad, dharitri, samaja, otv,
  asomiyaPratidin, assamTribune, newsLive, dy365, arunachalTimes, arunachal24,
  sangaiExpress, imphalFreePress, shillongTimes, mawphor, vanglaini, zonet,
  nagalandPost, morungExpress, sikkimExpress, sikkimChronicle, dainikSambad,
  syandanPatrika, placeholder
};