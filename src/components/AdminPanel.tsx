import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Product {
  id?: number;
  name: string;
  barcode: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  discount_percent: number;
  promo_label: string;
  is_active: boolean;
}

interface UserEntry {
  id: number;
  email: string;
  name: string;
  role: string;
  balance: number;
  created_at: string;
}

const EMPTY_PRODUCT: Product = { name: "", barcode: "", price: 0, category: "", description: "", stock: 0, discount_percent: 0, promo_label: "", is_active: true };

interface Props {
  onUserUpdate: (u: User) => void;
}

export default function AdminPanel({ onUserUpdate: _ }: Props) {
  const [tab, setTab] = useState<"products" | "users">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [topupEmail, setTopupEmail] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMsg, setTopupMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "products") loadProducts();
    else loadUsers();
  }, [tab]);

  const loadProducts = async () => {
    try {
      const data = await api.products.list({ active_only: false });
      setProducts(data);
    } catch (_e) { /* ignore */ }
  };

  const loadUsers = async () => {
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (_e) { /* ignore */ }
  };

  const saveProduct = async (p: Product) => {
    setLoading(true);
    try {
      if (p.id) {
        await api.products.update(p.id, p);
      } else {
        await api.products.create(p);
      }
      setShowForm(false);
      setEditing(null);
      loadProducts();
    } catch (_e) { /* ignore */ }
    setLoading(false);
  };

  const handleTopup = async () => {
    if (!topupEmail || !topupAmount) return;
    setLoading(true);
    try {
      const res = await api.users.topup(topupEmail, parseFloat(topupAmount));
      setTopupMsg(`Баланс пополнен. Новый баланс: ${res.new_balance.toFixed(2)} ₽`);
      setTopupEmail("");
      setTopupAmount("");
      loadUsers();
    } catch (e: unknown) {
      setTopupMsg(e instanceof Error ? e.message : "Ошибка");
    }
    setLoading(false);
    setTimeout(() => setTopupMsg(""), 4000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex gap-4">
        <button
          onClick={() => setTab("products")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "products" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Icon name="Package" size={16} /> Товары
        </button>
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Icon name="Users" size={16} /> Пользователи
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">УПРАВЛЕНИЕ ТОВАРАМИ</h2>
              <button
                onClick={() => { setEditing(EMPTY_PRODUCT); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity neon-glow"
              >
                <Icon name="Plus" size={16} /> Добавить товар
              </button>
            </div>

            {showForm && editing && (
              <ProductForm
                product={editing}
                onSave={saveProduct}
                onCancel={() => { setShowForm(false); setEditing(null); }}
                loading={loading}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {products.map((p) => (
                <div key={p.id} className={`glass rounded-xl border p-4 transition-all ${p.is_active ? "border-border" : "border-border/30 opacity-60"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-foreground truncate">{p.name}</p>
                        {p.promo_label && (
                          <span className="px-1.5 py-0.5 rounded-md text-xs bg-accent/20 text-accent border border-accent/30 whitespace-nowrap">{p.promo_label}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{p.barcode}</p>
                    </div>
                    <button
                      onClick={() => { setEditing(p); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0"
                    >
                      <Icon name="Pencil" size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div>
                      {p.discount_percent > 0 && (
                        <p className="text-xs text-muted-foreground line-through">{p.price.toFixed(0)} ₽</p>
                      )}
                      <p className="font-display font-bold text-primary">
                        {p.discount_percent > 0 ? (p.price * (1 - p.discount_percent / 100)).toFixed(0) : p.price.toFixed(0)} ₽
                        {p.discount_percent > 0 && <span className="text-xs text-accent ml-1">−{p.discount_percent}%</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Остаток</p>
                      <p className="text-sm font-medium text-foreground">{p.stock} шт.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">ПОЛЬЗОВАТЕЛИ</h2>

            <div className="glass rounded-2xl border border-border p-6 mb-6">
              <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Icon name="CreditCard" size={18} className="text-accent" />
                ПОПОЛНИТЬ БАЛАНС
              </h3>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="email"
                  value={topupEmail}
                  onChange={(e) => setTopupEmail(e.target.value)}
                  placeholder="Email пользователя"
                  className="flex-1 min-w-48 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors text-sm"
                />
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Сумма ₽"
                  className="w-36 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors text-sm"
                />
                <button
                  onClick={handleTopup}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 neon-glow-amber"
                >
                  Пополнить
                </button>
              </div>
              {topupMsg && (
                <p className="mt-3 text-sm text-primary">{topupMsg}</p>
              )}
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="glass rounded-xl border border-border p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="text-lg">{u.role === "admin" ? "👑" : u.role === "cashier" ? "🖥️" : "👤"}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.role === "admin" ? "bg-accent/20 text-accent" : u.role === "cashier" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {u.role === "admin" ? "Админ" : u.role === "cashier" ? "Кассир" : "Клиент"}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Баланс</p>
                      <p className="font-display font-bold text-primary">{u.balance.toFixed(2)} ₽</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FormProps {
  product: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
  loading: boolean;
}

function ProductForm({ product, onSave, onCancel, loading }: FormProps) {
  const [form, setForm] = useState<Product>({ ...product });

  const set = (key: keyof Product, value: string | number | boolean) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="glass rounded-2xl border border-primary/30 p-6 mb-6 animate-scale-in">
      <h3 className="font-display text-xl font-bold text-foreground mb-4">{form.id ? "РЕДАКТИРОВАТЬ ТОВАР" : "НОВЫЙ ТОВАР"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: "name", label: "Название", type: "text", placeholder: "Название товара" },
          { key: "barcode", label: "Штрихкод", type: "text", placeholder: "1234567890123" },
          { key: "price", label: "Цена (₽)", type: "number", placeholder: "0" },
          { key: "category", label: "Категория", type: "text", placeholder: "Напитки" },
          { key: "stock", label: "Остаток (шт.)", type: "number", placeholder: "0" },
          { key: "discount_percent", label: "Скидка (%)", type: "number", placeholder: "0" },
          { key: "promo_label", label: "Акционный ярлык", type: "text", placeholder: "Хит, Новинка..." },
        ].map((field) => (
          <div key={field.key}>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">{field.label}</label>
            <input
              type={field.type}
              value={String(form[field.key as keyof Product])}
              onChange={(e) => set(field.key as keyof Product, field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
        ))}

        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Описание товара"
            rows={2}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("is_active", !form.is_active)}
            className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-primary" : "bg-secondary"} relative`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_active ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="text-sm text-foreground">Активен</span>
        </label>

        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
            Отмена
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
