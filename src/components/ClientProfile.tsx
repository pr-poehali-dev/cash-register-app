import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  user: User;
  onLogout: () => void;
  onUserUpdate: (u: User) => void;
}

export default function ClientProfile({ user, onLogout }: Props) {
  return (
    <div className="overflow-y-auto scrollbar-thin p-4 space-y-4">
      <div className="glass rounded-2xl border border-border p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center mx-auto mb-4 text-3xl">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">{user.name}</h2>
        <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
      </div>

      <div className="glass rounded-2xl border border-primary/20 p-6 neon-glow">
        <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Виртуальная карта</p>
        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Баланс</p>
            <p className="font-display text-4xl font-bold text-primary">{user.balance.toFixed(2)} ₽</p>
          </div>
          <div className="text-right">
            <Icon name="CreditCard" size={40} className="text-primary/30" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Для пополнения баланса обратитесь к администратору
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-display text-lg font-bold text-foreground">АККАУНТ</h3>
        <div className="space-y-2">
          {[
            { icon: "User", label: "Имя", value: user.name },
            { icon: "Mail", label: "Email", value: user.email },
            { icon: "Shield", label: "Роль", value: "Клиент" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Icon name={item.icon} size={16} />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="text-sm text-foreground font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full py-3.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <Icon name="LogOut" size={16} />
        Выйти
      </button>
    </div>
  );
}
