import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, MessageSquare, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const messageData = [
  { date: "Lun", enviados: 120, recibidos: 80 },
  { date: "Mar", enviados: 150, recibidos: 95 },
  { date: "Mie", enviados: 180, recibidos: 110 },
  { date: "Jue", enviados: 160, recibidos: 100 },
  { date: "Vie", enviados: 200, recibidos: 130 },
  { date: "Sab", enviados: 90, recibidos: 60 },
  { date: "Dom", enviados: 70, recibidos: 50 },
];

const campaignData = [
  { name: "Exitosas", value: 65 },
  { name: "En Progreso", value: 20 },
  { name: "Fallidas", value: 15 },
];

const COLORS = ["#10b981", "#3b82f6", "#ef4444"];

const stats = [
  {
    label: "Mensajes Totales",
    value: "1,240",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-600",
  },
  {
    label: "Contactos Activos",
    value: "342",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
  },
  {
    label: "Campanas Completadas",
    value: "28",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-600",
  },
  {
    label: "Tiempo Promedio Respuesta",
    value: "2.3s",
    icon: Clock,
    color: "from-orange-500 to-red-600",
  },
];

export default function DataSection() {
  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats: {
        totalMessages: 1240,
        activeContacts: 342,
        completedCampaigns: 28,
        averageResponseTime: "2.3s",
      },
      messageHistory: messageData,
      campaignStatus: campaignData,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Datos & Analytics</h2>
          <p className="text-muted-foreground mt-1">Visualiza estadisticas y gestiona tus datos</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Datos
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Messages Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Mensajes por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={messageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="enviados" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="recibidos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Campaign Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Estado Campanas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campaignData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {campaignData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">Actividad Reciente</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 text-muted-foreground">Tipo</th>
                  <th className="text-left py-2 px-4 text-muted-foreground">Descripcion</th>
                  <th className="text-left py-2 px-4 text-muted-foreground">Fecha</th>
                  <th className="text-left py-2 px-4 text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    type: "Mensaje",
                    desc: "Enviado a contacto #123",
                    date: "Hoy 14:30",
                    status: "Exitoso",
                  },
                  {
                    type: "Campana",
                    desc: "Campana Verano iniciada",
                    date: "Hoy 10:15",
                    status: "En Progreso",
                  },
                  {
                    type: "Automatizacion",
                    desc: "Respuesta automatica activada",
                    date: "Ayer 09:00",
                    status: "Activo",
                  },
                  {
                    type: "Exportacion",
                    desc: "Datos exportados",
                    date: "Ayer 16:45",
                    status: "Completado",
                  },
                ].map((activity, index) => (
                  <tr key={index} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 text-foreground">{activity.type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{activity.desc}</td>
                    <td className="py-3 px-4 text-muted-foreground">{activity.date}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
