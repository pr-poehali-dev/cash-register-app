import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import AuthPage from "@/components/AuthPage";
import DeviceSelect from "@/components/DeviceSelect";
import CashierApp from "@/components/CashierApp";
import ClientApp from "@/components/ClientApp";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "cashier" | "client";
  balance: number;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [device, setDevice] = useState<"pc" | "phone" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pos_token");
    const savedDevice = localStorage.getItem("pos_device") as "pc" | "phone" | null;
    if (savedDevice) setDevice(savedDevice);
    if (token) {
      api.auth.me()
        .then((d) => setUser(d.user))
        .catch(() => localStorage.removeItem("pos_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem("pos_token", token);
    setUser(u);
  };

  const handleLogout = () => {
    api.auth.logout().catch(() => {});
    localStorage.removeItem("pos_token");
    setUser(null);
  };

  const handleDeviceSelect = (d: "pc" | "phone") => {
    localStorage.setItem("pos_device", d);
    setDevice(d);
  };

  const handleUserUpdate = (u: User) => setUser(u);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return <DeviceSelect onSelect={handleDeviceSelect} />;
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} device={device} onChangeDevice={() => { localStorage.removeItem("pos_device"); setDevice(null); }} />;
  }

  if (device === "pc" || user.role === "admin" || user.role === "cashier") {
    return <CashierApp user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
  }

  return <ClientApp user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
}