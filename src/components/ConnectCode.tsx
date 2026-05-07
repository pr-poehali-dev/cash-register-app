import { useState, useEffect, useCallback } from "react";
import { createConnectCode, getActiveCode } from "@/lib/connect-code";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  user: User;
  token: string;
}

export default function ConnectCode({ user, token }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);

  const generate = useCallback(() => {
    const newCode = createConnectCode(token, user);
    setCode(newCode);
    setExpiresAt(Date.now() + 5 * 60 * 1000);
  }, [token, user]);

  useEffect(() => {
    const active = getActiveCode();
    if (active) {
      setCode(active.code);
      setExpiresAt(active.expiresAt);
    } else {
      generate();
    }
  }, [generate]);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0 && expiresAt > 0) generate();
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, generate]);

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const progress = expiresAt > 0 ? (timeLeft / 300) * 100 : 0;

  if (!code) return null;

  return (
    <div className="flex flex-col items-center py-10 px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="Link" size={26} className="text-accent" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground tracking-wide">КОД ПОДКЛЮЧЕНИЯ</h2>
          <p className="text-muted-foreground text-sm mt-1">Сообщите клиенту для быстрого входа</p>
        </div>

        <div className="glass rounded-3xl border border-accent/30 p-8 text-center neon-glow-amber mb-6">
          <div className="flex justify-center gap-3">
            {code.split("").map((digit, i) => (
              <div
                key={i}
                className="w-20 h-24 rounded-2xl bg-accent/10 border-2 border-accent/40 flex items-center justify-center animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="font-display text-5xl font-bold text-accent">{digit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Действует ещё</span>
            <span className={`font-mono font-bold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
              {mins}:{secs}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 60 ? "bg-destructive" : "bg-accent"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={generate}
          className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
        >
          <Icon name="RefreshCw" size={15} />
          Обновить код
        </button>

        <div className="mt-6 glass rounded-xl border border-border p-4 text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <Icon name="Smartphone" size={15} className="text-accent flex-shrink-0" />
            <span>Клиент открывает приложение → вводит 3 цифры</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Zap" size={15} className="text-primary flex-shrink-0" />
            <span>Вход без email и пароля — мгновенно</span>
          </div>
        </div>
      </div>
    </div>
  );
}
