import Icon from "@/components/ui/icon";

interface Props {
  onSelect: (device: "pc" | "phone") => void;
}

export default function DeviceSelect({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-xl w-full animate-fade-in">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-primary text-sm mb-6 glass">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            POS-система v1.0
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground mb-3 tracking-wide">
            ВЫБЕРИТЕ УСТРОЙСТВО
          </h1>
          <p className="text-muted-foreground text-lg">
            Вы открываете кассу или клиентское приложение?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSelect("pc")}
            className="group glass p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:neon-glow text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Icon name="Monitor" size={28} className="text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">КАССА / ПК</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Сканер штрихкодов, управление заказами, административная панель
            </p>
            <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Открыть кассу <Icon name="ArrowRight" size={16} />
            </div>
          </button>

          <button
            onClick={() => onSelect("phone")}
            className="group glass p-8 rounded-2xl border border-border hover:border-accent/50 transition-all duration-300 hover:neon-glow-amber text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Icon name="Smartphone" size={28} className="text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">ТЕЛЕФОН</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Каталог товаров, оформление заказов, виртуальная карта оплаты
            </p>
            <div className="mt-4 flex items-center gap-2 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Открыть приложение <Icon name="ArrowRight" size={16} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
