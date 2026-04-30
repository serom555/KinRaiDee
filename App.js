import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import restaurantsData from './src/data/restaurants.json';

const UI = {
  bg: '#FFF8F1',
  bg2: '#FFFDF9',
  card: '#FFFFFF',
  line: '#F2DFCF',
  text: '#1F2937',
  sub: '#6B7280',
  muted: '#9CA3AF',
  orange: '#FF6B00',
  orange2: '#FF8A1F',
  orangeSoft: '#FFF1E6',
  cream: '#FFF7ED',
  green: '#16A34A',
  greenSoft: '#ECFDF5',
  red: '#EF4444',
  yellow: '#F59E0B',
  purple: '#7C3AED',
  blue: '#2563EB',
};

const CATEGORY_ORDER = [
  'ทั้งหมด',
  'ตามสั่ง',
  'ก๋วยเตี๋ยว',
  'ข้าวแกง',
  'อาหารจานเดียว',
  'อีสาน',
  'คาเฟ่',
  'ของหวาน',
  'เครื่องดื่ม',
  'สุขภาพ',
  'ญี่ปุ่น',
  'เกาหลี',
  'ชาบู',
  'อาหารเช้า',
  'ฟาสต์ฟู้ด',
  'ปิ้งย่าง',
];

const DATA_CATEGORIES = Array.from(new Set(restaurantsData.map((r) => r.category)));
const CATEGORIES = CATEGORY_ORDER.filter((c) => c === 'ทั้งหมด' || DATA_CATEGORIES.includes(c))
  .concat(DATA_CATEGORIES.filter((c) => !CATEGORY_ORDER.includes(c)));

const SORT_OPTIONS = ['แนะนำ', 'ใกล้สุด', 'ถูกสุด', 'คะแนนสูงสุด', 'เปิดอยู่'];
const MOODS = ['ทั้งหมด', 'งบประหยัด', 'กินอิ่ม', 'ของหวาน', 'เครื่องดื่ม', 'สายสุขภาพ', 'กินกับเพื่อน'];

function baht(price) {
  return `฿${price}`;
}

function getMenus(restaurant) {
  return Array.isArray(restaurant.menus) && restaurant.menus.length
    ? restaurant.menus
    : [{ id: `${restaurant.id}-fallback`, name: restaurant.menu || 'เมนูแนะนำ', price: restaurant.price || 50, popular: true }];
}

function getMinPrice(restaurant) {
  const prices = getMenus(restaurant).map((m) => Number(m.price || 0)).filter(Boolean);
  return prices.length ? Math.min(...prices) : 50;
}

function getPopularMenu(restaurant) {
  const menus = getMenus(restaurant);
  return menus.find((m) => m.popular) || menus[0];
}

function getFoodEmoji(menuName = '', category = '') {
  const text = `${menuName} ${category}`.toLowerCase();

  if (text.includes('ก๋วยเตี๋ยว') || text.includes('ราเมง') || text.includes('บะหมี่') || text.includes('ต้มยำ')) return '🍜';
  if (text.includes('ชาบู') || text.includes('หม้อไฟ')) return '🍲';
  if (text.includes('เบอร์เกอร์') || text.includes('burger') || text.includes('ฟรายส์') || text.includes('ไก่ทอด')) return '🍔';
  if (text.includes('กาแฟ') || text.includes('latte') || text.includes('americano') || text.includes('คาเฟ่')) return '☕';
  if (text.includes('ชา') || text.includes('โกโก้') || text.includes('นม') || text.includes('น้ำ') || text.includes('ปั่น') || text.includes('ไข่มุก')) return '🥤';
  if (text.includes('เค้ก') || text.includes('บิงซู') || text.includes('โทสต์') || text.includes('ปัง') || text.includes('บัวลอย') || text.includes('ของหวาน')) return '🍰';
  if (text.includes('ส้มตำ') || text.includes('ลาบ') || text.includes('ยำ') || text.includes('สลัด') || text.includes('สุขภาพ')) return '🥗';
  if (text.includes('หมาล่า') || text.includes('ปิ้ง') || text.includes('ย่าง')) return '🍢';
  if (text.includes('ไข่') || text.includes('โจ๊ก') || text.includes('อาหารเช้า')) return '🍳';
  if (text.includes('แกงกะหรี่') || text.includes('ญี่ปุ่น') || text.includes('คัตสึ') || text.includes('เทริยากิ')) return '🍱';
  if (text.includes('ข้าว') || text.includes('กะเพรา') || text.includes('แกง') || text.includes('หมูกรอบ') || text.includes('หมูกระเทียม')) return '🍛';
  return '🍽️';
}

function getCategoryEmoji(category = '') {
  if (category.includes('ก๋วยเตี๋ยว')) return '🍜';
  if (category.includes('คาเฟ่')) return '☕';
  if (category.includes('เครื่องดื่ม')) return '🥤';
  if (category.includes('ของหวาน')) return '🍰';
  if (category.includes('สุขภาพ')) return '🥗';
  if (category.includes('ญี่ปุ่น') || category.includes('เกาหลี')) return '🍱';
  if (category.includes('ชาบู')) return '🍲';
  if (category.includes('ฟาสต์ฟู้ด')) return '🍔';
  if (category.includes('อีสาน')) return '🌶️';
  if (category.includes('อาหารเช้า')) return '🍳';
  if (category.includes('ปิ้งย่าง')) return '🍢';
  return '🍽️';
}

function recommendationScore(restaurant) {
  const price = getMinPrice(restaurant);
  return (
    (restaurant.isOpen ? 10 : -20) +
    Number(restaurant.rating || 0) * 3 +
    Math.max(0, 3 - Number(restaurant.distanceKm || 0)) * 2 +
    (price <= 60 ? 3 : 0)
  );
}

function matchMood(restaurant, mood) {
  if (mood === 'ทั้งหมด') return true;
  const text = `${restaurant.name} ${restaurant.category} ${(restaurant.tags || []).join(' ')} ${getMenus(restaurant).map((m) => m.name).join(' ')}`;
  const minPrice = getMinPrice(restaurant);

  if (mood === 'งบประหยัด') return minPrice <= 60;
  if (mood === 'กินอิ่ม') return /ข้าว|กะเพรา|ชาบู|เบอร์เกอร์|ราเมง|ก๋วยเตี๋ยว|แกง/.test(text);
  if (mood === 'ของหวาน') return /หวาน|เค้ก|บิงซู|ปัง|โทสต์|บัวลอย/.test(text);
  if (mood === 'เครื่องดื่ม') return /ชา|กาแฟ|โกโก้|นม|น้ำ|ปั่น|latte|americano/i.test(text);
  if (mood === 'สายสุขภาพ') return /สุขภาพ|สลัด|ผลไม้|โยเกิร์ต|ไรซ์เบอร์รี่/.test(text);
  if (mood === 'กินกับเพื่อน') return /ชาบู|ปิ้ง|ย่าง|หมาล่า|ฟาสต์ฟู้ด/.test(text);
  return true;
}

function smartPick(restaurants, avoidId = null) {
  let active = restaurants.filter((r) => r.isOpen && r.id !== avoidId);
  if (!active.length) active = restaurants.filter((r) => r.isOpen);
  const pool = active.length ? active : restaurants;
  if (!pool.length) return null;

  const weighted = pool.map((r) => ({ ...r, score: Math.max(1, recommendationScore(r)) }));
  const total = weighted.reduce((sum, r) => sum + r.score, 0);
  let random = Math.random() * total;

  let pickedRestaurant = weighted[0];
  for (const item of weighted) {
    random -= item.score;
    if (random <= 0) {
      pickedRestaurant = item;
      break;
    }
  }

  const menus = getMenus(pickedRestaurant);
  const boosted = menus.flatMap((m) => (m.popular ? [m, m, m] : [m]));
  const pickedMenu = boosted[Math.floor(Math.random() * boosted.length)];

  return { restaurant: pickedRestaurant, menu: pickedMenu };
}

function Badge({ children, tone = 'orange' }) {
  const map = {
    orange: { bg: UI.orangeSoft, color: UI.orange },
    green: { bg: UI.greenSoft, color: UI.green },
    neutral: { bg: '#F3F4F6', color: UI.sub },
    yellow: { bg: '#FEF3C7', color: '#B45309' },
  };
  const color = map[tone] || map.orange;
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.badgeText, { color: color.color }]}>{children}</Text>
    </View>
  );
}

function AntLogo({ size = 54 }) {
  return (
    <View style={[styles.antLogo, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={{ fontSize: size * 0.5 }}>🐜</Text>
    </View>
  );
}

function Pill({ label, active, onPress, icon }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {icon ? `${icon} ` : ''}{label}
      </Text>
    </TouchableOpacity>
  );
}

function Stat({ icon, label, value, helper }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}><Text style={styles.statIconText}>{icon}</Text></View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statHelper}>{helper}</Text>
      </View>
    </View>
  );
}

function RestaurantRow({ restaurant, favorite, onFavorite }) {
  const menu = getPopularMenu(restaurant);
  const emoji = getFoodEmoji(menu.name, restaurant.category);

  return (
    <View style={styles.restaurantRow}>
      <View style={styles.restaurantThumb}>
        <Text style={styles.restaurantThumbText}>{emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <TouchableOpacity onPress={onFavorite} style={styles.bookmarkButton}>
            <Text style={[styles.bookmarkText, favorite && { color: UI.orange }]}>
              {favorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.restaurantSub}>{restaurant.highlight}</Text>
        <View style={styles.restaurantMeta}>
          <Badge>{restaurant.category}</Badge>
          <Badge tone="neutral">{restaurant.distanceKm.toFixed(1)} กม.</Badge>
          <Badge tone={restaurant.isOpen ? 'green' : 'neutral'}>{restaurant.isOpen ? 'เปิดอยู่' : 'ปิดอยู่'}</Badge>
        </View>
        <View style={styles.menuPreview}>
          <Text style={styles.menuPreviewLabel}>เมนูในร้าน</Text>
          <Text style={styles.menuPreviewText}>{menu.name}</Text>
          <Text style={styles.menuPrice}>฿{menu.price}</Text>
        </View>
      </View>
    </View>
  );
}

function RandomResult({ result, onRandom, lastRestaurantId }) {
  if (!result) {
    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>สุ่มเมนูให้อร่อยแล้ว! ✨</Text>
        <Text style={styles.resultEmpty}>กดปุ่มสุ่มเพื่อเริ่มเลือกเมนูจากร้านใกล้ มจธ.</Text>
        <TouchableOpacity onPress={onRandom} style={styles.resultButton}>
          <Text style={styles.resultButtonText}>สุ่มเลย</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { restaurant, menu } = result;
  const emoji = getFoodEmoji(menu.name, restaurant.category);

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHead}>
        <Text style={styles.resultTitle}>สุ่มเมนูให้อร่อยแล้ว! ✨</Text>
        <View style={styles.diceBox}><Text style={styles.diceText}>🎲</Text></View>
      </View>

      <View style={styles.selectedShop}>
        <Text style={styles.smallLabel}>ร้านที่เลือก</Text>
        <Text style={styles.selectedShopName}>{restaurant.name}</Text>
        <Text style={styles.selectedShopMeta}>
          {restaurant.category} · ⭐ {restaurant.rating} ({restaurant.reviewCount}) · {restaurant.priceLevel}
        </Text>
      </View>

      <View style={styles.downArrow}><Text style={styles.downArrowText}>↓</Text></View>

      <View style={styles.selectedMenu}>
        <View style={styles.foodEmojiBox}><Text style={styles.foodEmoji}>{emoji}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.smallLabel}>เมนูจากร้านนี้</Text>
          <Text style={styles.selectedMenuName}>{menu.name}</Text>
          <Text style={styles.selectedMenuDesc}>{menu.description || 'เมนูที่มีในร้านนี้จริง'}</Text>
          {menu.popular ? <Badge>เมนูยอดนิยม</Badge> : null}
        </View>
        <Text style={styles.selectedPrice}>฿{menu.price}</Text>
      </View>

      <TouchableOpacity onPress={onRandom} style={styles.fullOrangeButton}>
        <Text style={styles.fullOrangeButtonText}>สุ่มอีกครั้งแบบไม่ซ้ำร้านเดิม</Text>
      </TouchableOpacity>
    </View>
  );
}

function MoodCard({ mood, active, onPress }) {
  const icon = {
    'ทั้งหมด': '✨',
    'งบประหยัด': '💸',
    'กินอิ่ม': '🍛',
    'ของหวาน': '🍰',
    'เครื่องดื่ม': '🥤',
    'สายสุขภาพ': '🥗',
    'กินกับเพื่อน': '🍲',
  }[mood] || '🍽️';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.moodCard, active && styles.moodCardActive]}>
      <Text style={styles.moodIcon}>{icon}</Text>
      <Text style={[styles.moodText, active && styles.moodTextActive]}>{mood}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('แนะนำ');
  const [mood, setMood] = useState('ทั้งหมด');
  const [favorites, setFavorites] = useState(['r-001', 'r-006']);
  const [history, setHistory] = useState([]);
  const [randomResult, setRandomResult] = useState(() => smartPick(restaurantsData));

  const filtered = useMemo(() => {
    let list = restaurantsData.filter((r) => {
      const menusText = getMenus(r).map((m) => m.name).join(' ');
      const q = `${r.name} ${r.category} ${(r.tags || []).join(' ')} ${menusText}`.toLowerCase();
      const matchText = q.includes(search.trim().toLowerCase());
      const matchCategory = category === 'ทั้งหมด' || r.category === category || (r.tags || []).includes(category);
      const matchMoodFilter = matchMood(r, mood);
      return matchText && matchCategory && matchMoodFilter;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'ใกล้สุด') return Number(a.distanceKm || 0) - Number(b.distanceKm || 0);
      if (sortBy === 'ถูกสุด') return getMinPrice(a) - getMinPrice(b);
      if (sortBy === 'คะแนนสูงสุด') return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === 'เปิดอยู่') return Number(b.isOpen) - Number(a.isOpen);
      return recommendationScore(b) - recommendationScore(a);
    });
  }, [search, category, sortBy, mood]);

  const stats = useMemo(() => {
    const totalMenus = restaurantsData.reduce((sum, r) => sum + getMenus(r).length, 0);
    const avgRating = restaurantsData.reduce((sum, r) => sum + Number(r.rating || 0), 0) / restaurantsData.length;
    const totalReviews = restaurantsData.reduce((sum, r) => sum + Number(r.reviewCount || 0), 0);
    return {
      shops: restaurantsData.length,
      menus: totalMenus,
      avgRating: avgRating.toFixed(1),
      reviews: totalReviews,
    };
  }, []);

  const topMenus = useMemo(() => {
    return restaurantsData
      .map((r) => ({ restaurant: r, menu: getPopularMenu(r) }))
      .sort((a, b) => Number(b.restaurant.rating || 0) - Number(a.restaurant.rating || 0))
      .slice(0, 7);
  }, []);

  const budgetPicks = useMemo(() => {
    return restaurantsData
      .map((r) => ({ restaurant: r, menu: getMenus(r).sort((a,b) => a.price - b.price)[0] }))
      .sort((a, b) => a.menu.price - b.menu.price)
      .slice(0, 5);
  }, []);

  const handleRandom = () => {
    const result = smartPick(filtered.length ? filtered : restaurantsData, randomResult?.restaurant?.id);
    setRandomResult(result);
    if (result) {
      setHistory((prev) => [result, ...prev.filter((x) => x.restaurant.id !== result.restaurant.id)].slice(0, 5));
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.bgBlobOne} />
        <View style={styles.bgBlobTwo} />

        <View style={styles.navbar}>
          <View style={styles.brand}>
            <AntLogo size={54} />
            <View>
              <Text style={styles.brandTitle}>App MODHIW</Text>
              <Text style={styles.brandSub}>กินอะไรดีแถว มจธ.</Text>
            </View>
          </View>
          <View style={styles.navLinks}>
            <Text style={styles.navActive}>หน้าแรก</Text>
            <Text style={styles.navText}>ร้านอาหาร</Text>
            <Text style={styles.navText}>เมนูยอดนิยม</Text>
            <Text style={styles.navText}>เกี่ยวกับ</Text>
          </View>
        </View>

        <View style={[styles.heroGrid, isWide && { flexDirection: 'row' }]}>
          <View style={[styles.heroLeft, isWide && { flex: 1.1 }]}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>วันนี้<Text style={{ color: UI.orange }}>กินอะไรดี?</Text></Text>
              <Text style={styles.heroSubtitle}>สุ่มเมนูอร่อยจากร้านใกล้ มจธ.</Text>
              <Text style={styles.heroDesc}>ระบบจะเลือกร้านก่อน แล้วสุ่มเฉพาะเมนูที่มีในร้านนั้นจริง ไม่มั่วร้านกับเมนู</Text>
              <TouchableOpacity onPress={handleRandom} style={styles.heroButton}>
                <Text style={styles.heroButtonText}>🍴 สุ่มเมนูให้อร่อยเลย ✨</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroMascot}>
              <Text style={styles.heroMascotText}>🐜</Text>
              <Text style={styles.sparkle1}>✦</Text>
              <Text style={styles.sparkle2}>✧</Text>
            </View>
          </View>

          <View style={[styles.featureCard, isWide && { flex: 0.95 }]}>
            <Badge tone="yellow">⭐ แนะนำวันนี้</Badge>
            <Text style={styles.featureMenu}>{randomResult?.menu?.name || 'กะเพราหมูกรอบ + ไข่ดาว'}</Text>
            <Text style={styles.featureShop}>{randomResult?.restaurant?.name || 'ครัวบางมด'}</Text>
            <View style={styles.featureStats}>
              <Text style={styles.featureStat}>⭐ {randomResult?.restaurant?.rating || '4.7'}</Text>
              <Text style={styles.featureStat}>{randomResult?.restaurant?.priceLevel || '฿'}</Text>
              <Text style={styles.featureStat}>{randomResult?.restaurant?.distanceKm?.toFixed(1) || '0.4'} กม.</Text>
            </View>
            <View style={styles.foodPlate}>
              <Text style={styles.foodPlateEmoji}>{randomResult ? getFoodEmoji(randomResult.menu.name, randomResult.restaurant.category) : '🍳'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.categoryBar}>
          {CATEGORIES.slice(0, 10).map((item) => (
            <Pill
              key={item}
              label={item}
              active={category === item}
              onPress={() => setCategory(item)}
              icon={item === 'ทั้งหมด' ? '▦' : getCategoryEmoji(item)}
            />
          ))}
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.moodTitle}>วันนี้อยากกินแบบไหน?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.moodRow}>
              {MOODS.map((item) => (
                <MoodCard key={item} mood={item} active={mood === item} onPress={() => setMood(item)} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.statsBar}>
          <Stat icon="🍴" label="ร้านอาหารทั้งหมด" value={stats.shops} helper="ร้าน" />
          <Stat icon="⭐" label="คะแนนเฉลี่ย" value={stats.avgRating} helper="จาก 5" />
          <Stat icon="🔥" label="เมนูทั้งหมด" value={stats.menus} helper="เมนู" />
          <Stat icon="🧡" label="รีวิวรวม" value={stats.reviews.toLocaleString()} helper="รีวิว" />
        </View>

        <View style={[styles.mainGrid, isWide && { flexDirection: 'row' }]}>
          <View style={[styles.leftPane, isWide && { flex: 1.15 }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>ร้านอาหารใกล้ มจธ.</Text>
                <Text style={styles.sectionSub}>{filtered.length} ร้านที่ตรงกับเงื่อนไข</Text>
              </View>
              <Text style={styles.viewAll}>ดูทั้งหมด →</Text>
            </View>

            <View style={styles.searchFilterCard}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="ค้นหาร้านหรือเมนู..."
                placeholderTextColor={UI.muted}
                style={styles.searchInput}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sortRow}>
                  {SORT_OPTIONS.map((item) => (
                    <Pill key={item} label={item} active={sortBy === item} onPress={() => setSortBy(item)} />
                  ))}
                </View>
              </ScrollView>
            </View>

            {filtered.slice(0, 18).map((restaurant) => (
              <RestaurantRow
                key={restaurant.id}
                restaurant={restaurant}
                favorite={favorites.includes(restaurant.id)}
                onFavorite={() => toggleFavorite(restaurant.id)}
              />
            ))}
          </View>

          <View style={[styles.rightPane, isWide && { flex: 0.85 }]}>
            <RandomResult result={randomResult} onRandom={handleRandom} />

            <View style={styles.popularCard}>
              <Text style={styles.popularTitle}>เมนูยอดนิยม</Text>
              {topMenus.map(({ restaurant, menu }) => (
                <View key={`${restaurant.id}-${menu.id}`} style={styles.popularRow}>
                  <Text style={styles.popularEmoji}>{getFoodEmoji(menu.name, restaurant.category)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popularMenu}>{menu.name}</Text>
                    <Text style={styles.popularShop}>{restaurant.name}</Text>
                  </View>
                  <Text style={styles.popularPrice}>฿{menu.price}</Text>
                </View>
              ))}
            </View>

            <View style={styles.popularCard}>
              <Text style={styles.popularTitle}>งบประหยัด</Text>
              {budgetPicks.map(({ restaurant, menu }) => (
                <View key={`budget-${restaurant.id}-${menu.id}`} style={styles.popularRow}>
                  <Text style={styles.popularEmoji}>{getFoodEmoji(menu.name, restaurant.category)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popularMenu}>{menu.name}</Text>
                    <Text style={styles.popularShop}>{restaurant.name}</Text>
                  </View>
                  <Text style={styles.popularPrice}>฿{menu.price}</Text>
                </View>
              ))}
            </View>

            <View style={styles.popularCard}>
              <Text style={styles.popularTitle}>สุ่มล่าสุด</Text>
              {history.length ? history.map(({ restaurant, menu }) => (
                <View key={`h-${restaurant.id}-${menu.id}`} style={styles.popularRow}>
                  <Text style={styles.popularEmoji}>{getFoodEmoji(menu.name, restaurant.category)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popularMenu}>{menu.name}</Text>
                    <Text style={styles.popularShop}>{restaurant.name}</Text>
                  </View>
                  <Text style={styles.popularPrice}>฿{menu.price}</Text>
                </View>
              )) : <Text style={styles.emptyText}>กดสุ่มเพื่อเริ่มดูประวัติ</Text>}
            </View>
          </View>
        </View>

        <Text style={styles.footer}>App MODHIW · แก้ไขร้านและเมนูได้ที่ src/data/restaurants.json · Random เฉพาะเมนูในร้านนั้น</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: UI.bg },
  container: { width: '100%', maxWidth: 1320, alignSelf: 'center', padding: 24, paddingBottom: 60 },
  bgBlobOne: { position: 'absolute', top: 80, right: 50, width: 220, height: 220, borderRadius: 140, backgroundColor: '#FFE7CC', opacity: 0.55 },
  bgBlobTwo: { position: 'absolute', top: 520, left: -80, width: 260, height: 260, borderRadius: 150, backgroundColor: '#FFD6B0', opacity: 0.25 },
  navbar: { backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: UI.line, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', shadowColor: '#F97316', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  antLogo: { backgroundColor: UI.orangeSoft, borderWidth: 2, borderColor: '#FFD7B8', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: UI.orange, fontSize: 24, fontWeight: '900' },
  brandSub: { color: UI.sub, fontSize: 12, marginTop: 2, fontWeight: '700' },
  navLinks: { flexDirection: 'row', gap: 28, flexWrap: 'wrap' },
  navActive: { color: UI.orange, fontSize: 14, fontWeight: '900' },
  navText: { color: UI.sub, fontSize: 14, fontWeight: '800' },

  heroGrid: { marginTop: 22, gap: 22 },
  heroLeft: { backgroundColor: 'transparent', minHeight: 300, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  heroCopy: { flex: 1, minWidth: 280 },
  heroTitle: { color: UI.text, fontSize: 52, lineHeight: 62, fontWeight: '900', letterSpacing: -1.2 },
  heroSubtitle: { color: UI.text, fontSize: 20, fontWeight: '900', marginTop: 14 },
  heroDesc: { color: UI.sub, fontSize: 16, lineHeight: 26, marginTop: 8, maxWidth: 560 },
  heroButton: { marginTop: 28, backgroundColor: UI.orange, borderRadius: 18, paddingHorizontal: 26, paddingVertical: 18, alignSelf: 'flex-start', shadowColor: UI.orange, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  heroButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  heroMascot: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  heroMascotText: { fontSize: 140 },
  sparkle1: { position: 'absolute', top: 28, right: 24, color: UI.yellow, fontSize: 26 },
  sparkle2: { position: 'absolute', bottom: 42, left: 10, color: UI.yellow, fontSize: 22 },

  featureCard: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 28, padding: 26, minHeight: 300, overflow: 'hidden', shadowColor: '#7C2D12', shadowOpacity: 0.10, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
  featureMenu: { color: UI.text, fontSize: 30, lineHeight: 38, fontWeight: '900', marginTop: 18, maxWidth: 380 },
  featureShop: { color: UI.sub, fontSize: 16, fontWeight: '800', marginTop: 10 },
  featureStats: { flexDirection: 'row', gap: 18, marginTop: 16 },
  featureStat: { color: UI.sub, fontSize: 14, fontWeight: '900' },
  foodPlate: { position: 'absolute', right: 20, bottom: 10, width: 180, height: 180, borderRadius: 100, backgroundColor: '#FFF5EA', alignItems: 'center', justifyContent: 'center' },
  foodPlateEmoji: { fontSize: 96 },

  categoryBar: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 22, padding: 14, marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  pillActive: { backgroundColor: UI.orange, borderColor: UI.orange },
  pillText: { color: UI.sub, fontSize: 14, fontWeight: '900' },
  pillTextActive: { color: '#fff' },

  moodSection: { marginTop: 18, backgroundColor: 'rgba(255,255,255,0.86)', borderWidth: 1, borderColor: UI.line, borderRadius: 22, padding: 16 },
  moodTitle: { color: UI.text, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  moodRow: { flexDirection: 'row', gap: 10 },
  moodCard: { minWidth: 122, backgroundColor: UI.bg2, borderWidth: 1, borderColor: UI.line, borderRadius: 18, padding: 14, alignItems: 'center' },
  moodCardActive: { backgroundColor: UI.orangeSoft, borderColor: '#FDBA74' },
  moodIcon: { fontSize: 28, marginBottom: 8 },
  moodText: { color: UI.sub, fontSize: 13, fontWeight: '900' },
  moodTextActive: { color: UI.orange },

  statsBar: { backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: UI.line, borderRadius: 22, padding: 16, marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexGrow: 1, minWidth: 190, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#F5E7DA' },
  statIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: UI.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 22 },
  statValue: { color: UI.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: UI.sub, fontSize: 12, fontWeight: '900', marginTop: 2 },
  statHelper: { color: UI.muted, fontSize: 11, marginTop: 2 },

  mainGrid: { gap: 22, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  sectionTitle: { color: UI.text, fontSize: 24, fontWeight: '900' },
  sectionSub: { color: UI.sub, fontSize: 13, marginTop: 4, fontWeight: '700' },
  viewAll: { color: UI.orange, fontSize: 13, fontWeight: '900' },
  searchFilterCard: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 22, padding: 16, marginBottom: 14 },
  searchInput: { minHeight: 48, borderWidth: 1, borderColor: UI.line, borderRadius: 16, paddingHorizontal: 16, color: UI.text, backgroundColor: UI.bg2, fontSize: 15, fontWeight: '700', outlineStyle: 'none', marginBottom: 12 },
  sortRow: { flexDirection: 'row', gap: 10 },

  restaurantRow: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 14, shadowColor: '#7C2D12', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  restaurantThumb: { width: 82, height: 82, borderRadius: 18, backgroundColor: UI.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  restaurantThumbText: { fontSize: 38 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  restaurantName: { color: UI.text, fontSize: 18, fontWeight: '900', flexShrink: 1 },
  bookmarkButton: { paddingHorizontal: 6 },
  bookmarkText: { color: UI.muted, fontSize: 20 },
  restaurantSub: { color: UI.sub, fontSize: 13, lineHeight: 19, marginTop: 4 },
  restaurantMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '900' },
  menuPreview: { backgroundColor: UI.bg2, borderWidth: 1, borderColor: '#F7EBDD', borderRadius: 16, padding: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  menuPreviewLabel: { color: UI.orange, fontSize: 12, fontWeight: '900' },
  menuPreviewText: { color: UI.text, fontSize: 14, fontWeight: '900', flex: 1 },
  menuPrice: { color: UI.orange, fontSize: 14, fontWeight: '900' },

  resultCard: { backgroundColor: '#FFF9F2', borderWidth: 2, borderColor: '#FDBA74', borderRadius: 24, padding: 22, shadowColor: UI.orange, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { color: UI.orange, fontSize: 22, fontWeight: '900' },
  diceBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: UI.orange, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '12deg' }] },
  diceText: { fontSize: 28 },
  resultEmpty: { color: UI.sub, marginTop: 14, lineHeight: 22, fontWeight: '700' },
  selectedShop: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 18, padding: 16, marginTop: 16 },
  smallLabel: { color: UI.sub, fontSize: 12, fontWeight: '900', marginBottom: 5 },
  selectedShopName: { color: UI.text, fontSize: 18, fontWeight: '900' },
  selectedShopMeta: { color: UI.sub, fontSize: 13, marginTop: 6, fontWeight: '700' },
  downArrow: { alignItems: 'center', marginVertical: 10 },
  downArrowText: { color: UI.orange, fontSize: 28, fontWeight: '900' },
  selectedMenu: { backgroundColor: UI.card, borderWidth: 1, borderColor: '#F7D7BD', borderRadius: 18, padding: 16, flexDirection: 'row', gap: 14 },
  foodEmojiBox: { width: 78, height: 78, borderRadius: 18, backgroundColor: UI.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  foodEmoji: { fontSize: 42 },
  selectedMenuName: { color: UI.text, fontSize: 18, fontWeight: '900' },
  selectedMenuDesc: { color: UI.sub, fontSize: 13, lineHeight: 20, marginTop: 5, marginBottom: 8 },
  selectedPrice: { color: UI.orange, fontSize: 18, fontWeight: '900' },
  fullOrangeButton: { backgroundColor: UI.orange, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  fullOrangeButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  resultButton: { backgroundColor: UI.orange, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  resultButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },

  popularCard: { backgroundColor: UI.card, borderWidth: 1, borderColor: UI.line, borderRadius: 22, padding: 20, marginTop: 18 },
  popularTitle: { color: UI.text, fontSize: 20, fontWeight: '900', marginBottom: 10 },
  popularRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F4E8DC' },
  popularEmoji: { fontSize: 24, width: 34 },
  popularMenu: { color: UI.text, fontSize: 14, fontWeight: '900' },
  popularShop: { color: UI.sub, fontSize: 12, marginTop: 3, fontWeight: '700' },
  popularPrice: { color: UI.orange, fontSize: 14, fontWeight: '900' },
  emptyText: { color: UI.sub, fontSize: 13, fontWeight: '700' },
  footer: { textAlign: 'center', color: UI.muted, fontSize: 12, marginTop: 26, fontWeight: '700' },
});
