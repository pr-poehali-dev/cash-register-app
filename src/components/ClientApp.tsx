import { useState } from "react";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";
import ClientCatalog from "@/components/ClientCatalog";
import ClientOrders from "@/components/ClientOrders";
import ClientProfile from "@/components/ClientProfile";

interface Props {
  user: User;
  onLogout: () => void;
  onUserUpdate: (u: User) => void;
}

type Tab = "catalog" | "orders" | "profile";

export default function ClientApp({ user, onLogout, onUserUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("catalog");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "catalog", label: "Каталог", icon: "LayoutGrid" },
    { id: "orders", label: "Заказы", icon: "ClipboardList" },
    { id: "profile", label: "Профиль", icon: "User" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      <header className="glass-dark border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Icon name="Zap" size={16} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground tracking-wide">SHOP</h1>
            <p className="text-xs text-muted-foreground">{user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
            <Icon name="CreditCard" size={14} className="text-primary" />
            <span className="text-primary text-sm font-display font-bold">{user.balance.toFixed(0)} ₽</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {tab === "catalog" && <ClientCatalog user={user} onUserUpdate={onUserUpdate} />}
        {tab === "orders" && <ClientOrders />}
        {tab === "profile" && <ClientProfile user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />}
      </div>

      <nav className="glass-dark border-t border-border px-4 py-3 flex items-center justify-around sticky bottom-0 z-50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${tab === t.id ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon name={t.icon} size={22} />
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
