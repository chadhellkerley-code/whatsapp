import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Zap, Trash2, Play, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  prompt: string;
  status: "active" | "inactive";
  responses: number;
}

export default function AutomationSection() {
  const [flows, setFlows] = useState<AutomationFlow[]>([
    {
      id: "1",
      name: "Respuesta Automatica Horario",
      trigger: "Mensaje recibido entre 18:00 y 09:00",
      prompt: "Responde profesionalmente que estamos fuera de horario y contactaremos manana.",
      status: "active",
      responses: 45,
    },
  ]);
  const [newFlow, setNewFlow] = useState({
    name: "",
    trigger: "",
    prompt: "",
  });
  const [geminiKey, setGeminiKey] = useState("");
  const [open, setOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);

  const addFlow = () => {
    if (newFlow.name.trim() && newFlow.prompt.trim()) {
      const flow: AutomationFlow = {
        id: Date.now().toString(),
        name: newFlow.name,
        trigger: newFlow.trigger || "Siempre",
        prompt: newFlow.prompt,
        status: "inactive",
        responses: 0,
      };
      setFlows([...flows, flow]);
      setNewFlow({ name: "", trigger: "", prompt: "" });
      setOpen(false);
    }
  };

  const toggleFlow = (id: string) => {
    setFlows(
      flows.map((f) =>
        f.id === id ? { ...f, status: f.status === "active" ? "inactive" : "active" } : f
      )
    );
  };

  const deleteFlow = (id: string) => {
    setFlows(flows.filter((f) => f.id !== id));
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
          <h2 className="text-3xl font-bold text-foreground">Automatizacion con IA</h2>
          <p className="text-muted-foreground mt-1">Configura respuestas automaticas con Gemini</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configurar API Key
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Configurar Gemini API</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API Key de Gemini</label>
                  <Input
                    type="password"
                    placeholder="Pega tu API key aqui..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Obtener API key gratis en{" "}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (geminiKey) {
                      localStorage.setItem("gemini_api_key", geminiKey);
                      setKeyOpen(false);
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Guardar API Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Flujo
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Flujo de Automatizacion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre del Flujo</label>
                  <Input
                    placeholder="Ej: Soporte Automatico"
                    value={newFlow.name}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, name: e.target.value })
                    }
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Trigger (Opcional)</label>
                  <Input
                    placeholder="Ej: Mensaje contiene 'ayuda'"
                    value={newFlow.trigger}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, trigger: e.target.value })
                    }
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prompt para Gemini</label>
                  <Textarea
                    placeholder="Define como debe responder Gemini..."
                    value={newFlow.prompt}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, prompt: e.target.value })
                    }
                    className="mt-1 bg-secondary border-border"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={addFlow}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Crear Flujo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Flows List */}
      <div className="grid gap-4">
        {flows.map((flow, index) => (
          <motion.div
            key={flow.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card border-border p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">{flow.name}</h3>
                    <Badge
                      className={`${
                        flow.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {flow.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Trigger:</strong> {flow.trigger}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Prompt:</strong> {flow.prompt.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {flow.responses} respuestas generadas
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFlow(flow.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      flow.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "hover:bg-green-500/10 text-muted-foreground"
                    }`}
                  >
                    <Play className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteFlow(flow.id)}
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

      {flows.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No hay flujos de automatizacion</p>
        </motion.div>
      )}
    </div>
  );
}
