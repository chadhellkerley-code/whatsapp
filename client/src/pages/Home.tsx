import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Dashboard from "./Dashboard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const featureCards = [
  {
    icon: MessageSquareMore,
    title: "Números activos",
    description: "Gestiona sesiones y estado de conexión desde un solo panel.",
  },
  {
    icon: Zap,
    title: "Campañas rápidas",
    description: "Lanza envíos y controla su progreso sin navegar pantallas vacías.",
  },
  {
    icon: BarChart3,
    title: "Métricas claras",
    description: "Observa el volumen de mensajes, respuestas y actividad diaria.",
  },
];

const trustPoints = [
  "Autenticación centralizada",
  "API tRPC en /api/trpc",
  "Respuesta inmediata en desktop y móvil",
];

export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <AuthLanding />;
}

function AuthLanding() {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-foreground"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(16, 185, 129, 0.18), transparent 32%), radial-gradient(circle at 80% 20%, rgba(52, 211, 153, 0.12), transparent 25%), radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.05), transparent 22%), linear-gradient(180deg, #07110d 0%, #050606 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <main className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.15fr_.85fr] lg:px-10">
        <section className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-emerald-100/90 backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            WhatsApp Pro
          </motion.div>

          <div className="space-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="max-w-3xl text-5xl font-semibold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl"
            >
              Un centro de control más claro para tus operaciones de WhatsApp.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="max-w-2xl text-lg leading-8 text-white/70 sm:text-xl"
            >
              Administra números, campañas, automatización e indicadores desde
              una interfaz con más jerarquía visual, menos ruido y un flujo
              directo al trabajo.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            {featureCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </section>

        <section className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09120f]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.12),transparent_32%)]" />

            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Acceso seguro</p>
                    <p className="text-xs text-white/50">
                      Sesión y datos sincronizados
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Online
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-white/8 bg-white/4 p-5">
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Datos protegidos por autenticación
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Números" value="12" />
                  <Metric label="Campañas" value="08" />
                  <Metric label="Automatizaciones" value="24" />
                </div>
              </div>

              <div className="space-y-3">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-white/10 pt-5">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={() => {
                      window.location.href = getLoginUrl();
                    }}
                    size="lg"
                    className="h-12 w-full rounded-xl bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.28)]"
                  >
                    Iniciar sesión
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
                <p className="text-center text-xs leading-5 text-white/45">
                  Si no tienes configurado el portal de OAuth, este botón vuelve
                  al inicio sin romper la vista.
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_35%),linear-gradient(180deg,#07110d_0%,#050606_100%)] text-white">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
        <span className="text-sm text-white/70">Preparando interfaz...</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
    </div>
  );
}
