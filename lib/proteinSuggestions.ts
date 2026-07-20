// High-protein dish suggestions by cuisine type
// Matched against OSM cuisine tags (lowercase, spaces normalised)

interface Suggestion {
  dish: string;
  protein: string;
}

const SUGGESTIONS: Record<string, Suggestion[]> = {
  chinese: [
    { dish: "白切雞飯", protein: "~35g" },
    { dish: "蒸魚配飯", protein: "~30g" },
    { dish: "豉汁蒸排骨", protein: "~28g" },
  ],
  cantonese: [
    { dish: "白切雞飯", protein: "~35g" },
    { dish: "燒鴨飯（去皮）", protein: "~32g" },
    { dish: "蒸倉魚", protein: "~30g" },
  ],
  japanese: [
    { dish: "刺身定食", protein: "~40g" },
    { dish: "燒三文魚定食", protein: "~35g" },
    { dish: "雞肉照燒定食", protein: "~33g" },
  ],
  sushi: [
    { dish: "三文魚刺身 (10片)", protein: "~40g" },
    { dish: "吞拿魚手卷", protein: "~25g" },
  ],
  korean: [
    { dish: "韓式烤牛肉", protein: "~38g" },
    { dish: "豆腐鍋配蛋", protein: "~28g" },
    { dish: "人參雞湯", protein: "~45g" },
  ],
  thai: [
    { dish: "泰式燒雞", protein: "~35g" },
    { dish: "冬蔭功蝦湯", protein: "~25g" },
  ],
  vietnamese: [
    { dish: "牛肉湯河 (加牛肉)", protein: "~30g" },
    { dish: "越式烤豬扒飯", protein: "~32g" },
  ],
  italian: [
    { dish: "烤雞胸沙律", protein: "~35g" },
    { dish: "海鮮意粉", protein: "~28g" },
  ],
  american: [
    { dish: "烤雞胸配菜", protein: "~40g" },
    { dish: "牛扒 (8oz)", protein: "~50g" },
  ],
  burger: [
    { dish: "雙層牛肉漢堡 (走醬)", protein: "~35g" },
    { dish: "烤雞漢堡", protein: "~30g" },
  ],
  indian: [
    { dish: "Tandoori 烤雞", protein: "~40g" },
    { dish: "咖喱雞配飯", protein: "~30g" },
  ],
  noodle: [
    { dish: "牛腩湯麵 (加牛)", protein: "~28g" },
    { dish: "雲吞麵 (大)", protein: "~22g" },
  ],
  seafood: [
    { dish: "蒸魚", protein: "~35g" },
    { dish: "白灼蝦", protein: "~30g" },
  ],
  hotpot: [
    { dish: "牛肉+豆腐+蛋", protein: "~45g" },
  ],
  ramen: [
    { dish: "叉燒拉麵 (加蛋)", protein: "~30g" },
  ],
  pizza: [
    { dish: "雞肉披薩 (2片)", protein: "~25g" },
  ],
  coffee_shop: [
    { dish: "雞胸沙律", protein: "~30g" },
    { dish: "蛋白奶昔", protein: "~25g" },
  ],
  "咖啡廳": [
    { dish: "雞胸沙律", protein: "~30g" },
    { dish: "烚蛋多士", protein: "~18g" },
  ],
  "快餐": [
    { dish: "烤雞漢堡", protein: "~30g" },
    { dish: "雞扒飯", protein: "~32g" },
  ],
  "餐廳": [
    { dish: "雞扒/豬扒飯", protein: "~32g" },
    { dish: "蒸魚配飯", protein: "~30g" },
  ],
};

// Generic fallback for any restaurant
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { dish: "雞胸/雞扒類", protein: "~30-35g" },
  { dish: "魚類菜式", protein: "~28-35g" },
  { dish: "牛肉類", protein: "~30-40g" },
];

export function getProteinSuggestions(types: string[]): Suggestion[] {
  for (const t of types) {
    const key = t.toLowerCase().trim().replace(/ /g, "_");
    if (SUGGESTIONS[key]) return SUGGESTIONS[key];
    // Also try without underscore normalisation
    if (SUGGESTIONS[t]) return SUGGESTIONS[t];
  }
  return DEFAULT_SUGGESTIONS;
}
