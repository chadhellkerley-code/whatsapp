import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Copy,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function statusTone(status: string) {
  switch (status) {
    case "connected":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
    case "pending":
      return "bg-amber-500/15 text-amber-300 border-amber-500/20";
    case "error":
      return "bg-red-500/15 text-red-300 border-red-500/20";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/20";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "connected":
      return "Conectado";
    case "pending":
      return "Pendiente";
    case "error":
      return "Error";
    default:
      return "Desconectado";
  }
}

function QrPreview({ numberId }: { numberId: number }) {
  const { data, isLoading, error, refetch } = trpc.whatsapp.getNumberSession.useQuery(
    { numberId },
    { retry: false, refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card/40 p-6">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !data?.qr?.image) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
        QR no disponible todavía. Vuelve a sincronizar la sesión.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <img
        src={data.qr.image}
        alt="OpenWA QR"
        className="w-full rounded-2xl border border-border bg-white p-3"
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar QR
        </Button>
        <span className="text-xs text-muted-foreground">
          Escanea el código para conectar la cuenta.
        </span>
      </div>
    </div>
  );
}

export default function PhoneManagement() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [openQrFor, setOpenQrFor] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const utils = trpc.useUtils();
  const { data: config } = trpc.whatsapp.getOpenwaConfig.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: phones = [], isLoading } = trpc.whatsapp.listNumbers.useQuery();

  useEffect(() => {
    if (config?.apiUrl) {
      setApiUrl(config.apiUrl);
    }
  }, [config?.apiUrl]);

  const saveConfigMutation = trpc.whatsapp.saveOpenwaConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuración OpenWA guardada");
      setApiKey("");
      utils.whatsapp.getOpenwaConfig.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar configuración");
    },
  });

  const addMutation = trpc.whatsapp.addNumber.useMutation({
    onSuccess: async () => {
      toast.success("Cuenta de WhatsApp conectada");
      setNewPhone("");
      setNewName("");
      await utils.whatsapp.listNumbers.invalidate();
      await utils.whatsapp.listOpenwaSessions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al conectar la cuenta");
    },
  });

  const deleteMutation = trpc.whatsapp.deleteNumber.useMutation({
    onSuccess: async () => {
      toast.success("Cuenta eliminada");
      setOpenQrFor(null);
      await utils.whatsapp.listNumbers.invalidate();
      await utils.whatsapp.listOpenwaSessions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar la cuenta");
    },
  });

  const syncMutation = trpc.whatsapp.refreshNumberStatus.useMutation({
    onSuccess: async () => {
      toast.success("Estado sincronizado");
      await utils.whatsapp.listNumbers.invalidate();
      await utils.whatsapp.listOpenwaSessions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo sincronizar");
    },
  });

  const copyApiUrl = async () => {
    if (!apiUrl) return;
    await navigator.clipboard.writeText(apiUrl);
    toast.success("URL copiada");
  };

  const connectAccount = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      toast.error("Completa la URL y la API key de OpenWA");
      return;
    }

    await saveConfigMutation.mutateAsync({
      apiUrl: apiUrl.trim(),
      apiKey: apiKey.trim(),
    });
  };

  const addPhone = async () => {
    if (!newPhone.trim() || !newName.trim()) {
      toast.error("Completa el teléfono y el nombre de sesión");
      return;
    }

    await addMutation.mutateAsync({
      phoneNumber: newPhone.trim(),
      sessionName: newName.trim(),
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
        className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]"
      >
        <Card className="border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Conexión OpenWA
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Cuentas de WhatsApp
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Aquí se agregan y eliminan las cuentas. La app guarda la URL de
                OpenWA y la API key cifrada en la base de datos; luego crea la
                sesión, registra el webhook y sincroniza estado, QR y mensajes.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground md:block">
              OpenWA REST
              <div className="mt-1 font-mono text-[11px] text-foreground">
                POST /api/sessions
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenWA API URL</label>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://tu-openwa.com"
                className="bg-secondary border-border"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyApiUrl} disabled={!apiUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar URL
                </Button>
                <span className="text-xs text-muted-foreground">
                  Se normaliza a `/api` automáticamente.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">OpenWA API Key</label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type={showSecret ? "text" : "password"}
                placeholder="X-API-Key"
                className="bg-secondary border-border"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecret((prev) => !prev)}
                >
                  {showSecret ? "Ocultar" : "Mostrar"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Se cifra antes de guardar.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={connectAccount}
              disabled={saveConfigMutation.isPending}
              className="bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar configuración
            </Button>
            <div className="text-sm text-muted-foreground">
              {config?.hasApiKey ? (
                <span className="text-emerald-300">API conectada</span>
              ) : (
                "Configura la API para crear sesiones"
              )}
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Agregar cuenta
              </h3>
              <p className="text-sm text-muted-foreground">
                Crea una sesión real en OpenWA y guarda su `sessionId`.
              </p>
            </div>
            <Plus className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Teléfono / etiqueta</label>
              <Input
                placeholder="+34 123 456 789"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nombre de sesión</label>
              <Input
                placeholder="mi-cuenta-principal"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <Button
              onClick={addPhone}
              disabled={addMutation.isPending}
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar cuenta"
              )}
            </Button>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-4">
        {phones.map((phone, index) => (
          <motion.div
            key={phone.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card className="border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {phone.sessionName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {phone.phoneNumber}
                      </p>
                    </div>
                    <Badge className={`border ${statusTone(phone.connectionStatus)}`}>
                      {statusLabel(phone.connectionStatus)}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-3 py-1">
                      SessionId: {phone.openwaSessionId || "pendiente"}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1">
                      Última actividad:{" "}
                      {phone.lastActivity
                        ? new Date(phone.lastActivity).toLocaleString()
                        : "Nunca"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncMutation.mutate({ numberId: phone.id })}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOpenQrFor((prev) => (prev === phone.id ? null : phone.id))
                    }
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    QR
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ numberId: phone.id })}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </div>

              {openQrFor === phone.id ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-[320px_1fr]">
                  <QrPreview numberId={phone.id} />
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                    <div className="mb-2 flex items-center gap-2 text-foreground">
                      <ExternalLink className="h-4 w-4 text-emerald-400" />
                      Flujo de conexión
                    </div>
                    <ol className="space-y-2">
                      <li>1. OpenWA crea la sesión con el `sessionName`.</li>
                      <li>2. El webhook se registra en `/api/webhooks/openwa`.</li>
                      <li>3. Escanea el QR desde esta tarjeta.</li>
                      <li>4. El webhook actualiza estado, logs y automatizaciones.</li>
                    </ol>
                  </div>
                </div>
              ) : null}
            </Card>
          </motion.div>
        ))}
      </div>

      {phones.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center"
        >
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No hay cuentas agregadas todavía. Conecta la API de OpenWA y crea la
            primera sesión.
          </p>
        </motion.div>
      )}
    </div>
  );
}
