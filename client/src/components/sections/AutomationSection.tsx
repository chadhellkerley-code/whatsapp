import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Zap, Trash2, Play, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AutomationSection() {
  const [newFlow, setNewFlow] = useState({
    name: "",
    triggerKeywords: "",
    responseType: "static" as "static" | "gemini" | "flow",
    staticResponse: "",
    geminiPrompt: "",
  });
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: flows = [], isLoading } = trpc.whatsapp.listAutomationFlows.useQuery();
  
  const createMutation = trpc.whatsapp.createAutomationFlow.useMutation({
    onSuccess: () => {
      toast.success("Flujo de automatización creado");
      setNewFlow({
        name: "",
        triggerKeywords: "",
        responseType: "static",
        staticResponse: "",
        geminiPrompt: "",
      });
      setOpen(false);
      utils.whatsapp.listAutomationFlows.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear flujo");
    },
  });

  const deleteMutation = trpc.whatsapp.deleteAutomationFlow?.useMutation?.({
    onSuccess: () => {
      toast.success("Flujo eliminado");
      utils.whatsapp.listAutomationFlows.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar flujo");
    },
  });

  const addFlow = async () => {
    if (newFlow.name.trim() && newFlow.triggerKeywords.trim()) {
      const keywords = newFlow.triggerKeywords.split(",").map((k) => k.trim());
      await createMutation.mutateAsync({
        name: newFlow.name,
        triggerKeywords: keywords,
        responseType: newFlow.responseType,
        staticResponse: newFlow.staticResponse || undefined,
        geminiPrompt: newFlow.geminiPrompt || undefined,
      });
    } else {
      toast.error("Por favor completa todos los campos requeridos");
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
          <h2 className="text-3xl font-bold text-foreground">Automatizacion con IA</h2>
          <p className="text-muted-foreground mt-1">Configura respuestas automaticas con Gemini</p>
        </div>
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
                <label className="text-sm font-medium">Keywords (separadas por coma)</label>
                <Input
                  placeholder="ayuda, soporte, consulta"
                  value={newFlow.triggerKeywords}
                  onChange={(e) =>
                    setNewFlow({ ...newFlow, triggerKeywords: e.target.value })
                  }
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Respuesta</label>
                <select
                  value={newFlow.responseType}
                  onChange={(e) =>
                    setNewFlow({ 
                      ...newFlow, 
                      responseType: e.target.value as "static" | "gemini" | "flow"
                    })
                  }
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-sm"
                >
                  <option value="static">Respuesta Estática</option>
                  <option value="gemini">Gemini IA</option>
                  <option value="flow">Flujo Personalizado</option>
                </select>
              </div>
              {newFlow.responseType === "static" && (
                <div>
                  <label className="text-sm font-medium">Mensaje Estatico</label>
                  <Textarea
                    placeholder="Escribe la respuesta automatica..."
                    value={newFlow.staticResponse}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, staticResponse: e.target.value })
                    }
                    className="mt-1 bg-secondary border-border"
                    rows={3}
                  />
                </div>
              )}
              {newFlow.responseType === "gemini" && (
                <div>
                  <label className="text-sm font-medium">Prompt para Gemini</label>
                  <Textarea
                    placeholder="Define como debe responder Gemini..."
                    value={newFlow.geminiPrompt}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, geminiPrompt: e.target.value })
                    }
                    className="mt-1 bg-secondary border-border"
                    rows={3}
                  />
                </div>
              )}
              <Button
                onClick={addFlow}
                disabled={createMutation.isPending || !newFlow.name.trim() || !newFlow.triggerKeywords.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Flujo"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <>
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
                            flow.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {flow.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Keywords:</strong> {flow.triggerKeywords?.join(", ") || "Ninguno"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Tipo:</strong> {flow.responseType}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteMutation?.mutate?.({ flowId: flow.id })}
                      disabled={deleteMutation?.isPending}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleteMutation?.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-500" />
                      )}
                    </motion.button>
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
        </>
      )}
    </div>
  );
}
