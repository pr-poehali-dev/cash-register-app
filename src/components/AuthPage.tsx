import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";
import { redeemConnectCode } from "@/lib/connect-code";
import CameraScanner from "@/components/CameraScanner";

interface Props {
  onLogin: (user: User, token: string) => void;
  device: "pc" | "phone";
  onChangeDevice: () => void;
}

const UNIVERSAL_PASSWORD = "admin2015!RM";

type PhoneMode = "code" | "register" | "email";

export default function AuthPage({ onLogin, device, onChangeDevice }: Props) {
  const [phoneMode, setPhoneMode] = useState<PhoneMode>("code");
  const [codeDigits, setCodeDigits] = useState(["", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const digitRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [pcEmail, setPcEmail] = useState("");
  const [pcPassword, setPcPassword] = useState("");
  const [pcError, setPcError] = useState("");
  const [pcLoading, setPcLoading] = useState(false);

  const handleDigitInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[idx] = digit;
    setCodeDigits(next);
    setCodeError("");
    if (digit && idx < 2) digitRefs[idx + 1].current?.focus();
    if (next.every((d) => d !== "") && next.join("").length === 3) {
      setTimeout(() => submitCode(next.join("")), 100);
    }
  };

  const handleDigitKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      digitRefs[idx - 1].current?.focus();
    }
  };

  const submitCode = (code: string) => {
    setCodeLoading(true);
    setCodeError("");
    const payload = redeemConnectCode(code);
    setTimeout(() => {
      if (!payload) {
        setCodeError("Неверный или устаревший код");
        setCodeDigits(["", "", ""]);
        digitRefs[0].current?.focus();
      } else {
        onLogin(payload.user as User, payload.token);
      }
      setCodeLoading(false);
    }, 400);
  };

  const handleQrScan = (result: string) => {
    setShowCamera(false);
    if (/^\d{3}$/.test(result)) {
      submitCode(result);
    } else {
      setCodeError("QR-код не распознан как код подключения");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.register(email, UNIVERSAL_PASSWORD, name);
      onLogin(res.user, res.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login(email, UNIVERSAL_PASSWORD);
      onLogin(res.user, res.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handlePcLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPcError("");
    setPcLoading(true);
    try {
      const res = await api.auth.login(pcEmail, pcPassword);
      onLogin(res.user, res.token);
    } catch (err: unknown) {
      setPcError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPcLoading(false);
    }
  };

  if (device === "pc") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full blur-3xl bg-primary/5" />
        </div>
        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <button onClick={onChangeDevice} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <Icon name="ChevronLeft" size={16} /> Сменить устройство
          </button>
          <div className="glass rounded-2xl border border-border p-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Icon name="Monitor" size={28} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">ВХОД В КАССУ</h1>
            <p className="text-muted-foreground text-sm mb-8">Панель кассира / Администратора</p>
            <form onSubmit={handlePcLogin} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Email</label>
                <input type="email" value={pcEmail} onChange={(e) => setPcEmail(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="admin@pos.ru" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Пароль</label>
                <input type="password" value={pcPassword} onChange={(e) => setPcPassword(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••" required />
              </div>
              {pcError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
                  <Icon name="AlertCircle" size={16} /> {pcError}
                </div>
              )}
              <button type="submit" disabled={pcLoading}
                className="w-full py-3.5 rounded-xl font-display font-semibold text-lg tracking-wide bg-primary text-primary-foreground hover:opacity-90 neon-glow disabled:opacity-50 transition-all">
                {pcLoading ? "Входим..." : "ВОЙТИ"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {showCamera && (
        <CameraScanner
          onScan={handleQrScan}
          onClose={() => setShowCamera(false)}
          hint="Наведите камеру на QR-код с кассы"
        />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl bg-accent/5" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <button onClick={onChangeDevice} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <Icon name="ChevronLeft" size={16} /> Назад
        </button>

        <div className="glass rounded-2xl border border-border p-6">
          <div className="flex rounded-xl bg-secondary/50 p-1 mb-6 gap-1">
            {([["code", "По коду"], ["register", "Регистрация"], ["email", "По email"]] as [PhoneMode, string][]).map(([m, l]) => (
              <button key={m} onClick={() => { setPhoneMode(m); setCodeError(""); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${phoneMode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>

          {phoneMode === "code" && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Link" size={22} className="text-accent" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">КОД ПОДКЛЮЧЕНИЯ</h2>
                <p className="text-muted-foreground text-sm mt-1">Введите 3 цифры с экрана кассы</p>
              </div>

              <div className="flex justify-center gap-3 mb-4">
                {codeDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={digitRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitInput(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKey(i, e)}
                    className={`w-20 h-20 text-center font-display text-4xl font-bold bg-secondary/50 border-2 rounded-2xl focus:outline-none transition-all text-foreground ${
                      d ? "border-accent" : "border-border focus:border-accent/50"
                    } ${codeLoading ? "opacity-50" : ""}`}
                  />
                ))}
              </div>

              {codeLoading && (
                <div className="flex justify-center mb-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {codeError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2.5 rounded-xl mb-4">
                  <Icon name="AlertCircle" size={14} /> {codeError}
                </div>
              )}

              <div className="relative flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={() => setShowCamera(true)}
                className="w-full py-3.5 rounded-xl bg-accent/10 border border-accent/30 text-accent font-medium flex items-center justify-center gap-2 hover:bg-accent/20 transition-all neon-glow-amber"
              >
                <Icon name="ScanLine" size={18} />
                Сканировать QR с кассы
              </button>
            </div>
          )}

          {phoneMode === "register" && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">НОВЫЙ АККАУНТ</h2>
                <p className="text-muted-foreground text-sm mt-1">Создайте клиентский профиль</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Имя</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
                    placeholder="Ваше имя" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
                    placeholder="your@email.com" required />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2.5 rounded-xl">
                    <Icon name="AlertCircle" size={14} /> {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-display font-semibold text-lg bg-accent text-accent-foreground hover:opacity-90 neon-glow-amber disabled:opacity-50 transition-all">
                  {loading ? "Создаём..." : "СОЗДАТЬ АККАУНТ"}
                </button>
              </form>
            </div>
          )}

          {phoneMode === "email" && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">ВХОД ПО EMAIL</h2>
                <p className="text-muted-foreground text-sm mt-1">Для уже зарегистрированных</p>
              </div>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
                    placeholder="your@email.com" required />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2.5 rounded-xl">
                    <Icon name="AlertCircle" size={14} /> {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-display font-semibold text-lg bg-accent text-accent-foreground hover:opacity-90 neon-glow-amber disabled:opacity-50 transition-all">
                  {loading ? "Входим..." : "ВОЙТИ"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}