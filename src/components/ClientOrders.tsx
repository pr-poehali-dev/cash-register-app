import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface OrderItem {
  product_name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  payment_method: string;
  note?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const STATUSES: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pending: { label: "Ожидает подтверждения", icon: "Clock", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  processing: { label: "Готовится", icon: "ChefHat", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  ready: { label: "Готов к выдаче!", icon: "CheckCircle", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  completed: { label: "Получен", icon: "PackageCheck", color: "text-muted-foreground", bg: "bg-secondary/30 border-border" },
  cancelled: { label: "Отменён", icon: "XCircle", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
};

export default function ClientOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await api.orders.my();
      setOrders(data);
    } catch (_e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Icon name="ShoppingBag" size={36} className="text-muted-foreground/50" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">ЗАКАЗОВ НЕТ</h3>
        <p className="text-muted-foreground text-sm">Перейдите в каталог и оформите первый заказ</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto scrollbar-thin p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xl font-bold text-foreground">МОИ ЗАКАЗЫ</h2>
        <button onClick={load} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-colors">
          <Icon name="RefreshCw" size={15} />
        </button>
      </div>

      {orders.map((order) => {
        const info = STATUSES[order.status] || STATUSES.pending;
        const isExpanded = expanded === order.id;

        return (
          <div key={order.id} className={`rounded-2xl border p-4 transition-all ${info.bg} animate-fade-in`}>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : order.id)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-background/30 ${info.color}`}>
                <Icon name={info.icon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${info.color}`}>{info.label}</span>
                  <span className="font-display font-bold text-primary">{order.total.toFixed(0)} ₽</span>
                </div>
                <p className="text-xs text-muted-foreground">Заказ #{order.id} · {new Date(order.created_at).toLocaleDateString("ru")}</p>
              </div>
              <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground flex-shrink-0" />
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 animate-fade-in">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                    <span className="text-foreground">{(item.price * item.quantity).toFixed(0)} ₽</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs text-muted-foreground">
                  <Icon name={order.payment_method === "card" ? "CreditCard" : "Banknote"} size={12} />
                  {order.payment_method === "card" ? "Оплачено картой" : "Оплата наличными"}
                </div>
              </div>
            )}

            {order.status === "ready" && (
              <div className="mt-3 pt-3 border-t border-green-500/20">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Ваш заказ готов! Подойдите к кассе
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
