import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PhoneNumber {
  id: string;
  number: string;
  name: string;
  status: "connected" | "disconnected" | "pending";
  lastActive: string;
}

export default function PhoneManagement() {
  const [phones, setPhones] = useState<PhoneNumber[]>([
    {
      id: "1",
      number: "+34 123 456 789",
      name: "Numero Principal",
      status: "connected",
      lastActive: "Hace 2 minutos",
    },
  ]);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const addPhone = () => {
    if (newPhone.trim()) {
      const phone: PhoneNumber = {
        id: Date.now().toString(),
        number: newPhone,
        name: newName || "Nuevo Numero",
        status: "pending",
        lastActive: "Nunca",
      };
      setPhones([...phones, phone]);
      setNewPhone("");
      setNewName("");
      setOpen(false);
    }
  };

  const deletePhone = (id: string) => {
    setPhones(phones.filter((p) => p.id !== id));
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
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Agregar
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
                    <h3 className="font-semibold text-foreground">{phone.name}</h3>
                    <p className="text-sm text-muted-foreground">{phone.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`flex items-center gap-2 ${getStatusColor(phone.status)}`}>
                      {phone.status === "connected" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{getStatusLabel(phone.status)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{phone.lastActive}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deletePhone(phone.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
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
