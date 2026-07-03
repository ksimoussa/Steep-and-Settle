import { useState, useMemo, useCallback } from "react";
import {
  ShoppingBag, X, Leaf, Moon, Zap, Check, ArrowRight,
  Minus, Plus, ChevronRight, Star, Clock, SlidersHorizontal,
  CreditCard, User, Package, MessageSquare, Coffee, Search,
  Heart, Instagram, Twitter, Facebook
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type Page = "home" | "shop" | "product" | "checkout" | "survey";

interface Product {
  id: number;
  name: string;
  type: "Coffee" | "Tea" | "Latte Mix" | "Cold Brew";
  caffeineLevel: "Regular" | "Low-Caffeine" | "Caffeine-Free";
  mood: string[];
  temperature: string[];
  dietary: string[];
  price: number;
  caffeineContent: string;
  description: string;
  longDescription: string;
  ingredients: string;
  img: string;
  isLowKey: boolean;
  badge?: string;
}

interface CartItem { product: Product; qty: number; }

interface Filters {
  type: string[];
  caffeine: string[];
  mood: string[];
  temp: string[];
  dietary: string[];
  maxPrice: number;
}

interface OrderInfo {
  name: string; email: string; phone: string;
  address: string; city: string; state: string; zip: string;
}

interface PaymentInfo {
  cardName: string; cardNumber: string; expiry: string; cvv: string;
}

interface CheckoutTotals {
  subtotal: number;
  eligibleSubtotal: number;
  discount: number;
  total: number;
  promoApplied: boolean;
}

export function calculateCheckoutTotals(cart: CartItem[], promoCode: string): CheckoutTotals {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const normalizedCode = promoCode.trim().toUpperCase();
  const promoApplied = normalizedCode === "BREW3PM";
  const eligibleSubtotal = promoApplied
    ? cart.reduce((sum, item) => {
        const eligible = ["Coffee", "Cold Brew"].includes(item.product.type);
        return sum + (eligible ? item.product.price * item.qty : 0);
      }, 0)
    : 0;
  const discount = promoApplied ? eligibleSubtotal * 0.15 : 0;

  return {
    subtotal,
    eligibleSubtotal,
    discount: Number(discount.toFixed(2)),
    total: Number((subtotal - discount).toFixed(2)),
    promoApplied,
  };
}

// ─── Data ──────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  {
    id: 1, name: "Morning Ritual Espresso Blend", type: "Coffee",
    caffeineLevel: "Regular", mood: ["Energize"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 14.99,
    caffeineContent: "~140mg per 12oz brew",
    description: "A bold, bright ground espresso blend with dark chocolate and a whisper of citrus. Makes about 20 double shots per 250g bag.",
    longDescription: "Sourced from a small cooperative in Huila, Colombia, this is the espresso blend we built our whole shop around. Ground for espresso machines and Moka pots, it produces a thick, reddish crema and finishes clean. Dark chocolate up front, bergamot on the way out. We roast it medium-dark so you get the body without the bitterness. Each 250g bag makes roughly 20 double shots.",
    ingredients: "100% Arabica coffee, single-origin Huila, Colombia. Medium-dark roast. Ground for espresso. 250g bag.",
    img: "1690983325192-a4c13c2e331d", isLowKey: false,
  },
  {
    id: 3, name: "Midnight Chamomile", type: "Tea",
    caffeineLevel: "Caffeine-Free", mood: ["Sleep-Friendly", "Relax"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 12.99, caffeineContent: "0mg",
    badge: "Sleep-Friendly", isLowKey: true,
    description: "Egyptian chamomile, lavender buds, and lemon peel. A loose leaf blend that tucks you in. 50g tin, about 25 cups.",
    longDescription: "Egyptian chamomile is the good stuff. Bigger flowers, more essential oil, sweeter flavor. We blend it with a small amount of dried lavender, not so much it tastes like soap, just enough to take the edge off the day. Steep for five minutes and breathe in before you sip. Each 50g tin makes about 25 cups. A perfect last ritual before bed.",
    ingredients: "Egyptian chamomile flowers, dried lavender buds, dried lemon peel. 50g loose leaf tin, approx. 25 cups.",
    img: "1596343621063-c7a7aaf37aa6",
  },
  {
    id: 4, name: "Cold Brew Grounds Kit", type: "Cold Brew",
    caffeineLevel: "Regular", mood: ["Energize"], temperature: ["Iced"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 15.99, caffeineContent: "~200mg per 12oz diluted serving",
    isLowKey: false,
    description: "Everything you need to make cold brew at home. Coarse-ground dark roast plus a reusable brew bag. Steep 18 hours, dilute, enjoy. Makes 8 servings.",
    longDescription: "Each kit includes our coarse-ground dark roast and a reusable mesh filter bag. Steep the grounds in cold, filtered water in your fridge for 18 hours. The result is rich and chocolatey with almost zero bitterness, because cold extraction reduces acidity. Dilute 1:1 with water or milk and pour over ice. One kit makes 8 servings of concentrate.",
    ingredients: "100% Arabica dark roast, coarse ground. Includes reusable mesh filter bag. Makes 8 servings.",
    img: "1548109327-a412a3828374",
  },
  {
    id: 5, name: "Lavender Rest Blend", type: "Tea",
    caffeineLevel: "Low-Caffeine", mood: ["Relax", "Sleep-Friendly"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 13.99, caffeineContent: "~15mg per cup (white tea base)",
    badge: "Caffeine Pick", isLowKey: true,
    description: "Delicate white tea with lavender and passionflower. Low and slow and lovely. 40g loose leaf tin, about 20 cups.",
    longDescription: "White tea has a fraction of the caffeine of black, around 15mg per cup, but it still gives you that gentle lift. We blend it with culinary lavender and dried passionflower, which has been used for centuries as a gentle relaxant. It smells like a garden and tastes like one too. Steep at 80 degrees for 3 minutes. Each 40g tin makes about 20 cups.",
    ingredients: "Silver needle white tea, culinary lavender, dried passionflower, dried rose petals. 40g loose leaf tin, approx. 20 cups.",
    img: "1602603412313-ab713536e288",
  },
  {
    id: 6, name: "Matcha Ceremony Mix", type: "Latte Mix",
    caffeineLevel: "Low-Caffeine", mood: ["Focus", "Relax"], temperature: ["Hot", "Iced"],
    dietary: ["Vegan"], price: 17.99, caffeineContent: "~70mg + L-theanine per serving",
    badge: "Calm Focus", isLowKey: true,
    description: "Ceremonial-grade Uji matcha with oat milk powder. Just add water. Calm focus, no crash. 15 servings per tin.",
    longDescription: "L-theanine, the amino acid in green tea, softens the edge of caffeine. Matcha brings both together, which is why so many people reach for it when they want focus without the crash. We use ceremonial-grade Uji matcha blended with oat milk powder so you only need to add hot water. For an iced version, whisk the powder with a small splash of hot water first, then pour over cold milk and ice. Each 150g tin makes 15 servings.",
    ingredients: "Ceremonial-grade Uji matcha (Uji, Japan), organic oat milk powder. 150g tin, 15 servings.",
    img: "1515823064-d6e0c04616a7",
  },
  {
    id: 7, name: "Ethiopian Sunrise", type: "Coffee",
    caffeineLevel: "Regular", mood: ["Energize"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 15.99, caffeineContent: "~130mg per 12oz brew",
    isLowKey: false,
    description: "Light-roasted Yirgacheffe ground coffee with blueberry and jasmine. Coffee at its most fruit-forward. 250g bag, about 15 cups.",
    longDescription: "This one is for people who say they do not like coffee. Natural-process Yirgacheffe from the Gedeo Zone of Ethiopia. It smells like a fruit bowl and tastes like it too: blueberry jam, dried apricot, jasmine. We roast it light to let the terroir sing. No sugar needed; this one is already sweet. Available ground for drip and pour-over. Each 250g bag makes about 15 cups.",
    ingredients: "100% Arabica, natural-process Yirgacheffe, Ethiopia. Light roast. Ground for drip/pour-over. 250g bag, approx. 15 cups.",
    img: "1447933601403-0c6688de566e",
  },
  {
    id: 8, name: "Peppermint Dream", type: "Tea",
    caffeineLevel: "Caffeine-Free", mood: ["Relax"], temperature: ["Hot", "Iced"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 11.99, caffeineContent: "0mg",
    isLowKey: true,
    description: "Pure organic whole-leaf peppermint. Cool, clean, and completely caffeine-free. 40g pouch, 20 or more cups.",
    longDescription: "Sometimes the classics are classics for a reason. Organic peppermint from the Pacific Northwest, dried in small batches and kept whole-leaf for maximum freshness. Steep 2 teaspoons in boiling water for 5 minutes for a strong brew, 2 to 3 minutes for something gentler. Also great iced: brew double-strength and pour over a full glass of ice. Each 40g pouch makes 20 or more cups.",
    ingredients: "Organic whole-leaf peppermint (Pacific Northwest). 40g pouch, approx. 20 cups.",
    img: "1563822249366-3efb23b8e0c9",
  },
  {
    id: 10, name: "Hibiscus Sunset", type: "Tea",
    caffeineLevel: "Caffeine-Free", mood: ["Relax"], temperature: ["Iced"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 12.99, caffeineContent: "0mg",
    badge: "Caffeine Pick", isLowKey: true,
    description: "Tart hibiscus, rosehip, and ginger loose leaf blend. Best brewed iced. Turns deep magenta. 50g tin.",
    longDescription: "It turns that deep magenta color the moment it hits the ice and it never gets old. Brew a strong batch by steeping 3 tablespoons in 500ml of boiling water for 10 minutes, then pour over a full pitcher of ice. Dried hibiscus and rosehips give it a tart, cranberry-like flavor. The pinch of dried ginger rounds out the edge. Completely caffeine-free. Each 50g tin makes about 10 large iced pitchers.",
    ingredients: "Dried hibiscus flowers, rosehips, dried ginger, dried orange peel. 50g loose leaf tin.",
    img: "1728320807529-ec4a80b5f33f",
  },
  {
    id: 11, name: "Nitro Cold Brew Kit", type: "Cold Brew",
    caffeineLevel: "Regular", mood: ["Energize"], temperature: ["Iced"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 16.99, caffeineContent: "~220mg per 12oz serving",
    isLowKey: false,
    description: "Make silky nitro cold brew at home. Dark roast grounds, a reusable brew bag, and two nitrogen cartridges. Makes 4 servings.",
    longDescription: "Nitrogen infusion creates a micro-bubble texture that is genuinely unlike anything else: smooth, creamy, and naturally sweet from cold extraction with no bitterness. This kit includes our coarse-ground dark roast, a reusable brew bag, and two nitrogen cartridges compatible with any standard cream whipper. Brew the concentrate overnight, charge it with nitrogen, and serve chilled. Makes 4 large servings.",
    ingredients: "100% Arabica dark roast (coarse ground), reusable brew bag, 2 N2 cartridges. Makes 4 servings.",
    img: "1582572430474-3acf30221916",
  },
  {
    id: 12, name: "Tulsi Rose", type: "Tea",
    caffeineLevel: "Caffeine-Free", mood: ["Relax", "Sleep-Friendly"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 13.49, caffeineContent: "0mg",
    badge: "Adaptogen Blend", isLowKey: true,
    description: "Holy basil and rose petal loose leaf blend. An Ayurvedic adaptogen that genuinely calms the nervous system. 40g tin.",
    longDescription: "Tulsi (holy basil) is one of Ayurveda's most respected adaptogens, shown to help the body regulate stress hormones. We blend it with dried rose petals and a small amount of dried hibiscus for color. It smells floral and spicy at the same time. Steep 1.5 teaspoons in 200ml of water at 90 degrees for 4 minutes. Each 40g tin makes about 20 cups.",
    ingredients: "Dried tulsi (holy basil), dried rose petals, dried hibiscus. 40g loose leaf tin, approx. 20 cups.",
    img: "1467164616789-ce7ae65ab4c9",
  },
  {
    id: 13, name: "Chai Masala Mix", type: "Latte Mix",
    caffeineLevel: "Low-Caffeine", mood: ["Focus", "Energize"], temperature: ["Hot"],
    dietary: ["Vegan"], price: 14.99, caffeineContent: "~45mg per serving",
    badge: "Caffeine Pick", isLowKey: true,
    description: "Spiced Assam black tea and oat milk powder latte mix. Warming, complex, just caffeinated enough. 12 servings per tin.",
    longDescription: "We blend concentrated Assam black tea powder with freshly ground whole spices, cardamom, cinnamon, clove, black pepper, and star anise, plus oat milk powder, so you only need to add hot water. The ratio of tea to milk keeps the caffeine lower than a full-strength latte, but the warmth and spice are fully, completely there. Stir into 200ml of hot water or froth with a handheld frother for extra creaminess. Each tin holds 12 servings.",
    ingredients: "Assam black tea powder, cardamom, cinnamon, clove, black pepper, star anise, oat milk powder. 12 servings per tin.",
    img: "1563822249548-9a72b6353cd1",
  },
  {
    id: 15, name: "Brazil Nut Cold Brew Kit", type: "Cold Brew",
    caffeineLevel: "Regular", mood: ["Energize"], temperature: ["Iced"],
    dietary: ["Vegan"], price: 17.99, caffeineContent: "~180mg per 12oz diluted serving",
    badge: "Seasonal", isLowKey: false,
    description: "Seasonal single-origin Brazilian cold brew kit with brazil nut milk powder. Nutty, rich, unexpected. Makes 6 servings.",
    longDescription: "Brazilian beans are naturally low-acid and chocolatey, which makes them ideal for cold brew. This seasonal kit includes our coarse-ground Brazil Cerrado, a brew bag, and our house-blended brazil nut milk powder. Steep the grounds in cold water overnight, dilute the concentrate, and stir in the nut milk powder for a nutty, rich finish that is not heavy. A rotating seasonal offering, available while supplies last.",
    ingredients: "Single-origin Brazil Cerrado (coarse ground), reusable brew bag, brazil nut milk powder. 6 servings per kit.",
    img: "1591933940638-d253adcdcb98",
  },
  {
    id: 16, name: "Valerian Night Cap", type: "Tea",
    caffeineLevel: "Caffeine-Free", mood: ["Sleep-Friendly"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 12.49, caffeineContent: "0mg",
    badge: "Sleep Support", isLowKey: true,
    description: "Valerian root, hops, and lemon balm loose leaf blend. The most sleep-supporting blend we make. 40g tin.",
    longDescription: "Valerian root has been shown in multiple studies to improve sleep quality and reduce the time it takes to fall asleep. We combine it with hops (yes, the same plant as beer, also a natural sedative) and lemon balm, which helps calm anxiety. It tastes earthy and herbal. The people who love it, really love it. Steep 1 teaspoon in boiling water for 7 minutes. Best enjoyed 30 minutes before bed. Each 40g tin makes about 20 cups.",
    ingredients: "Valerian root, dried hops flowers, lemon balm, dried chamomile. 40g loose leaf tin, approx. 20 cups.",
    img: "1563911892437-1feda0179e1b",
  },
  {
    id: 17, name: "Kyoto Hojicha Latte Mix", type: "Latte Mix",
    caffeineLevel: "Low-Caffeine", mood: ["Focus", "Relax"], temperature: ["Iced"],
    dietary: ["Vegan"], price: 16.49, caffeineContent: "~50mg per serving",
    badge: "Caffeine Pick", isLowKey: true,
    description: "Roasted hojicha and oat milk powder latte mix. Best enjoyed iced. Roasted, nutty, effortlessly cool. 14 servings per tin.",
    longDescription: "Hojicha is made from roasted green tea leaves. The roasting removes most of the caffeine and adds a rich, toasty caramel note. This mix combines hojicha powder with oat milk powder. For the best layered result, whisk the powder with a small splash of hot water first, then pour over a glass of cold milk and ice so the hojicha layers on top. Each tin holds 14 servings.",
    ingredients: "Hojicha powder (roasted green tea, Kyoto), oat milk powder. 14 servings per tin.",
    img: "1566657040726-62fd1e379726",
  },
  {
    id: 19, name: "Neroli Blossom", type: "Tea",
    caffeineLevel: "Caffeine-Free", mood: ["Relax"], temperature: ["Hot"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 13.99, caffeineContent: "0mg",
    isLowKey: true,
    description: "Orange blossom, neroli, and rooibos loose leaf blend. A perfumed, caffeine-free tea that smells like spring. 50g tin.",
    longDescription: "Rooibos is a South African herbal that is naturally sweet and caffeine-free: no bitterness, no astringency, just a clean red cup. We blend it with dried orange blossom and neroli extract for a floral, citrusy cup that is almost dessert-like without any added sugar. Steep 1 heaped teaspoon in boiling water for 5 minutes. Serve it plain. It needs nothing. Each 50g tin makes about 25 cups.",
    ingredients: "Rooibos, dried orange blossom, neroli extract. 50g loose leaf tin, approx. 25 cups.",
    img: "1593487806527-40dcc19864bd",
  },
  {
    id: 20, name: "Espresso Tonic Bundle", type: "Coffee",
    caffeineLevel: "Regular", mood: ["Energize", "Focus"], temperature: ["Iced"],
    dietary: ["Vegan", "Dairy-Free", "Sugar-Free"], price: 13.49, caffeineContent: "~140mg per serving",
    isLowKey: false,
    description: "Our Morning Ritual espresso ground bundled with Fever-Tree Indian Tonic miniatures. Pull a shot, pour over tonic and ice. Fizzy, bright, strangely wonderful.",
    longDescription: "Espresso over sparkling tonic. But the carbonation lifts the flavor of the espresso in a way nothing else does. It becomes lighter, more citrusy, more refreshing. This bundle includes a 100g bag of our Morning Ritual espresso and four Fever-Tree Indian Tonic miniatures. Pull your shot, pour over ice, add the tonic slowly. Add a curl of lemon zest if you have one. Drink it quickly while the bubbles last.",
    ingredients: "Morning Ritual espresso (100g, ground for espresso), 4x Fever-Tree Indian Tonic miniatures (150ml each). Makes 4 drinks.",
    img: "1570470752239-78e3fe00c416",
  },
];

const CAFFEINE_PICKS = PRODUCTS.filter(p => p.isLowKey);
const HOME_FEATURED = [2, 6, 3, 10, 1, 4];

// ─── Helpers ───────────────────────────────────────────────────────────────

function imgUrl(id: string, w = 600, h = 400) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

// ─── Small Atoms ───────────────────────────────────────────────────────────

function CaffeinePill({ level }: { level: string }) {
  const styles: Record<string, string> = {
    "Regular": "bg-[#C4622D]/10 text-[#C4622D] border border-[#C4622D]/20",
    "Low-Caffeine": "bg-[#728F6E]/12 text-[#4a6e46] border border-[#728F6E]/25",
    "Caffeine-Free": "bg-muted text-muted-foreground border border-border",
  };
  const icons: Record<string, React.ReactNode> = {
    "Regular": <Zap className="w-3 h-3" />,
    "Low-Caffeine": <Leaf className="w-3 h-3" />,
    "Caffeine-Free": <Moon className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] || ""}`}>
      {icons[level]}
      {level}
    </span>
  );
}

function CaffeinePickBadge({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#728F6E] text-white">
      <Leaf className="w-3 h-3" />
      {label || "Caffeine Pick"}
    </span>
  );
}

function MoodTag({ mood }: { mood: string }) {
  const map: Record<string, string> = {
    Energize: "⚡", Focus: "🧠", Relax: "🌿", "Sleep-Friendly": "🌙"
  };
  return (
    <span className="text-xs text-muted-foreground">
      {map[mood] || ""} {mood}
    </span>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────

function Header({ cartCount, nav }: { cartCount: number; nav: (p: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => nav("home")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Coffee className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Steep <span className="text-primary">&amp;</span> Settle
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => nav("home")} className="text-sm text-foreground/70 hover:text-foreground transition-colors">
            Home
          </button>
          <button onClick={() => nav("shop")} className="text-sm text-foreground/70 hover:text-foreground transition-colors">
            Shop
          </button>
          <button
            onClick={() => nav("shop")}
            className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1"
          >
            <Leaf className="w-3.5 h-3.5" />
            Caffeine Picks
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => nav("checkout")}
            className="relative p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                {cartCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          <button onClick={() => { nav("home"); setMenuOpen(false); }} className="text-left py-2 text-foreground/80">Home</button>
          <button onClick={() => { nav("shop"); setMenuOpen(false); }} className="text-left py-2 text-foreground/80">Shop All</button>
          <button onClick={() => { nav("shop"); setMenuOpen(false); }} className="text-left py-2 text-secondary font-medium flex items-center gap-1.5">
            <Leaf className="w-4 h-4" /> Caffeine Picks
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer({ nav }: { nav: (p: Page) => void }) {
  return (
    <footer className="bg-foreground text-primary-foreground mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
              <Coffee className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Steep &amp; Settle
            </span>
          </div>
          <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-xs">
            We ship ground coffee, at-home latte mixes, and loose leaf tea blends to people who want a calmer, better morning ritual at home.
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Shop</h4>
          <ul className="space-y-2">
            {[
              { label: "All Products", page: "shop" as Page },
              { label: "Caffeine Picks", page: "shop" as Page },
              { label: "Coffee", page: "shop" as Page },
              { label: "Tea", page: "shop" as Page },
            ].map(item => (
              <li key={item.label}>
                <button onClick={() => nav(item.page)} className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Choose your level</h4>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <Leaf className="w-5 h-5 text-[#90b88b] mt-0.5 shrink-0" />
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Choose full-caffeine coffee, half-caf latte mixes, or caffeine-free tea blends. Every product is labeled with milligrams, ingredients, and brewing instructions.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 sm:px-6 py-5 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-primary-foreground/40">
        <span>© 2025 Steep &amp; Settle. Made with care.</span>
        <span>Privacy · Terms · Accessibility</span>
      </div>
    </footer>
  );
}

// ─── ProductCard ───────────────────────────────────────────────────────────

function ProductCard({
  product, nav, onAdd,
}: {
  product: Product;
  nav: (p: Page, pr?: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  const serveLabel = product.temperature.includes("Hot") && product.temperature.includes("Iced")
    ? "Hot or iced"
    : product.temperature[0] === "Hot" ? "Best hot" : "Best iced";

  return (
    <article
      onClick={() => nav("product", product)}
      className={`group bg-card rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        product.isLowKey ? "border-[#728F6E]/30" : "border-border"
      }`}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={imgUrl(product.img)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.isLowKey && <CaffeinePickBadge label={product.badge || "Caffeine Pick"} />}
          {product.badge && !product.isLowKey && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
              {product.badge}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-base font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
            {product.name}
          </h3>
          <span className="text-base font-semibold text-primary whitespace-nowrap shrink-0">
            {fmt(product.price)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {product.type}
          </span>
          <CaffeinePill level={product.caffeineLevel} />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="text-xs text-muted-foreground mb-3">
          ☕ {product.caffeineContent}
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground">
            {serveLabel === "Hot or iced" ? "🔥🧊" : serveLabel === "Best hot" ? "🔥" : "🧊"} {serveLabel}
          </span>
          <button
            onClick={handleAdd}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              added
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {added ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── FilterSidebar ─────────────────────────────────────────────────────────

function FilterSidebar({
  filters, setFilters, totalCount,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  totalCount: number;
}) {
  function toggle(key: keyof Omit<Filters, "maxPrice">, val: string) {
    const cur = filters[key] as string[];
    setFilters({
      ...filters,
      [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val],
    });
  }

  function clearAll() {
    setFilters({ type: [], caffeine: [], mood: [], temp: [], dietary: [], maxPrice: 25 });
  }

  const activeCount =
    filters.type.length + filters.caffeine.length + filters.mood.length +
    filters.temp.length + filters.dietary.length + (filters.maxPrice < 25 ? 1 : 0);

  const Section = ({ label, items, filterKey }: {
    label: string;
    items: string[];
    filterKey: keyof Omit<Filters, "maxPrice">;
  }) => (
    <div className="mb-6">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{label}</h4>
      <div className="space-y-2">
        {items.map(item => {
          const active = (filters[filterKey] as string[]).includes(item);
          return (
            <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggle(filterKey, item)}
                className={`w-4 h-4 rounded border transition-colors flex items-center justify-center shrink-0 ${
                  active ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                }`}
              >
                {active && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span
                onClick={() => toggle(filterKey, item)}
                className={`text-sm transition-colors ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {item}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>Filters</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{totalCount} product{totalCount !== 1 ? "s" : ""}</p>
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-primary hover:underline font-medium">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <Section label="Product Type" items={["Coffee", "Tea", "Latte Mix", "Cold Brew"]} filterKey="type" />
      <Section label="Caffeine Level" items={["Regular", "Low-Caffeine", "Caffeine-Free"]} filterKey="caffeine" />
      <Section label="Mood / Purpose" items={["Energize", "Focus", "Relax", "Sleep-Friendly"]} filterKey="mood" />
      <Section label="Best Enjoyed" items={["Hot", "Iced"]} filterKey="temp" />
      <Section label="Dietary" items={["Dairy-Free", "Vegan", "Sugar-Free"]} filterKey="dietary" />

      <div className="mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Max Price: {fmt(filters.maxPrice)}
        </h4>
        <input
          type="range" min={8} max={25} step={0.5}
          value={filters.maxPrice}
          onChange={e => setFilters({ ...filters, maxPrice: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>$8</span><span>$25</span>
        </div>
      </div>

      <div
        onClick={() => setFilters({ ...filters, caffeine: filters.caffeine.includes("Low-Caffeine") ? filters.caffeine.filter(c => c !== "Low-Caffeine") : [...filters.caffeine, "Low-Caffeine", "Caffeine-Free"] })}
        className="p-3 rounded-xl bg-[#728F6E]/10 border border-[#728F6E]/20 cursor-pointer hover:bg-[#728F6E]/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-secondary">Find your level</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Full strength, half caf, decaf</p>
      </div>
    </aside>
  );
}

// ─── HomePage ──────────────────────────────────────────────────────────────

function HomePage({
  nav, onAdd,
}: {
  nav: (p: Page, pr?: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const featured = HOME_FEATURED
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter((product): product is Product => Boolean(product));

  return (
    <main>
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1a0e07]">
          <img
            src={imgUrl("1495474472359-6f7f4e1fc26d", 1400, 900)}
            alt="Bags of ground coffee and tea tins arranged on a wooden surface"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0e07]/90 via-[#1a0e07]/50 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium mb-6">
              <Coffee className="w-3.5 h-3.5" />
              Freshly roasted and shipped to your door
            </div>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ground coffee.<br />
              <em className="text-accent">Latte mixes.</em><br />
              Tea blends.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-md">
              Shop ground coffee, easy latte mixes, and tea blends for your home routine. Full-caffeine favorites alongside half-caf and decaf options, all clearly labeled.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => nav("shop")}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Shop coffee and mixes <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => nav("shop")}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-colors"
              >
                <Leaf className="w-4 h-4 text-[#90b88b]" />
                Browse caffeine picks
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0 opacity-80" />
            <div>
              <span className="font-semibold">15% off select coffee and tea blends after 3pm.</span>
              <span className="hidden sm:inline text-primary-foreground/80 ml-2">
                Use code <span className="font-mono font-semibold bg-white/10 px-1.5 py-0.5 rounded">BREW3PM</span> at checkout.
              </span>
            </div>
          </div>
          <button
            onClick={() => nav("shop")}
            className="shrink-0 text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Shop caffeine picks →
          </button>
        </div>
      </div>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#728F6E]/10 border border-[#728F6E]/20">
            <div className="p-10 lg:p-14 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 mb-5">
                <Leaf className="w-5 h-5 text-secondary" />
                <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Caffeine Picks</span>
              </div>
              <h2
                className="text-4xl lg:text-5xl font-semibold mb-5 leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Coffee and latte mixes<br />
                <em>for your kitchen counter.</em>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4 max-w-md">
                We designed our collection for every kind of routine, from full-caffeine mornings to half-caf afternoons and decaf evenings. Every blend is clearly labeled with milligrams, ingredients, and what you can expect from each cup you make at home.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
                Choose a bold brew, a mellow latte mix, or a cozy tea blend and have it shipped straight to your door.
              </p>
              <button
                onClick={() => nav("shop")}
                className="self-start flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors"
              >
                Explore caffeine picks <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative min-h-64 lg:min-h-auto bg-[#728F6E]/10">
              <img
                src={imgUrl("1541167760496-1628856ab772", 700, 500)}
                alt="A tin of latte mix alongside a ceramic mug and greenery"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#728F6E]/10" />
              <div className="absolute bottom-6 left-6 space-y-2">
                {[
                  { level: "Caffeine-Free", label: "0mg, Chamomile, Tulsi Rose, Ashwagandha" },
                  { level: "Low-Caffeine", label: "15-70mg, Golden Hour, Matcha, Chai" },
                ].map(b => (
                  <div key={b.level} className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
                    <CaffeinePill level={b.level} />
                    <p className="text-xs text-muted-foreground mt-1">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Our customers&apos; favourites
              </h2>
              <p className="text-muted-foreground mt-2">The ones people reorder, week after week.</p>
            </div>
            <button
              onClick={() => nav("shop")}
              className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.slice(0, 6).map(p => (
              <ProductCard key={p.id} product={p} nav={nav} onAdd={onAdd} />
            ))}
          </div>

          <div className="text-center mt-10 sm:hidden">
            <button
              onClick={() => nav("shop")}
              className="px-6 py-3 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              View all products →
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-6 overflow-hidden">
            <img
              src={imgUrl("1544005313-ef763394fad4", 128, 128)}
              alt="Maya, founder of Steep and Settle"
              className="w-full h-full object-cover"
            />
          </div>
          <blockquote
            className="text-2xl sm:text-3xl italic leading-relaxed mb-6 text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            "I built Steep &amp; Settle for people who want great coffee at home, whether that means fresh grounds, a simple latte mix, or a quiet evening tea."
          </blockquote>
          <p className="text-muted-foreground text-sm">- Maya Reyes, founder &amp; head roaster</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <MessageSquare className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            How did today&apos;s cup treat you?
          </h3>
          <p className="text-muted-foreground mb-5 text-sm">
            Tell us. It only takes a minute. Your feedback shapes what we stock next.
          </p>
          <button
            onClick={() => nav("survey")}
            className="px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/80 transition-colors"
          >
            Share your thoughts →
          </button>
        </div>
      </section>
    </main>
  );
}

// ─── ShopPage ──────────────────────────────────────────────────────────────

function ShopPage({
  nav, onAdd, filters, setFilters,
}: {
  nav: (p: Page, pr?: Product) => void;
  onAdd: (p: Product) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (filters.type.length && !filters.type.includes(p.type)) return false;
      if (filters.caffeine.length && !filters.caffeine.includes(p.caffeineLevel)) return false;
      if (filters.mood.length && !filters.mood.some(m => p.mood.includes(m))) return false;
      if (filters.temp.length && !filters.temp.some(t => p.temperature.includes(t))) return false;
      if (filters.dietary.length && !filters.dietary.every(d => p.dietary.includes(d))) return false;
      if (p.price > filters.maxPrice) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filters, search]);

  const chips: { label: string; remove: () => void }[] = [];
  filters.type.forEach(v => chips.push({ label: `Type: ${v}`, remove: () => setFilters({ ...filters, type: filters.type.filter(x => x !== v) }) }));
  filters.caffeine.forEach(v => chips.push({ label: v, remove: () => setFilters({ ...filters, caffeine: filters.caffeine.filter(x => x !== v) }) }));
  filters.mood.forEach(v => chips.push({ label: v, remove: () => setFilters({ ...filters, mood: filters.mood.filter(x => x !== v) }) }));
  filters.temp.forEach(v => chips.push({ label: v, remove: () => setFilters({ ...filters, temp: filters.temp.filter(x => x !== v) }) }));
  filters.dietary.forEach(v => chips.push({ label: v, remove: () => setFilters({ ...filters, dietary: filters.dietary.filter(x => x !== v) }) }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Shop Everything
        </h1>
        <p className="text-muted-foreground">
          Browse ground coffee, at-home latte mixes, and loose leaf tea blends shipped straight to your door. Filter to find your next favourite.
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-accent/20 border border-accent/30 flex items-center gap-3">
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm">
          <span className="font-semibold">After 3pm?</span>{" "}
          Grab 15% off select blends with code{" "}
          <span className="font-mono font-semibold bg-white/60 px-1.5 py-0.5 rounded">BREW3PM</span>.{" "}
          Limited time. Our way of saying wind down well.
        </p>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {chips.length > 0 && `(${chips.length})`}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {chips.map(chip => (
            <button
              key={chip.label}
              onClick={chip.remove}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/15 transition-colors"
            >
              {chip.label}
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={() => setFilters({ type: [], caffeine: [], mood: [], temp: [], dietary: [], maxPrice: 25 })}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        <div className="hidden lg:block w-56 shrink-0 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          <FilterSidebar filters={filters} setFilters={setFilters} totalCount={filtered.length} />
        </div>

        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setShowFilters(false)} />
            <div className="relative ml-auto w-72 h-full bg-background overflow-y-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterSidebar filters={filters} setFilters={setFilters} totalCount={filtered.length} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">☕</div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                No products match these filters
              </h3>
              <p className="text-muted-foreground mb-5">Try removing a filter or two. We promise something good is in here.</p>
              <button
                onClick={() => setFilters({ type: [], caffeine: [], mood: [], temp: [], dietary: [], maxPrice: 25 })}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} nav={nav} onAdd={onAdd} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── ProductDetailPage ─────────────────────────────────────────────────────

function ProductDetailPage({
  product, nav, onAdd,
}: {
  product: Product;
  nav: (p: Page, pr?: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const related = PRODUCTS.filter(p => p.id !== product.id && (p.type === product.type || p.isLowKey === product.isLowKey)).slice(0, 3);

  function handleAdd() {
    for (let i = 0; i < qty; i++) onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const serveLabel = product.temperature.includes("Hot") && product.temperature.includes("Iced")
    ? "Hot or iced (instructions included)"
    : product.temperature[0] === "Hot" ? "Best enjoyed hot (brewing guide included)" : "Best enjoyed iced (recipe card included)";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <button onClick={() => nav("home")} className="hover:text-foreground transition-colors">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => nav("shop")} className="hover:text-foreground transition-colors">Shop</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="relative rounded-3xl overflow-hidden bg-muted aspect-[4/3]">
          <img
            src={imgUrl(product.img, 800, 600)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.isLowKey && (
            <div className="absolute top-5 left-5">
              <CaffeinePickBadge label={product.badge || "Caffeine Pick"} />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2 mb-4">
            <CaffeinePill level={product.caffeineLevel} />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
              {product.type}
            </span>
            {product.mood.map(m => (
              <span key={m} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border">
                <MoodTag mood={m} />
              </span>
            ))}
          </div>

          <h1
            className="text-4xl sm:text-5xl font-semibold leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product.name}
          </h1>

          <p className="text-3xl font-semibold text-primary mb-6">{fmt(product.price)}</p>

          <div className={`p-4 rounded-xl mb-6 border ${product.isLowKey ? "bg-[#728F6E]/08 border-[#728F6E]/20" : "bg-muted border-border"}`}>
            <div className="flex items-center gap-2 mb-1">
              {product.caffeineLevel === "Caffeine-Free"
                ? <Moon className="w-4 h-4 text-secondary" />
                : product.caffeineLevel === "Low-Caffeine"
                ? <Leaf className="w-4 h-4 text-secondary" />
                : <Zap className="w-4 h-4 text-primary" />
              }
              <span className="text-sm font-semibold">Caffeine content</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {product.caffeineContent}{" "}
              {product.isLowKey && "Part of our caffeine picks, designed for different routines and sensitivity levels."}
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">{product.longDescription}</p>

          <div className="p-4 rounded-xl bg-muted border border-border mb-4">
            <h4 className="text-sm font-semibold mb-1">Ingredients &amp; contents</h4>
            <p className="text-sm text-muted-foreground">{product.ingredients}</p>
          </div>

          <div className="p-3 rounded-xl bg-muted border border-border mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Best enjoyed: </span>
              {serveLabel}
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1 border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2.5 text-sm font-medium min-w-[3rem] text-center">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                added
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {added
                ? <><Check className="w-4 h-4" /> Added to cart!</>
                : <><ShoppingBag className="w-4 h-4" /> Add to cart ({fmt(product.price * qty)})</>
              }
            </button>
          </div>

          <button
            onClick={() => nav("checkout")}
            className="mt-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View cart <ChevronRight className="w-3.5 h-3.5 inline" />
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
            You might also like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map(p => (
              <ProductCard key={p.id} product={p} nav={nav} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// ─── CheckoutPage ──────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Cart", icon: ShoppingBag },
  { n: 2, label: "Info", icon: User },
  { n: 3, label: "Payment", icon: CreditCard },
  { n: 4, label: "Confirmation", icon: Package },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex flex-col items-center gap-1 ${step >= s.n ? "opacity-100" : "opacity-40"}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              step > s.n ? "bg-secondary text-secondary-foreground"
              : step === s.n ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
            }`}>
              {step > s.n ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            <span className="text-xs font-medium hidden sm:block">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 sm:w-20 h-px mx-1 sm:mx-2 mb-4 sm:mb-0 transition-colors ${step > s.n ? "bg-secondary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function CheckoutPage({
  step, setStep, cart, setCart, nav,
}: {
  step: number;
  setStep: (n: number) => void;
  cart: CartItem[];
  setCart: (c: CartItem[]) => void;
  nav: (p: Page) => void;
}) {
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    name: "", email: "", phone: "", address: "", city: "", state: "", zip: ""
  });
  const [payment, setPayment] = useState<PaymentInfo>({
    cardName: "", cardNumber: "", expiry: "", cvv: ""
  });
  const [promoCode, setPromoCode] = useState("");
  const [orderNum] = useState(() => `SS-${Math.floor(Math.random() * 90000) + 10000}`);

  const totals = calculateCheckoutTotals(cart, promoCode);
  const total = totals.total;
  const discount = totals.discount;
  const promoApplied = totals.promoApplied;

  function updateQty(productId: number, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else {
      setCart(cart.map(i => i.product.id === productId ? { ...i, qty } : i));
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm transition-colors";
  const labelCls = "block text-sm font-medium mb-1.5";

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold mb-2 text-center" style={{ fontFamily: "var(--font-display)" }}>
        {step < 4 ? "Checkout" : "Order Confirmed!"}
      </h1>
      <p className="text-center text-muted-foreground mb-8 text-sm">
        {step < 4 ? "You are almost there. Your order is nearly ready." : "Your order has been placed and is on its way to you."}
      </p>

      <StepIndicator step={step} />

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>Your cart is empty</h3>
                <p className="text-muted-foreground mb-5">Go find something good. We promise there is something for you.</p>
                <button onClick={() => nav("shop")} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                  Browse all products →
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex gap-4 p-4 bg-card rounded-2xl border border-border">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img src={imgUrl(item.product.img, 160, 160)} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-sm leading-snug">{item.product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.product.type} · {item.product.caffeineContent}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-primary shrink-0">
                        {fmt(item.product.price * item.qty)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden text-sm">
                        <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="px-2.5 py-1.5 hover:bg-muted transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 min-w-[2.5rem] text-center text-sm">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="px-2.5 py-1.5 hover:bg-muted transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => updateQty(item.product.id, 0)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Order summary</h3>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.product.name} x{item.qty}</span>
                      <span className="shrink-0">{fmt(item.product.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 mb-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm text-secondary mt-1">
                      <span>Promo discount</span><span>-{fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Shipping</span><span className="text-secondary font-medium">Free</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 mb-5">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span><span className="text-primary">{fmt(total)}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-accent/15 border border-accent/25 mb-4 text-xs text-muted-foreground">
                  <strong className="text-foreground">After 3pm?</strong> Use <span className="font-mono font-semibold">BREW3PM</span> for 15% off select coffee and cold brew blends.
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-medium mb-1.5 text-foreground">Promo code</label>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="BREW3PM"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
                  />
                  {promoCode.trim() && !promoApplied && (
                    <p className="mt-2 text-xs text-muted-foreground">That code isn’t active for this order.</p>
                  )}
                  {promoApplied && (
                    <p className="mt-2 text-xs text-secondary">15% off selected coffee and cold brew blends applied.</p>
                  )}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Info <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
              <h3 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>Shipping information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full name</label>
                  <input className={inputCls} placeholder="Maya Reyes" value={orderInfo.name} onChange={e => setOrderInfo({ ...orderInfo, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Email address</label>
                  <input className={inputCls} type="email" placeholder="maya@example.com" value={orderInfo.email} onChange={e => setOrderInfo({ ...orderInfo, email: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Phone (optional)</label>
                  <input className={inputCls} placeholder="+1 555 000 0000" value={orderInfo.phone} onChange={e => setOrderInfo({ ...orderInfo, phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Street address</label>
                  <input className={inputCls} placeholder="123 Quiet Lane" value={orderInfo.address} onChange={e => setOrderInfo({ ...orderInfo, address: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} placeholder="Portland" value={orderInfo.city} onChange={e => setOrderInfo({ ...orderInfo, city: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>State</label>
                    <input className={inputCls} placeholder="OR" value={orderInfo.state} onChange={e => setOrderInfo({ ...orderInfo, state: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>ZIP</label>
                    <input className={inputCls} placeholder="97201" value={orderInfo.zip} onChange={e => setOrderInfo({ ...orderInfo, zip: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Continue to payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h4 className="font-semibold mb-3 text-sm">Your order</h4>
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground truncate mr-2">{item.product.name} x{item.qty}</span>
                  <span className="shrink-0">{fmt(item.product.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-sm mt-3 pt-3 border-t border-border">
                <span>Total</span><span className="text-primary">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>Payment details</h3>
              <p className="text-sm text-muted-foreground mb-6">Your information is encrypted and secure. We do not store card details.</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Name on card</label>
                  <input className={inputCls} placeholder="Maya Reyes" value={payment.cardName} onChange={e => setPayment({ ...payment, cardName: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Card number</label>
                  <div className="relative">
                    <input
                      className={`${inputCls} pr-12`}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={payment.cardNumber}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setPayment({ ...payment, cardNumber: raw.replace(/(.{4})/g, "$1 ").trim() });
                      }}
                    />
                    <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Expiry date</label>
                    <input
                      className={inputCls}
                      placeholder="MM / YY"
                      maxLength={7}
                      value={payment.expiry}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPayment({ ...payment, expiry: raw.length > 2 ? `${raw.slice(0, 2)} / ${raw.slice(2)}` : raw });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>CVV</label>
                    <input
                      className={inputCls}
                      placeholder="123"
                      maxLength={4}
                      value={payment.cvv}
                      onChange={e => setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Place order ({fmt(total)}) <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h4 className="font-semibold mb-3 text-sm">Order summary</h4>
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground truncate mr-2">{item.product.name} x{item.qty}</span>
                  <span className="shrink-0">{fmt(item.product.price * item.qty)}</span>
                </div>
              ))}
              <div className="space-y-1.5 mt-3 pt-3 border-t border-border text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
                {promoApplied && (
                  <div className="flex justify-between text-secondary"><span>Promo discount</span><span>-{fmt(discount)}</span></div>
                )}
                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span className="text-secondary font-medium">Free</span></div>
                <div className="flex justify-between font-semibold pt-1"><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Your order is confirmed!
            </h2>
            <p className="text-muted-foreground">
              Order <span className="font-mono font-semibold text-foreground">{orderNum}</span> is packed and on its way.
              We will send a confirmation to{" "}
              <span className="font-medium text-foreground">{orderInfo.email || "your email"}</span>.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h4 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>What you ordered</h4>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img src={imgUrl(item.product.img, 96, 96)} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product.type} · x{item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold">{fmt(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between font-semibold">
              <span>Total paid</span>
              <span className="text-primary">{fmt(total)}</span>
            </div>
            {promoApplied && (
              <p className="mt-2 text-xs text-secondary">BREW3PM discount applied to your eligible coffee and cold brew items.</p>
            )}
          </div>

          <div className="bg-[#728F6E]/10 border border-[#728F6E]/25 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  How did today&apos;s cup treat you?
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Tell us. It only takes a minute. Your feedback shapes what we stock next, and we genuinely read every single one.
                </p>
                <button
                  onClick={() => nav("survey")}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
                >
                  Share your thoughts <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => nav("home")}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Back to home
            </button>
            <button
              onClick={() => nav("shop")}
              className="flex-1 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/80 transition-colors"
            >
              Shop again →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── SurveyPage ────────────────────────────────────────────────────────────

function SurveyPage({ nav }: { nav: (p: Page) => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Thanks for visiting. Come back soon. ☕</p>
        <button onClick={() => nav("home")} className="mt-4 text-primary text-sm hover:underline">Back to home →</button>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-5">🫶</div>
        <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Thank you, really.
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
          We read every response ourselves. Your feedback helps us source better, roast better, and take better care of everyone who shops with us.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => nav("home")} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            Back to home
          </button>
          <button onClick={() => nav("shop")} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Shop again →
          </button>
        </div>
      </main>
    );
  }

  const ratingLabels = ["", "Not great", "It was fine", "Pretty good", "Really good", "Loved it"];

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-secondary text-sm font-medium mb-3">
            <MessageSquare className="w-4 h-4" />
            Quick feedback
          </div>
          <h1 className="text-4xl font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
            How did today&apos;s cup treat you?
          </h1>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground ml-4 mt-1 shrink-0"
          aria-label="Dismiss survey"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-10">
        Tell us. It only takes a minute. We are a small team and we genuinely read every word you share with us. Good, mixed, or somewhere in between, we want to know.
      </p>

      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
        <div className="mb-8">
          <label className="block font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            How was your experience?
          </label>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
                aria-label={`${n} star${n !== 1 ? "s" : ""}`}
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    n <= (hovered || rating)
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-sm text-muted-foreground">{ratingLabels[hovered || rating]}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Anything you&apos;d like to share?
          </label>
          <p className="text-sm text-muted-foreground mb-3">
            Did a blend surprise you? Is there something we could do better? Is there a product you wish we carried? We are all ears.
          </p>
          <textarea
            rows={4}
            placeholder="The Golden Hour Latte Mix was exactly what I needed at 2pm..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
          >
            Skip for now
          </button>
          <button
            onClick={() => setSubmitted(true)}
            disabled={rating === 0}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Send feedback <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        No account needed. Your response is private and only seen by our team.
      </p>
    </main>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    type: [], caffeine: [], mood: [], temp: [], dietary: [], maxPrice: 25,
  });

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const nav = useCallback((p: Page, product?: Product) => {
    setPage(p);
    if (product) setSelectedProduct(product);
    if (p === "checkout") setCheckoutStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header cartCount={cartCount} nav={nav} />
      <div className="flex-1">
        {page === "home" && <HomePage nav={nav} onAdd={addToCart} />}
        {page === "shop" && <ShopPage nav={nav} onAdd={addToCart} filters={filters} setFilters={setFilters} />}
        {page === "product" && selectedProduct && <ProductDetailPage product={selectedProduct} nav={nav} onAdd={addToCart} />}
        {page === "checkout" && <CheckoutPage step={checkoutStep} setStep={setCheckoutStep} cart={cart} setCart={setCart} nav={nav} />}
        {page === "survey" && <SurveyPage nav={nav} />}
      </div>
      <Footer nav={nav} />
    </div>
  );
}