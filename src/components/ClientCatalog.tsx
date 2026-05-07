import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";
import CameraScanner from "@/components/CameraScanner";

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  discount_percent: number;
  promo_label?: string;
  is_active: boolean;
}

interface CartItem extends Product { quantity: number; }

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
}

export default function ClientCatalog({ user, onUserUpdate }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");

  useEffect(() => {
    api.products.list().then(setProducts).finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    return matchSearch && matchCat;
  });

  const getPrice = (p: Product) => p.discount_percent > 0 ? p.price * (1 - p.discount_percent / 100) : p.price;
  const total = cart.reduce((sum, i) => sum + getPrice(i) * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    try {
      const product = await api.products.byBarcode(barcode);
      setScannedProduct(product);
    } catch (_e) {
      setOrderMsg(`❌ Товар с кодом "${barcode}" не найден`);
    }
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const placeOrder = async (method: "card" | "cash") => {
    if (cart.length === 0) return;
    setOrdering(true);
    setOrderMsg("");
    try {
      const items = cart.map((i) => ({
        product_id: i.id,
        product_name: i.name,
        price: getPrice(i),
        quantity: i.quantity,
      }));
      await api.orders.create(items, method);
      setCart([]);
      setShowCart(false);
      setOrderMsg("✅ Заказ принят! Следите за статусом во вкладке «Заказы»");
      if (method === "card") {
        onUserUpdate({ ...user, balance: user.balance - total });
      }
    } catch (e: unknown) {
      setOrderMsg(e instanceof Error ? `❌ ${e.message}` : "Ошибка оформления");
    }
    setOrdering(false);
    setTimeout(() => setOrderMsg(""), 5000);
  };

  return (
    <div className="h-full flex flex-col">
      {showScanner && (
        <CameraScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
          hint="Наведите камеру на штрихкод товара"
        />
      )}

      {scannedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end px-4 pb-6" onClick={() => setScannedProduct(null)}>
          <div className="w-full max-w-lg mx-auto bg-card rounded-2xl border border-border p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon name="ScanLine" size={28} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent font-medium mb-1 uppercase tracking-wide">Отсканирован</p>
                <p className="font-display text-xl font-bold text-foreground">{scannedProduct.name}</p>
                {scannedProduct.discount_percent > 0 && (
                  <p className="text-xs text-muted-foreground line-through">{scannedProduct.price.toFixed(0)} ₽</p>
                )}
                <p className="text-2xl font-display font-bold text-primary mt-0.5">
                  {getPrice(scannedProduct).toFixed(0)} ₽
                  {scannedProduct.discount_percent > 0 && <span className="text-sm text-accent ml-2">−{scannedProduct.discount_percent}%</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setScannedProduct(null)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-secondary/50 transition-colors">
                Закрыть
              </button>
              <button
                onClick={() => { addToCart(scannedProduct); setScannedProduct(null); }}
                className="flex-1 py-2.5 rounded-xl bg-accent text-accent-foreground font-display font-semibold text-sm neon-glow-amber hover:opacity-90 transition-opacity"
              >
                В КОРЗИНУ
              </button>
            </div>
          </div>
        </div>
      )}

      {orderMsg && (
        <div className={`mx-4 mt-4 px-4 py-3 rounded-xl text-sm ${orderMsg.startsWith("✅") ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"} animate-fade-in`}>
          {orderMsg}
        </div>
      )}

      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товаров..."
              className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/25 transition-colors flex-shrink-0"
            title="Сканировать штрихкод"
          >
            <Icon name="ScanLine" size={18} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${category === cat ? "bg-accent text-accent-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
            >
              {cat === "all" ? "Все" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p, i) => (
              <div key={p.id} className="glass rounded-xl border border-border overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1 mr-1">{p.name}</p>
                    {p.promo_label && (
                      <span className="px-1.5 py-0.5 rounded-md text-xs bg-accent/20 text-accent border border-accent/30 whitespace-nowrap flex-shrink-0">{p.promo_label}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{p.category}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      {p.discount_percent > 0 && (
                        <p className="text-xs text-muted-foreground line-through">{p.price.toFixed(0)} ₽</p>
                      )}
                      <p className="font-display font-bold text-primary text-lg">{getPrice(p).toFixed(0)} ₽</p>
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent hover:bg-accent/30 transition-colors"
                    >
                      <Icon name="Plus" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-display font-semibold flex items-center justify-between px-5 neon-glow-amber hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <Icon name="ShoppingCart" size={18} />
              <span>КОРЗИНА ({cartCount})</span>
            </div>
            <span>{total.toFixed(0)} ₽</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowCart(false)}>
          <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl border border-border border-b-0 p-5 animate-slide-up max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full bg-border mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">КОРЗИНА</h2>

            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 glass rounded-xl p-3 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-primary font-display">{(getPrice(item) * item.quantity).toFixed(0)} ₽</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Итого</span>
                <span className="font-display text-3xl font-bold text-primary">{total.toFixed(0)} ₽</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => placeOrder("card")}
                  disabled={ordering || user.balance < total}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity neon-glow"
                >
                  {ordering ? "Оформляем..." : `ОПЛАТИТЬ КАРТОЙ (${user.balance.toFixed(0)} ₽)`}
                </button>
                {user.balance < total && (
                  <p className="text-xs text-center text-destructive">Недостаточно средств на карте</p>
                )}
                <button
                  onClick={() => placeOrder("cash")}
                  disabled={ordering}
                  className="w-full py-3 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-secondary/50 transition-colors disabled:opacity-40"
                >
                  Оплатить наличными при получении
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}