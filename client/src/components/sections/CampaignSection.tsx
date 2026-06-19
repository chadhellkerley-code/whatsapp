import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  Megaphone,
  Play,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300";
    case "running":
      return "bg-blue-500/15 text-blue-300";
    case "scheduled":
      return "bg-amber-500/15 text-amber-300";
    case "failed":
      return "bg-red-500/15 text-red-300";
    default:
      return "bg-slate-500/15 text-slate-300";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completada";
    case "running":
      return "En ejecución";
    case "scheduled":
      return "Programada";
    case "failed":
      return "Fallida";
    default:
      return "Borrador";
  }
}

export default function CampaignSection() {
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    targetNumbers: "",
    description: "",
    numberId: "",
  });
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.whatsapp.listCampaigns.useQuery();
  const { data: phoneAccounts = [] } = trpc.whatsapp.listNumbers.useQuery();

  const createMutation = trpc.whatsapp.createCampaign.useMutation({
    onSuccess: async () => {
      toast.success("Campaña creada");
      setNewCampaign({
        name: "",
        message: "",
        targetNumbers: "",
        description: "",
        numberId: "",
      });
      setOpen(false);
      await utils.whatsapp.listCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear campaña");
    },
  });

  const runMutation = trpc.whatsapp.sendCampaign.useMutation({
    onSuccess: async (result) => {
      toast.success(
        `Campaña ejecutada. Enviados: ${result.sentCount}, fallidos: ${result.failedCount}`
      );
      await utils.whatsapp.listCampaigns.invalidate();
      await utils.whatsapp.getDashboardStats.invalidate();
      await utils.whatsapp.getMessageLog.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al enviar campaña");
    },
  });

  const statusMutation = trpc.whatsapp.updateCampaignStatus.useMutation({
    onSuccess: async () => {
      toast.success("Estado actualizado");
      await utils.whatsapp.listCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar estado");
    },
  });

  const addCampaign = async () => {
    if (
      !newCampaign.name.trim() ||
      !newCampaign.message.trim() ||
      !newCampaign.targetNumbers.trim()
    ) {
      toast.error("Completa nombre, mensaje y números");
      return;
    }

    await createMutation.mutateAsync({
      name: newCampaign.name.trim(),
      message: newCampaign.message.trim(),
      targetNumbers: newCampaign.targetNumbers
        .split(",")
        .map((number) => number.trim())
        .filter(Boolean),
      description: newCampaign.description.trim() || undefined,
    });
  };

  const selectedNumberId = newCampaign.numberId ? Number(newCampaign.numberId) : undefined;

  if (isLoading) {
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
          <h2 className="text-3xl font-bold text-foreground">
            Campañas de mensajería
          </h2>
          <p className="mt-1 text-muted-foreground">
            Crea una campaña y envíala desde una cuenta OpenWA conectada.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Button className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
                <Plus className="h-4 w-4" />
                Nueva campaña
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-border bg-card">
            <DialogHeader>
              <DialogTitle>Crear nueva campaña</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  placeholder="Promoción junio"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuenta de envío</label>
                <Select
                  value={newCampaign.numberId}
                  onValueChange={(value) =>
                    setNewCampaign({ ...newCampaign, numberId: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneAccounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.sessionName} - {account.phoneNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje aquí..."
                  value={newCampaign.message}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, message: e.target.value })
                  }
                  className="bg-secondary border-border"
                  rows={4}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">
                  Números destino (separados por coma)
                </label>
                <Textarea
                  placeholder="+34 123 456 789, +34 987 654 321"
                  value={newCampaign.targetNumbers}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      targetNumbers: e.target.value,
                    })
                  }
                  className="bg-secondary border-border"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  placeholder="Opcional"
                  value={newCampaign.description}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      description: e.target.value,
                    })
                  }
                  className="bg-secondary border-border"
                  rows={2}
                />
              </div>
              <Button
                onClick={addCampaign}
                disabled={createMutation.isPending}
                className="md:col-span-2 bg-emerald-500 text-black hover:bg-emerald-400"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear campaña"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid gap-4">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border bg-card p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Megaphone className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {campaign.name}
                    </h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        campaign.status
                      )}`}
                    >
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {campaign.description || campaign.message}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-3 py-1">
                      {campaign.targetNumbers?.length || 0} destinatarios
                    </span>
                    <span className="rounded-full border border-border px-3 py-1">
                      Enviados: {campaign.sentCount} / Fallidos: {campaign.failedCount}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      runMutation.mutate({
                        campaignId: campaign.id,
                        numberId: selectedNumberId,
                      })
                    }
                    disabled={runMutation.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Enviar ahora
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      statusMutation.mutate({
                        campaignId: campaign.id,
                        status: "running",
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Marcar activa
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center"
        >
          <Megaphone className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No hay campañas creadas todavía.</p>
        </motion.div>
      )}
    </div>
  );
}
