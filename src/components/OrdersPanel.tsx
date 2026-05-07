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
  client_name: string;
  client_email: string;
  items: OrderItem[];
}

const STATUSES = [
  { value: "pending", label: "Ожидает", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "processing", label: "Готовится", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "ready", label: "Готов", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "completed", label: "Выдан", color: "bg-muted text-muted-foreground border-border" },
  { value: "cancelled", label: "Отменён", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const NEXT_STATUS: Record<string, string> = {
  pending: "processing",
  processing: "ready",
  ready: "completed",
};

interface Props {
  onCountChange?: (n: number) => void;
}

export default function OrdersPanel({ onCountChange }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.orders.all(filter === "all" ? undefined : filter);
      setOrders(data);
      if (filter === "pending" && onCountChange) onCountChange(data.length);
    } catch (_e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const setStatus = async (id: number, status: string) => {
    try {
      await api.orders.setStatus(id, status);
      load();
    } catch (_e) { /* ignore */ }
  };

  const statusInfo = (s: string) => STATUSES.find((x) => x.value === s) || STATUSES[0];

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[{ v: "pending", l: "Новые" }, { v: "processing", l: "Готовятся" }, { v: "ready", l: "Готовы" }, { v: "completed", l: "Выданы" }, { v: "all", l: "Все" }].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-16">
            <Icon name="ClipboardList" size={48} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Заказов нет</p>
          </div>
        )}

        {orders.map((order) => {
          const info = statusInfo(order.status);
          const next = NEXT_STATUS[order.status];
          const nextInfo = next ? statusInfo(next) : null;
          const isExpanded = expanded === order.id;

          return (
            <div key={order.id} className={`glass rounded-2xl border transition-all duration-200 ${order.status === "pending" ? "border-yellow-500/30" : "border-border"}`}>
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : order.id)}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-primary">#{order.id}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.client_name}</p>
                      <p className="text-xs text-muted-foreground">{order.client_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${info.color}`}>
                      {info.label}
                    </span>
                    <span className="font-display font-bold text-primary">{order.total.toFixed(0)} ₽</span>
                    <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4 animate-fade-in">
                  <div className="space-y-1.5 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                        <span className="text-foreground font-medium">{(item.price * item.quantity).toFixed(0)} ₽</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name={order.payment_method === "card" ? "CreditCard" : "Banknote"} size={14} />
                      {order.payment_method === "card" ? "Виртуальная карта" : "Наличные"}
                    </div>

                    <div className="flex gap-2">
                      {order.status !== "completed" && order.status !== "cancelled" && (
                        <button
                          onClick={() => setStatus(order.id, "cancelled")}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                          Отменить
                        </button>
                      )}
                      {nextInfo && (
                        <button
                          onClick={() => setStatus(order.id, next)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                        >
                          → {nextInfo.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
