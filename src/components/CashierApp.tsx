import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";
import CashierScanner from "@/components/CashierScanner";
import AdminPanel from "@/components/AdminPanel";
import OrdersPanel from "@/components/OrdersPanel";

interface Props {
  user: User;
  onLogout: () => void;
  onUserUpdate: (u: User) => void;
}

type Tab = "orders" | "scanner" | "admin";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "text-yellow-400" },
  processing: { label: "Готовится", color: "text-blue-400" },
  ready: { label: "Готов", color: "text-green-400" },
  completed: { label: "Выдан", color: "text-muted-foreground" },
  cancelled: { label: "Отменён", color: "text-red-400" },
};

export { STATUS_LABELS };

export default function CashierApp({ user, onLogout, onUserUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const orders = await api.orders.all("pending");
      setNewOrdersCount(orders.length);
    } catch (_e) { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 10000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const tabs: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: "orders", label: "Заказы", icon: "ClipboardList" },
    { id: "scanner", label: "Сканер", icon: "ScanBarcode" },
    ...(user.role === "admin" ? [{ id: "admin" as Tab, label: "Админ", icon: "Settings", adminOnly: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-dark border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="Zap" size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground tracking-wide">POS КАССА</h1>
            <p className="text-xs text-muted-foreground">{user.name} · {user.role === "admin" ? "Администратор" : "Кассир"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-medium">ОНЛАЙН</span>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="LogOut" size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border px-6">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); if (t.id === "orders") refreshCount(); }}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-200 relative ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
                {t.id === "orders" && newOrdersCount > 0 && (
                  <span className="absolute -top-0 -right-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {newOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {tab === "orders" && <OrdersPanel onCountChange={setNewOrdersCount} />}
          {tab === "scanner" && <CashierScanner />}
          {tab === "admin" && user.role === "admin" && <AdminPanel onUserUpdate={onUserUpdate} />}
        </div>
      </div>
    </div>
  );
}