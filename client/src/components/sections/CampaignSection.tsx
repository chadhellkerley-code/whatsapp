import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Send, Clock, Users, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CampaignSection() {
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    targetNumbers: "",
  });
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.whatsapp.listCampaigns.useQuery();
  
  const createMutation = trpc.whatsapp.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaña creada correctamente");
      setNewCampaign({ name: "", message: "", targetNumbers: "" });
      setOpen(false);
      utils.whatsapp.listCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear campaña");
    },
  });

  const statusMutation = trpc.whatsapp.updateCampaignStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      utils.whatsapp.listCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar estado");
    },
  });

  const addCampaign = async () => {
    if (newCampaign.name.trim() && newCampaign.message.trim() && newCampaign.targetNumbers.trim()) {
      const numbers = newCampaign.targetNumbers.split(",").map((n) => n.trim());
      await createMutation.mutateAsync({
        name: newCampaign.name,
        message: newCampaign.message,
        targetNumbers: numbers,
      });
    } else {
      toast.error("Por favor completa todos los campos");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500/20 text-green-400";
      case "sending":
        return "bg-blue-500/20 text-blue-400";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-400";
      case "draft":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "running":
        return "En ejecución";
      case "scheduled":
        return "Programada";
      case "draft":
        return "Borrador";
      case "failed":
        return "Fallida";
      default:
        return "Desconocida";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Campanas de Mensajeria</h2>
          <p className="text-muted-foreground mt-1">Crea y gestiona campanas masivas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Nueva Campana
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Campana</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre de la Campana</label>
                <Input
                  placeholder="Ej: Promocion Verano"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje aqui..."
                  value={newCampaign.message}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, message: e.target.value })
                  }
                  className="mt-1 bg-secondary border-border"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Numeros Destino (separados por coma)</label>
                <Textarea
                  placeholder="+34 123 456 789, +34 987 654 321"
                  value={newCampaign.targetNumbers}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, targetNumbers: e.target.value })
                  }
                  className="mt-1 bg-secondary border-border"
                  rows={3}
                />
              </div>
              <Button
                onClick={addCampaign}
                disabled={createMutation.isPending || !newCampaign.name.trim() || !newCampaign.message.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Campana"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Campaigns Grid */}
      <div className="grid gap-4">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card border-border p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Megaphone className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{campaign.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.targetNumbers?.length || 0} destinatarios
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => statusMutation.mutate({ campaignId: campaign.id, status: "running" })}
                  disabled={statusMutation.isPending || campaign.status === "running"}
                  className="p-2 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                  ) : (
                    <Send className="w-5 h-5 text-green-500" />
                  )}
                </motion.button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No hay campanas creadas</p>
        </motion.div>
      )}
    </div>
  );
}
