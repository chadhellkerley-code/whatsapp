import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  Loader2,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  Smartphone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const COLORS = ["#10b981", "#3b82f6", "#ef4444", "#a855f7"];

export default function DataSection() {
  const { data: dashboard, isLoading: dashboardLoading } =
    trpc.whatsapp.getDashboardStats.useQuery();
  const { data: phones = [], isLoading: phonesLoading } =
    trpc.whatsapp.listNumbers.useQuery();
  const { data: campaigns = [], isLoading: campaignsLoading } =
    trpc.whatsapp.listCampaigns.useQuery();
  const { data: stats = [], isLoading: statsLoading } =
    trpc.whatsapp.getMessageStats.useQuery({});
  const { data: logs = [], isLoading: logsLoading } = trpc.whatsapp.getMessageLog.useQuery(
    { limit: 12 }
  );

  const messageChartData = phones.map((phone) => {
    const stat = stats.find((entry) => entry.phoneNumber === phone.phoneNumber);
    return {
      label: phone.sessionName,
      sent: stat?.totalSent ?? 0,
      received: stat?.totalReceived ?? 0,
      automated: stat?.automatedResponses ?? 0,
    };
  });

  const campaignStats = [
    { name: "Completadas", value: campaigns.filter((c) => c.status === "completed").length },
    { name: "En ejecución", value: campaigns.filter((c) => c.status === "running").length },
    { name: "Fallidas", value: campaigns.filter((c) => c.status === "failed").length },
    { name: "Borrador", value: campaigns.filter((c) => c.status === "draft").length },
  ];

  const statsCards = [
    {
      label: "Números conectados",
      value: String(dashboard?.connectedNumbers ?? phones.filter((p) => p.isConnected).length),
      icon: Smartphone,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Mensajes totales",
      value: String(dashboard?.totalMessages ?? 0),
      icon: MessageCircle,
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      label: "Respuestas automáticas",
      value: String(dashboard?.automatedResponses ?? 0),
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      label: "Campañas activas",
      value: String(dashboard?.activeCampaigns ?? 0),
      icon: Clock,
      gradient: "from-orange-500 to-red-600",
    },
  ];

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      dashboard,
      phones,
      campaigns,
      messageStats: stats,
      logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `whatsapp-export-${new Date().toISOString().split("T")[0]}.json`;
    anchor.click();
    toast.success("Datos exportados");
  };

  const loading = dashboardLoading || phonesLoading || campaignsLoading || statsLoading || logsLoading;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Datos & Analytics</h2>
          <p className="mt-1 text-muted-foreground">
            Métricas reales, exportación y registros recientes de WhatsApp.
          </p>
        </div>
        <Button onClick={exportData} className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
          <Download className="h-4 w-4" />
          Exportar datos
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground">
                Mensajes por cuenta
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={messageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="sent" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="received" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="automated" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground">Estado campañas</h3>
            </div>
            {campaignStats.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={campaignStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={88}
                    dataKey="value"
                  >
                    {campaignStats.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                Sin campañas todavía
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground">
                Campañas recientes
              </h3>
            </div>
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-border bg-secondary/20 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {campaign.targetNumbers?.length || 0} destinatarios
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center text-muted-foreground">
                  No hay campañas aún
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground">Registro reciente</h3>
            </div>
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border bg-secondary/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {log.contactNumber}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {log.message}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {log.direction}
                    </span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center text-muted-foreground">
                  Todavía no hay mensajes registrados
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
