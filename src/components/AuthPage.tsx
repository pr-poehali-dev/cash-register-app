import { useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: (user: User, token: string) => void;
  device: "pc" | "phone";
  onChangeDevice: () => void;
}

export default function AuthPage({ onLogin, device, onChangeDevice }: Props) {
  const [mode, setMode] = useState<"login" | "register">(device === "pc" ? "login" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await api.auth.login(email, password);
        onLogin(res.user, res.token);
      } else {
        const res = await api.auth.register(email, password, name);
        onLogin(res.user, res.token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const isPc = device === "pc";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/3 left-1/3 w-96 h-96 rounded-full blur-3xl ${isPc ? "bg-primary/5" : "bg-accent/5"}`} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <button onClick={onChangeDevice} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
          <Icon name="ChevronLeft" size={16} /> Сменить устройство
        </button>

        <div className="glass rounded-2xl border border-border p-8">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${isPc ? "bg-primary/10" : "bg-accent/10"}`}>
            <Icon name={isPc ? "Monitor" : "Smartphone"} size={28} className={isPc ? "text-primary" : "text-accent"} />
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            {mode === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {isPc ? "Касса / Панель управления" : "Клиентское приложение"}
          </p>

          <form onSubmit={handle} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ваше имя"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-display font-semibold text-lg tracking-wide transition-all duration-200 disabled:opacity-50 ${
                isPc
                  ? "bg-primary text-primary-foreground hover:opacity-90 neon-glow"
                  : "bg-accent text-accent-foreground hover:opacity-90 neon-glow-amber"
              }`}
            >
              {loading ? "Входим..." : mode === "login" ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ"}
            </button>
          </form>

          {device === "phone" && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
              </button>
            </div>
          )}

          {isPc && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Для кассы используйте учётные данные администратора
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
