import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  category: string;
  stock: number;
  discount_percent: number;
  promo_label?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CashierScanner() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scanBarcode = async (code: string) => {
    if (!code.trim()) return;
    setSearching(true);
    setError("");
    try {
      const product = await api.products.byBarcode(code.trim());
      setLastScanned(product);
      addToCart(product);
      setBarcode("");
    } catch (_e) {
      setError(`Товар с кодом "${code}" не найден`);
      setBarcode("");
    }
    setSearching(false);
    inputRef.current?.focus();
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const getPrice = (p: Product) => p.discount_percent > 0 ? p.price * (1 - p.discount_percent / 100) : p.price;
  const total = cart.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

  const clearCart = () => { setCart([]); setLastScanned(null); setError(""); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") scanBarcode(barcode);
  };

  return (
    <div className="h-full flex gap-0">
      <div className="flex-1 flex flex-col p-6 border-r border-border overflow-y-auto scrollbar-thin">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4 tracking-wide">СКАНЕР ШТРИХКОДОВ</h2>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Icon name={searching ? "Loader2" : "ScanBarcode"} size={20} className={`text-primary ${searching ? "animate-spin" : ""}`} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-32 py-4 text-foreground font-mono text-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Отсканируйте или введите штрихкод..."
              autoFocus
            />
            <button
              onClick={() => scanBarcode(barcode)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Поиск
            </button>
          </div>

          {error && (
            <div className="mt-2 flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
        </div>

        {lastScanned && (
          <div className="glass rounded-xl border border-primary/30 p-4 mb-6 animate-fade-in">
            <p className="text-xs text-primary mb-1 font-medium uppercase tracking-wide">Последний скан</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{lastScanned.name}</p>
                <p className="text-sm text-muted-foreground">{lastScanned.barcode}</p>
              </div>
              <p className="font-display text-xl font-bold text-primary">{getPrice(lastScanned).toFixed(0)} ₽</p>
            </div>
          </div>
        )}

        <div className="glass rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Быстрый поиск товаров</p>
          <ManualProductSearch onAdd={addToCart} />
        </div>
      </div>

      <div className="w-96 flex flex-col bg-card/50">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-foreground tracking-wide">КОРЗИНА</h2>
            <span className="text-sm text-muted-foreground">{cart.length} поз.</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="ShoppingCart" size={40} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Корзина пуста</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Сканируйте товары</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="glass rounded-xl p-3 border border-border">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Icon name="X" size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center text-sm">−</button>
                    <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center text-sm">+</button>
                  </div>
                  <div className="text-right">
                    {item.discount_percent > 0 && <p className="text-xs text-muted-foreground line-through">{item.price.toFixed(0)} ₽</p>}
                    <p className="font-display font-bold text-primary">{(getPrice(item) * item.quantity).toFixed(0)} ₽</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground font-medium">Итого</span>
            <span className="font-display text-3xl font-bold text-primary">{total.toFixed(0)} ₽</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clearCart} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-sm font-medium">
              Очистить
            </button>
            <button
              disabled={cart.length === 0}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 neon-glow"
            >
              К ОПЛАТЕ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SearchProps { onAdd: (p: Product) => void; }
function ManualProductSearch({ onAdd }: SearchProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const data = await api.products.list({ search: q });
      setResults(data.slice(0, 6));
    } catch (_e) { /* ignore */ }
  };

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); }}
        className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="Название или штрихкод..."
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAdd(p); setSearch(""); setResults([]); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
            >
              <span className="text-sm text-foreground">{p.name}</span>
              <span className="text-sm font-medium text-primary">{p.price.toFixed(0)} ₽</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
