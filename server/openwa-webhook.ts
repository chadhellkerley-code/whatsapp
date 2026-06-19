import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { mapOpenwaStatus, sendOpenwaTextMessage } from "./_core/openwa";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";

type OpenwaWebhookEnvelope = {
  event?: string;
  sessionId?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  signature?: string;
  type?: string;
  payload?: {
    event?: string;
    sessionId?: string;
    data?: Record<string, unknown>;
  };
};

function getWebhookSecret() {
  return ENV.cookieSecret || ENV.appId || "whatsapp-manager-openwa";
}

function verifyWebhookSignature(payload: unknown, signature: unknown) {
  if (!signature || typeof signature !== "string") return true;
  const secret = getWebhookSecret();
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  const actual = signature.trim();
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function extractWebhookEvent(body: OpenwaWebhookEnvelope) {
  if ("payload" in body && body.payload) {
    return {
      event: body.payload.event ?? null,
      sessionId: body.payload.sessionId ?? null,
      data: body.payload.data ?? {},
    };
  }

  return {
    event: body.event ?? null,
    sessionId: body.sessionId ?? null,
    data: body.data ?? {},
  };
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getIncomingBody(data: Record<string, unknown>) {
  return (
    toText(data.body) ||
    toText(data.message) ||
    toText(data.text) ||
    toText(data.caption)
  );
}

function getChatId(data: Record<string, unknown>) {
  return toText(data.chatId) || toText(data.from) || toText(data.to);
}

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function keywordMatches(body: string, keywords: string[]) {
  const normalizedBody = body.toLowerCase();
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return false;
    if (normalizedKeyword === "*") return true;
    return normalizedBody.includes(normalizedKeyword);
  });
}

async function buildAutomationReply({
  userId,
  message,
}: {
  userId: number;
  message: string;
}) {
  const flows = await db.getAutomationFlows(userId);
  const matchingFlow = flows.find((flow) =>
    keywordMatches(message, normalizeKeywords(flow.triggerKeywords))
  );

  if (!matchingFlow) return null;

  if (matchingFlow.responseType === "static" && matchingFlow.staticResponse) {
    return {
      flow: matchingFlow,
      reply: matchingFlow.staticResponse,
    };
  }

  const flowSteps = Array.isArray((matchingFlow as { flowSteps?: unknown }).flowSteps)
    ? ((matchingFlow as { flowSteps?: Array<Record<string, unknown>> }).flowSteps ?? [])
    : [];

  if (matchingFlow.responseType === "flow" && flowSteps.length > 0) {
    const firstStep = flowSteps[0];
    const stepText =
      toText(firstStep?.response) ||
      toText(firstStep?.message) ||
      toText(firstStep?.text) ||
      JSON.stringify(firstStep);

    if (stepText) {
      return {
        flow: matchingFlow,
        reply: stepText,
      };
    }
  }

  const systemPrompt =
    matchingFlow.geminiPrompt ||
    `Eres un asistente de WhatsApp profesional y breve. Responde con claridad, en español, y mantén el contexto del negocio.`;

  const result = await invokeLLM({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    maxTokens: 256,
  });

  const content = result.choices[0]?.message?.content;
  const reply =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) => ("text" in part ? part.text : ""))
            .join("")
        : "";

  return reply
    ? {
        flow: matchingFlow,
        reply,
      }
    : null;
}

export function registerOpenwaWebhookRoutes(app: Express) {
  app.post("/api/webhooks/openwa", async (req: Request, res: Response) => {
    const signature =
      (req.headers["x-openwa-signature"] as string | undefined) ??
      (req.headers["x-signature"] as string | undefined);

    if (!verifyWebhookSignature(req.body, signature)) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    try {
      const { event, sessionId, data } = extractWebhookEvent(
        req.body as OpenwaWebhookEnvelope
      );

      if (!event || !sessionId) {
        res.status(200).json({ ok: true, ignored: true });
        return;
      }

      const number = await db.getWhatsappNumberBySessionIdGlobal(sessionId);
      if (!number) {
        res.status(200).json({ ok: true, ignored: true });
        return;
      }

      if (event === "session.status") {
        const status = mapOpenwaStatus(toText(data.status));
        await db.updateWhatsappNumberStatus(
          number.id,
          status === "connected",
          status
        );
        if (toText(data.phoneNumber) && !number.phoneNumber) {
          await db.updateWhatsappNumberStatus(number.id, status === "connected", status);
        }
      }

      if (event === "message.received") {
        const chatId = getChatId(data);
        const body = getIncomingBody(data);

        if (chatId && body) {
          await db.recordMessageStat(number.userId, number.phoneNumber, "incoming");
          await db.logMessage(
            number.userId,
            number.phoneNumber,
            chatId,
            body,
            "incoming",
            false
          );

          const replyPayload = await buildAutomationReply({
            userId: number.userId,
            message: body,
          });

          if (replyPayload && chatId) {
            const reply = replyPayload.reply.trim();
            if (reply) {
              await sendOpenwaTextMessage(
                number.userId,
                sessionId,
                chatId,
                reply
              );
              await db.recordMessageStat(
                number.userId,
                number.phoneNumber,
                "outgoing",
                true
              );
              await db.logMessage(
                number.userId,
                number.phoneNumber,
                chatId,
                reply,
                "outgoing",
                true,
                undefined,
                replyPayload.flow.id
              );
            }
          }
        }
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[OpenWA webhook] failed", error);
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/webhooks/openwa", (_req, res) => {
    res.status(200).json({ ok: true });
  });
}
