import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIChatBox } from "@/components/AIChatBox";
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
  const [model, setModel] = useState<string>("default");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "system" | "user" | "assistant"; content: string }>
  >([
    {
      role: "system",
      content:
        "Eres el asistente de WhatsApp Pro. Responde en español, de forma breve y útil.",
    },
  ]);

  const utils = trpc.useUtils();
  const { data: flows = [], isLoading } = trpc.whatsapp.listAutomationFlows.useQuery();
  const { data: models } = trpc.ai.models.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const availableModels = useMemo(() => models?.data ?? [], [models]);

  const createMutation = trpc.whatsapp.createAutomationFlow.useMutation({
    onSuccess: async () => {
      toast.success("Flujo de automatización creado");
      setNewFlow({
        name: "",
        triggerKeywords: "",
        responseType: "static",
        staticResponse: "",
        geminiPrompt: "",
      });
      setOpen(false);
      await utils.whatsapp.listAutomationFlows.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear flujo");
    },
  });

  const deleteMutation = trpc.whatsapp.deleteAutomationFlow.useMutation({
    onSuccess: async () => {
      toast.success("Flujo eliminado");
      await utils.whatsapp.listAutomationFlows.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar flujo");
    },
  });

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.text || "Sin respuesta" },
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Error al consultar la IA");
    },
  });

  const addFlow = async () => {
    if (!newFlow.name.trim() || !newFlow.triggerKeywords.trim()) {
      toast.error("Completa nombre y keywords");
      return;
    }

    await createMutation.mutateAsync({
      name: newFlow.name.trim(),
      triggerKeywords: newFlow.triggerKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      responseType: newFlow.responseType,
      staticResponse: newFlow.staticResponse || undefined,
      geminiPrompt: newFlow.geminiPrompt || undefined,
    });
  };

  const handleChatSend = (content: string) => {
    const nextMessages = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(nextMessages);
    chatMutation.mutate({
      messages: nextMessages.filter((message) => message.role !== "system"),
      model: model === "default" ? undefined : model,
      systemPrompt: chatMessages[0]?.content,
      maxTokens: 512,
    });
  };

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
            Automatización con IA
          </h2>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Los flujos guardados responden a eventos entrantes. El chat de prueba
            usa el backend LLM conectado por `BUILT_IN_FORGE_API_URL` y
            `BUILT_IN_FORGE_API_KEY`.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Button className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
                <Plus className="h-4 w-4" />
                Nuevo flujo
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-border bg-card">
            <DialogHeader>
              <DialogTitle>Crear flujo de automatización</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del flujo</label>
                <Input
                  placeholder="Soporte automático"
                  value={newFlow.name}
                  onChange={(e) =>
                    setNewFlow({ ...newFlow, name: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Keywords</label>
                <Input
                  placeholder="hola, ayuda, soporte"
                  value={newFlow.triggerKeywords}
                  onChange={(e) =>
                    setNewFlow({ ...newFlow, triggerKeywords: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Tipo de respuesta</label>
                <Select
                  value={newFlow.responseType}
                  onValueChange={(value) =>
                    setNewFlow({
                      ...newFlow,
                      responseType: value as "static" | "gemini" | "flow",
                    })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Respuesta estática</SelectItem>
                    <SelectItem value="gemini">IA / LLM</SelectItem>
                    <SelectItem value="flow">Flujo multi-paso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newFlow.responseType === "static" && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Mensaje estático</label>
                  <Textarea
                    placeholder="Hola, ¿en qué puedo ayudarte?"
                    value={newFlow.staticResponse}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, staticResponse: e.target.value })
                    }
                    className="bg-secondary border-border"
                    rows={4}
                  />
                </div>
              )}
              {newFlow.responseType === "gemini" && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Prompt de IA</label>
                  <Textarea
                    placeholder="Eres un asistente de atención amable y directo..."
                    value={newFlow.geminiPrompt}
                    onChange={(e) =>
                      setNewFlow({ ...newFlow, geminiPrompt: e.target.value })
                    }
                    className="bg-secondary border-border"
                    rows={4}
                  />
                </div>
              )}
              <Button
                onClick={addFlow}
                disabled={createMutation.isPending}
                className="md:col-span-2 bg-emerald-500 text-black hover:bg-emerald-400"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear flujo"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1fr_.95fr]">
        <div className="space-y-4">
          {flows.map((flow, index) => (
            <motion.div
              key={flow.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Zap className="h-5 w-5 text-emerald-400" />
                      <h3 className="font-semibold text-foreground">
                        {flow.name}
                      </h3>
                      <Badge className="bg-emerald-500/15 text-emerald-300">
                        {flow.responseType}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Keywords: {flow.triggerKeywords?.join(", ") || "Ninguna"}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteMutation.mutate({ flowId: flow.id })}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}

          {flows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center text-muted-foreground">
              No hay flujos creados todavía.
            </div>
          )}
        </div>

        <Card className="border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <Bot className="h-3.5 w-3.5" />
                IA conectada
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Probar respuesta IA
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta tarjeta usa el modelo del backend para validar prompts y ver
                cómo responderá el flujo.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Modelo</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Modelo por defecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Modelo por defecto</SelectItem>
                {availableModels.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AIChatBox
            messages={chatMessages}
            onSendMessage={handleChatSend}
            isLoading={chatMutation.isPending}
            placeholder="Escribe una consulta para probar la IA..."
            height="540px"
            emptyStateMessage="Envía un mensaje para probar el modelo conectado"
            suggestedPrompts={[
              "Escribe una respuesta corta y profesional para un cliente que pregunta por precios.",
              "Resume en 3 bullets qué hace este producto.",
              "Redacta un saludo de soporte de WhatsApp.",
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
