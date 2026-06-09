import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, MessageSquare, Users, Clock, Loader2 } from "lucide-react";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const COLORS = ["#10b981", "#3b82f6", "#ef4444"];

export default function DataSection() {
  const { data: phones = [], isLoading: phonesLoading } = trpc.whatsapp.listNumbers.useQuery();
  const { data: campaigns = [], isLoading: campaignsLoading } = trpc.whatsapp.listCampaigns.useQuery();

  // Generate chart data from actual data
  const messageData = [
    { date: "Lun", enviados: 0, recibidos: 0 },
    { date: "Mar", enviados: 0, recibidos: 0 },
    { date: "Mie", enviados: 0, recibidos: 0 },
    { date: "Jue", enviados: 0, recibidos: 0 },
    { date: "Vie", enviados: 0, recibidos: 0 },
    { date: "Sab", enviados: 0, recibidos: 0 },
    { date: "Dom", enviados: 0, recibidos: 0 },
  ];

  const campaignStats = [
    { name: "Completadas", value: campaigns.filter(c => c.status === "completed").length || 0 },
    { name: "En Progreso", value: campaigns.filter(c => c.status === "running").length || 0 },
    { name: "Fallidas", value: campaigns.filter(c => c.status === "failed").length || 0 },
  ];

  const stats = [
    {
      label: "Numeros Conectados",
      value: phones.filter(p => p.isConnected).length.toString(),
      icon: MessageSquare,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Total de Numeros",
      value: phones.length.toString(),
      icon: Users,
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Campanas Completadas",
      value: campaigns.filter(c => c.status === "completed").length.toString(),
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "Campanas Totales",
      value: campaigns.length.toString(),
      icon: Clock,
      color: "from-orange-500 to-red-600",
    },
  ];

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats: {
        connectedNumbers: phones.filter(p => p.isConnected).length,
        totalNumbers: phones.length,
        completedCampaigns: campaigns.filter(c => c.status === "completed").length,
        totalCampaigns: campaigns.length,
      },
      phones: phones.map(p => ({
        phoneNumber: p.phoneNumber,
        sessionName: p.sessionName,
        isConnected: p.isConnected,
        lastActivity: p.lastActivity,
      })),
      campaigns: campaigns.map(c => ({
        name: c.name,
        status: c.status,
        targetCount: c.targetNumbers?.length || 0,
        sentCount: c.sentCount,
        failedCount: c.failedCount,
      })),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Datos exportados correctamente");
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

      {phonesLoading || campaignsLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <>
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
                {campaignStats.some(s => s.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={campaignStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {campaignStats.map((entry, index) => (
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
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sin campanas aun
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Campaigns Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">Campanas Recientes</h3>
              {campaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-4 text-muted-foreground">Nombre</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">Estado</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">Destinatarios</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">Enviados</th>
                        <th className="text-left py-2 px-4 text-muted-foreground">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.slice(0, 5).map((campaign, index) => (
                        <tr key={index} className="border-b border-border hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4 text-foreground font-medium">{campaign.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === "completed" ? "bg-green-500/20 text-green-400" :
                              campaign.status === "running" ? "bg-blue-500/20 text-blue-400" :
                              campaign.status === "failed" ? "bg-red-500/20 text-red-400" :
                              "bg-gray-500/20 text-gray-400"
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{campaign.targetNumbers?.length || 0}</td>
                          <td className="py-3 px-4 text-muted-foreground">{campaign.sentCount}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay campanas aun</div>
              )}
            </Card>
          </motion.div>
        </>
      )}
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
