import { nanoid } from "nanoid";
import type { Request } from "express";
import * as db from "../db";
import { decryptSecret } from "./secrets";

export type OpenwaApiStatus =
  | "INITIALIZING"
  | "SCAN_QR"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "FAILED";

export type OpenwaSession = {
  id: string;
  name: string;
  status: OpenwaApiStatus;
  phoneNumber?: string | null;
  pushName?: string | null;
  platform?: string | null;
  connectedAt?: string | null;
  createdAt?: string;
  qr?: string | null;
};

type OpenwaConfig = {
  apiUrl: string;
  apiKey: string;
};

export type OpenwaSessionQr = {
  code: string;
  image: string;
};

type SendTextOptions = {
  quotedMessageId?: string;
  mentionedIds?: string[];
};

function normalizeBaseUrl(apiUrl: string) {
  const trimmed = apiUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function buildBaseUrl(apiUrl: string) {
  return normalizeBaseUrl(apiUrl);
}

async function getConfig(userId: number): Promise<OpenwaConfig> {
  const config = await db.getOpenwaConfig(userId);
  if (!config) {
    throw new Error(
      "OpenWA configuration is missing. Save apiUrl and apiKey first."
    );
  }

  const apiKey = decryptSecret(config.apiKey) ?? "";
  if (!apiKey) {
    throw new Error("OpenWA API key is empty or could not be decrypted");
  }

  return {
    apiUrl: buildBaseUrl(config.apiUrl),
    apiKey,
  };
}

async function openwaRequest<T>(
  userId: number,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { apiUrl, apiKey } = await getConfig(userId);
  const url = new URL(path.replace(/^\/+/, ""), `${apiUrl}/`).toString();
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-Key": apiKey,
      "X-Request-ID": nanoid(),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `OpenWA request failed (${response.status} ${response.statusText}): ${body}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listOpenwaSessions(userId: number, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return openwaRequest<OpenwaSession[]>(userId, `/sessions${query}`);
}

export async function getOpenwaSession(userId: number, sessionId: string) {
  return openwaRequest<OpenwaSession>(userId, `/sessions/${sessionId}`);
}

export async function getOpenwaSessionQr(userId: number, sessionId: string) {
  return openwaRequest<OpenwaSessionQr>(userId, `/sessions/${sessionId}/qr`);
}

export async function createOpenwaSession(
  userId: number,
  name: string,
  webhook?: {
    url: string;
    events: string[];
    secret?: string;
  }
) {
  return openwaRequest<OpenwaSession>(userId, "/sessions", {
    method: "POST",
    body: JSON.stringify({
      name,
      ...(webhook
        ? {
            webhook: {
              url: webhook.url,
              events: webhook.events,
              ...(webhook.secret ? { secret: webhook.secret } : {}),
            },
          }
        : {}),
    }),
  });
}

export async function deleteOpenwaSession(userId: number, sessionId: string) {
  return openwaRequest<{ message: string }>(userId, `/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function logoutOpenwaSession(userId: number, sessionId: string) {
  return openwaRequest<{ message: string }>(
    userId,
    `/sessions/${sessionId}/logout`,
    {
      method: "POST",
    }
  );
}

export async function registerOpenwaWebhook(
  userId: number,
  sessionId: string,
  webhook: {
    url: string;
    events?: string[];
    secret?: string;
  }
) {
  return openwaRequest<{ id: string; url: string; events: string[] }>(
    userId,
    `/sessions/${sessionId}/webhooks`,
    {
      method: "POST",
      body: JSON.stringify({
        url: webhook.url,
        events:
          webhook.events ?? [
            "message.received",
            "message.sent",
            "message.ack",
            "session.status",
          ],
        ...(webhook.secret ? { secret: webhook.secret } : {}),
      }),
    }
  );
}

export async function sendOpenwaTextMessage(
  userId: number,
  sessionId: string,
  chatId: string,
  text: string,
  options?: SendTextOptions
) {
  return openwaRequest<{
    messageId?: string;
    status?: string;
  }>(userId, `/sessions/${sessionId}/messages/send-text`, {
    method: "POST",
    body: JSON.stringify({
      chatId,
      text,
      ...(options && Object.keys(options).length > 0 ? { options } : {}),
    }),
  });
}

export function buildOpenwaWebhookUrl(req: Request) {
  const protoHeader = req.headers["x-forwarded-proto"];
  const protocol =
    typeof protoHeader === "string" && protoHeader.length > 0
      ? protoHeader.split(",")[0].trim()
      : req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host");
  if (!host) {
    return null;
  }
  return `${protocol}://${host}/api/webhooks/openwa`;
}

export function mapOpenwaStatus(status?: string | null) {
  const value = (status || "").toUpperCase();
  switch (value) {
    case "CONNECTED":
      return "connected";
    case "SCAN_QR":
    case "INITIALIZING":
    case "CONNECTING":
      return "pending";
    case "DISCONNECTED":
      return "disconnected";
    case "FAILED":
      return "error";
    default:
      return "pending";
  }
}

export async function syncNumberStatusFromSession(
  userId: number,
  numberId: number
) {
  const record = await db.getWhatsappNumberById(userId, numberId);
  if (!record) {
    throw new Error("Number not found");
  }
  if (!record.openwaSessionId) {
    return { synced: false as const, status: record.connectionStatus };
  }

  const session = await getOpenwaSession(userId, record.openwaSessionId);
  await db.updateWhatsappNumberStatus(
    record.id,
    session.status === "CONNECTED",
    mapOpenwaStatus(session.status)
  );

  return { synced: true as const, session };
}
