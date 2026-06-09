import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle, AlertCircle, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PhoneManagement() {
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: phones = [], isLoading } = trpc.whatsapp.listNumbers.useQuery();
  const addMutation = trpc.whatsapp.addNumber.useMutation({
    onSuccess: () => {
      toast.success("Número agregado correctamente");
      setNewPhone("");
      setNewName("");
      setOpen(false);
      utils.whatsapp.listNumbers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al agregar número");
    },
  });

  const deleteMutation = trpc.whatsapp.deleteNumber.useMutation({
    onSuccess: () => {
      toast.success("Número eliminado");
      utils.whatsapp.listNumbers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar número");
    },
  });

  const addPhone = async () => {
    if (newPhone.trim()) {
      await addMutation.mutateAsync({
        phoneNumber: newPhone,
        sessionName: newName || `Session_${Date.now()}`,
      });
    }
  };

  const deletePhone = (id: number) => {
    deleteMutation.mutate({ numberId: id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "disconnected":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      case "pending":
        return "Pendiente";
      default:
        return "Desconocido";
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
          <h2 className="text-3xl font-bold text-foreground">Gestion de Numeros</h2>
          <p className="text-muted-foreground mt-1">Administra tus numeros de WhatsApp</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Agregar Numero
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Numero</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Numero de Telefono</label>
                <Input
                  placeholder="+34 123 456 789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre (Opcional)</label>
                <Input
                  placeholder="Mi Numero Principal"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <Button
                onClick={addPhone}
                disabled={addMutation.isPending || !newPhone.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  "Agregar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Phone List */}
      <div className="grid gap-4">
        {phones.map((phone, index) => (
          <motion.div
            key={phone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card border-border p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{phone.sessionName}</h3>
                    <p className="text-sm text-muted-foreground">{phone.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`flex items-center gap-2 ${getStatusColor(phone.connectionStatus)}`}>
                      {phone.isConnected ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{getStatusLabel(phone.connectionStatus)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {phone.lastActivity ? new Date(phone.lastActivity).toLocaleDateString() : "Nunca"}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deletePhone(phone.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-500" />
                    )}
                  </motion.button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {phones.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No hay numeros agregados</p>
        </motion.div>
      )}
    </div>
  );
}
