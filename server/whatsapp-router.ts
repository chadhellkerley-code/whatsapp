import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  buildOpenwaWebhookUrl,
  createOpenwaSession,
  deleteOpenwaSession,
  getOpenwaSession,
  getOpenwaSessionQr,
  listOpenwaSessions,
  logoutOpenwaSession,
  mapOpenwaStatus,
  sendOpenwaTextMessage,
  syncNumberStatusFromSession,
} from "./_core/openwa";
import { ENV } from "./_core/env";

const numberInput = z.object({
  phoneNumber: z.string().min(1),
  sessionName: z.string().min(1),
});

function normalizePhoneToChatId(phoneNumber: string) {
  const clean = phoneNumber.trim();
  if (!clean) return "";
  if (clean.endsWith("@c.us") || clean.endsWith("@g.us")) {
    return clean;
  }
  const digits = clean.replace(/[^\d]/g, "");
  return `${digits}@c.us`;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item : ""))
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

async function resolveSessionIdForNumber(number: Awaited<
  ReturnType<typeof db.getWhatsappNumberById>
>) {
  if (!number) return null;
  if (number.openwaSessionId) return number.openwaSessionId;

  const sessions = await listOpenwaSessions(number.userId);
  const matched = sessions.find((session) => session.name === number.sessionName);
  return matched?.id ?? null;
}

async function ensureNumberSessionId(
  userId: number,
  numberId: number
) {
  const number = await db.getWhatsappNumberById(userId, numberId);
  if (!number) {
    throw new Error("Número no encontrado");
  }

  const sessionId = await resolveSessionIdForNumber(number);
  if (!sessionId) {
    throw new Error(
      `No existe una sesión OpenWA para "${number.sessionName}". Vuelve a conectar la cuenta.`
    );
  }

  if (number.openwaSessionId !== sessionId) {
    await db.updateWhatsappNumberSessionId(number.id, sessionId);
  }

  return { number, sessionId };
}

async function getPreferredSessionId(userId: number, numberId?: number) {
  if (numberId) {
    const { sessionId } = await ensureNumberSessionId(userId, numberId);
    return sessionId;
  }

  const numbers = await db.getWhatsappNumbers(userId);
  const connected = numbers.find((item) => item.openwaSessionId || item.isConnected);
  if (!connected) {
    throw new Error("No hay cuentas de WhatsApp conectadas");
  }

  const sessionId = await resolveSessionIdForNumber(connected);
  if (!sessionId) {
    throw new Error("No se pudo resolver la sesión OpenWA para enviar mensajes");
  }

  if (connected.openwaSessionId !== sessionId) {
    await db.updateWhatsappNumberSessionId(connected.id, sessionId);
  }

  return sessionId;
}

export const whatsappRouter = router({
  // OpenWA Configuration
  saveOpenwaConfig: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        apiUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.saveOpenwaConfig(ctx.user.id, input.apiKey, input.apiUrl);
      return { success: true } as const;
    }),

  getOpenwaConfig: protectedProcedure.query(async ({ ctx }) => {
    const config = await db.getOpenwaConfig(ctx.user.id);
    if (!config) return null;
    return {
      id: config.id,
      userId: config.userId,
      apiUrl: config.apiUrl,
      hasApiKey: Boolean(config.apiKey),
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }),

  listOpenwaSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await listOpenwaSessions(ctx.user.id);
    const numbers = await db.getWhatsappNumbers(ctx.user.id);
    const bySessionName = new Map(numbers.map((item) => [item.sessionName, item]));
    const bySessionId = new Map(
      numbers.filter((item) => item.openwaSessionId).map((item) => [item.openwaSessionId as string, item])
    );

    return sessions.map((session) => {
      const local =
        bySessionId.get(session.id) || bySessionName.get(session.name) || null;

      return {
        ...session,
        localNumberId: local?.id ?? null,
        localPhoneNumber: local?.phoneNumber ?? null,
        localSessionName: local?.sessionName ?? session.name,
        localStatus: local?.connectionStatus ?? mapOpenwaStatus(session.status),
      };
    });
  }),

  createOpenwaSession: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        sessionName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const webhookUrl = buildOpenwaWebhookUrl(ctx.req);
      const webhookSecret = ENV.cookieSecret || ENV.appId || "whatsapp-manager-openwa";

      const session = await createOpenwaSession(
        ctx.user.id,
        input.sessionName,
        webhookUrl
          ? {
              url: webhookUrl,
              events: ["message.received", "message.sent", "message.ack", "session.status"],
              secret: webhookSecret,
            }
          : undefined
      );

      await db.addWhatsappNumber(
        ctx.user.id,
        input.phoneNumber,
        input.sessionName,
        session.id
      );

      return { success: true, session } as const;
    }),

  getNumberSession: protectedProcedure
    .input(z.object({ numberId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const number = await db.getWhatsappNumberById(ctx.user.id, input.numberId);
      if (!number) {
        throw new Error("Número no encontrado");
      }

      const sessionId = await resolveSessionIdForNumber(number);
      if (!sessionId) return null;

      const [session, qr] = await Promise.all([
        getOpenwaSession(ctx.user.id, sessionId).catch(() => null),
        getOpenwaSessionQr(ctx.user.id, sessionId).catch(() => null),
      ]);

      return {
        number,
        session,
        qr,
      };
    }),

  refreshNumberStatus: protectedProcedure
    .input(z.object({ numberId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const result = await syncNumberStatusFromSession(ctx.user.id, input.numberId);
      return result;
    }),

  // WhatsApp Numbers Management
  addNumber: protectedProcedure
    .input(numberInput)
    .mutation(async ({ ctx, input }) => {
      const webhookUrl = buildOpenwaWebhookUrl(ctx.req);
      const webhookSecret = ENV.cookieSecret || ENV.appId || "whatsapp-manager-openwa";
      const session = await createOpenwaSession(
        ctx.user.id,
        input.sessionName,
        webhookUrl
          ? {
              url: webhookUrl,
              events: ["message.received", "message.sent", "message.ack", "session.status"],
              secret: webhookSecret,
            }
          : undefined
      );

      await db.addWhatsappNumber(
        ctx.user.id,
        input.phoneNumber,
        input.sessionName,
        session.id
      );

      return {
        success: true,
        message: "Número agregado correctamente",
        session,
      } as const;
    }),

  listNumbers: protectedProcedure.query(async ({ ctx }) => {
    const numbers = await db.getWhatsappNumbers(ctx.user.id);
    return numbers.map((n) => ({
      id: n.id,
      phoneNumber: n.phoneNumber,
      sessionName: n.sessionName,
      openwaSessionId: n.openwaSessionId,
      isConnected: n.isConnected,
      connectionStatus: n.connectionStatus,
      lastActivity: n.lastActivity,
      createdAt: n.createdAt,
    }));
  }),

  updateNumberStatus: protectedProcedure
    .input(
      z.object({
        numberId: z.number().int().positive(),
        isConnected: z.boolean(),
        status: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const number = await db.getWhatsappNumberById(ctx.user.id, input.numberId);
      if (!number) {
        throw new Error("Número no encontrado");
      }

      await db.updateWhatsappNumberStatus(
        number.id,
        input.isConnected,
        input.status
      );
      return { success: true } as const;
    }),

  deleteNumber: protectedProcedure
    .input(z.object({ numberId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const number = await db.getWhatsappNumberById(ctx.user.id, input.numberId);
      if (!number) {
        throw new Error("Número no encontrado");
      }

      const sessionId = await resolveSessionIdForNumber(number);
      if (sessionId) {
        try {
          await logoutOpenwaSession(ctx.user.id, sessionId);
        } catch (error) {
          console.warn("[OpenWA] logout failed, trying delete:", error);
        }
        try {
          await deleteOpenwaSession(ctx.user.id, sessionId);
        } catch (error) {
          console.warn("[OpenWA] delete session failed:", error);
        }
      }

      await db.deleteWhatsappNumber(number.id);
      return { success: true } as const;
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        numberId: z.number().int().positive().optional(),
        chatId: z.string().min(1),
        message: z.string().min(1),
        quotedMessageId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await getPreferredSessionId(ctx.user.id, input.numberId);
      const targetChatId = normalizePhoneToChatId(input.chatId);
      const result = await sendOpenwaTextMessage(
        ctx.user.id,
        sessionId,
        targetChatId,
        input.message,
        input.quotedMessageId
          ? { quotedMessageId: input.quotedMessageId }
          : undefined
      );

      const number = input.numberId
        ? await db.getWhatsappNumberById(ctx.user.id, input.numberId)
        : await db.getWhatsappNumbers(ctx.user.id).then((items) => items.find((item) => item.openwaSessionId === sessionId) ?? items[0]);

      if (number) {
        await db.recordMessageStat(number.userId, number.phoneNumber, "outgoing");
        await db.logMessage(
          number.userId,
          number.phoneNumber,
          targetChatId,
          input.message,
          "outgoing",
          false
        );
        await db.updateWhatsappNumberStatus(number.id, true, "connected");
      }

      return {
        success: true,
        result,
      } as const;
    }),

  // Campaigns
  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        message: z.string().min(1),
        targetNumbers: z.array(z.string()).min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.createCampaign(
        ctx.user.id,
        input.name,
        input.message,
        input.targetNumbers,
        input.description
      );
      return { success: true, message: "Campaña creada correctamente" } as const;
    }),

  listCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await db.getCampaigns(ctx.user.id);
    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      message: c.message,
      description: c.description,
      status: c.status,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      targetNumbers: parseJsonArray(c.targetNumbers),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
    }));
  }),

  updateCampaignStatus: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        status: z.enum(["draft", "scheduled", "running", "completed", "failed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await db.getCampaigns(ctx.user.id).then((items) =>
        items.find((item) => item.id === input.campaignId)
      );
      if (!campaign) {
        throw new Error("Campaña no encontrada");
      }

      await db.updateCampaignStatus(input.campaignId, input.status);
      return { success: true } as const;
    }),

  sendCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        numberId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await db.getCampaigns(ctx.user.id).then((items) =>
        items.find((item) => item.id === input.campaignId)
      );
      if (!campaign) {
        throw new Error("Campaña no encontrada");
      }

      const sessionId = await getPreferredSessionId(ctx.user.id, input.numberId);
      const targets = parseJsonArray(campaign.targetNumbers);
      let sentCount = 0;
      let failedCount = 0;

      await db.updateCampaignStatus(campaign.id, "running");

      for (const number of targets) {
        const chatId = normalizePhoneToChatId(number);
        try {
          await sendOpenwaTextMessage(
            ctx.user.id,
            sessionId,
            chatId,
            campaign.message
          );
          sentCount += 1;
          await db.recordMessageStat(ctx.user.id, number, "outgoing");
          await db.logMessage(
            ctx.user.id,
            number,
            chatId,
            campaign.message,
            "outgoing",
            false,
            campaign.id
          );
        } catch (error) {
          failedCount += 1;
          console.error("[Campaign] message failed", error);
        }
      }

      await db.updateCampaignStats(campaign.id, sentCount, failedCount);
      await db.updateCampaignStatus(
        campaign.id,
        failedCount > 0 && sentCount === 0 ? "failed" : "completed"
      );

      return {
        success: true,
        sentCount,
        failedCount,
      } as const;
    }),

  // Automation Flows
  createAutomationFlow: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        triggerKeywords: z.array(z.string()).min(1),
        responseType: z.enum(["static", "gemini", "flow"]),
        staticResponse: z.string().optional(),
        geminiApiKey: z.string().optional(),
        geminiPrompt: z.string().optional(),
        flowSteps: z.array(z.record(z.string(), z.unknown())).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.createAutomationFlow(
        ctx.user.id,
        input.name,
        input.triggerKeywords,
        input.responseType,
        input.staticResponse,
        input.geminiApiKey,
        input.geminiPrompt
      );
      if (input.flowSteps) {
        const latest = await db.getAutomationFlows(ctx.user.id);
        const created = latest.find((item) => item.name === input.name);
        if (created) {
          await db.updateAutomationFlow(created.id, {
            flowSteps: input.flowSteps,
          });
        }
      }
      return { success: true, message: "Flujo de automatización creado" } as const;
    }),

  listAutomationFlows: protectedProcedure.query(async ({ ctx }) => {
    const flows = await db.getAutomationFlows(ctx.user.id);
    return flows.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      responseType: f.responseType,
      triggerKeywords: parseJsonArray(f.triggerKeywords),
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }),

  deleteAutomationFlow: protectedProcedure
    .input(z.object({ flowId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const flow = await db.getAutomationFlows(ctx.user.id).then((items) =>
        items.find((item) => item.id === input.flowId)
      );
      if (!flow) {
        throw new Error("Flow not found");
      }

      await db.deleteAutomationFlow(flow.id);
      return { success: true } as const;
    }),

  // Message Statistics
  getMessageStats: protectedProcedure
    .input(z.object({ phoneNumber: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const stats = await db.getMessageStats(ctx.user.id, input.phoneNumber);
      return stats.map((s) => ({
        phoneNumber: s.phoneNumber,
        totalMessages: s.totalMessages,
        totalReceived: s.totalReceived,
        totalSent: s.totalSent,
        automatedResponses: s.automatedResponses,
        date: s.date,
      }));
    }),

  // Message Log
  getMessageLog: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().optional(),
        limit: z.number().int().positive().max(500).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await db.getMessageLog(
        ctx.user.id,
        input.phoneNumber,
        input.limit
      );
      return logs.map((l) => ({
        id: l.id,
        phoneNumber: l.phoneNumber,
        contactNumber: l.contactNumber,
        message: l.message,
        direction: l.direction,
        isAutomated: l.isAutomated,
        campaignId: l.campaignId,
        automationFlowId: l.automationFlowId,
        createdAt: l.createdAt,
      }));
    }),

  // Dashboard Stats
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const numbers = await db.getWhatsappNumbers(ctx.user.id);
    const campaigns = await db.getCampaigns(ctx.user.id);
    const flows = await db.getAutomationFlows(ctx.user.id);
    const stats = await db.getMessageStats(ctx.user.id);

    const totalMessages = stats.reduce((sum, s) => sum + (s.totalMessages || 0), 0);
    const totalSent = stats.reduce((sum, s) => sum + (s.totalSent || 0), 0);
    const totalReceived = stats.reduce((sum, s) => sum + (s.totalReceived || 0), 0);
    const automatedResponses = stats.reduce(
      (sum, s) => sum + (s.automatedResponses || 0),
      0
    );

    return {
      connectedNumbers: numbers.filter((n) => n.isConnected).length,
      totalNumbers: numbers.length,
      activeCampaigns: campaigns.filter((c) => c.status === "running").length,
      totalCampaigns: campaigns.length,
      activeFlows: flows.filter((f) => f.isActive).length,
      totalMessages,
      totalSent,
      totalReceived,
      automatedResponses,
      lastUpdatedAt: new Date(),
    };
  }),
});
