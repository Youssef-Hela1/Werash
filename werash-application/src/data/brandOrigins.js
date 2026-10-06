// Auto-generated from Brand_Country_Origins.xlsx
export const BRAND_COUNTRY_ORIGINS = {
    "acura":  "Japanese",
    "alfa romeo":  "Italian",
    "alfa-romeo":  "Italian",
    "audi":  "German",
    "baic":  "Chinese",
    "bmw":  "German",
    "byd":  "Chinese",
    "cadillac":  "American",
    "changan":  "Chinese",
    "chery":  "Chinese",
    "chevrolet":  "American",
    "citroen":  "French",
    "cupra":  "Spanish",
    "daewoo":  "Korean",
    "daihatsu":  "Japanese",
    "datsun":  "Japanese",
    "dayun":  "Chinese",
    "dodge":  "American",
    "dongfeng":  "Chinese",
    "ds":  "French",
    "fiat":  "Italian",
    "ford":  "American",
    "forthing":  "Chinese",
    "gac":  "Chinese",
    "geely":  "Chinese",
    "gmc":  "American",
    "haval":  "Chinese",
    "honda":  "Japanese",
    "hummer":  "American",
    "hyundai":  "Korean",
    "infiniti":  "Japanese",
    "isuzu":  "Japanese",
    "jac":  "Chinese",
    "jaguar":  "British",
    "jeep":  "American",
    "jetour":  "Chinese",
    "kia":  "Korean",
    "lada":  "Russian",
    "land rover":  "British",
    "land-rover":  "British",
    "maserati":  "Italian",
    "mazda":  "Japanese",
    "mercedes-benz":  "German",
    "mercedes benz":  "German",
    "mg":  "British",
    "mini cooper":  "British",
    "mini-cooper":  "British",
    "mitsubishi":  "Japanese",
    "nissan":  "Japanese",
    "opel":  "German",
    "peugeot":  "French",
    "porsche":  "German",
    "proton":  "Malaysian",
    "renault":  "French",
    "seat":  "Spanish",
    "skoda":  "Czech",
    "subaru":  "Japanese",
    "suzuki":  "Japanese",
    "tata":  "Indian",
    "tesla":  "American",
    "toyota":  "Japanese",
    "volkswagen":  "German",
    "volvo":  "German"
};

export const getBrandOrigin = (brandName) => {
  if (!brandName) return null;
  const clean = String(brandName).trim().toLowerCase();
  return BRAND_COUNTRY_ORIGINS[clean] || 
         BRAND_COUNTRY_ORIGINS[clean.replace(/\s+/g, '-')] || 
         BRAND_COUNTRY_ORIGINS[clean.replace(/-/g, ' ')] || 
         (clean.includes('mercedes') ? 'German' : null) ||
         (clean.includes('bmw') ? 'German' : null) ||
         (clean.includes('mini') ? 'British' : null) ||
         (clean.includes('rover') ? 'British' : null) ||
         null;
};

export default BRAND_COUNTRY_ORIGINS;