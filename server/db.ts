import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, openwaConfigs, whatsappNumbers, campaigns, automationFlows, messageStats, messageLog } from "../drizzle/schema";
import { ENV } from './_core/env';
import { decryptSecret, encryptSecret } from "./_core/secrets";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// OpenWA Config functions
export async function saveOpenwaConfig(userId: number, apiKey: string, apiUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(openwaConfigs).values({
    userId,
    apiKey: encryptSecret(apiKey) ?? apiKey,
    apiUrl,
  }).onDuplicateKeyUpdate({
    set: { apiKey: encryptSecret(apiKey) ?? apiKey, apiUrl, updatedAt: new Date() },
  });
}

export async function getOpenwaConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(openwaConfigs)
    .where(and(eq(openwaConfigs.userId, userId), eq(openwaConfigs.isActive, true)))
    .limit(1);

  if (result.length === 0) return undefined;
  const config = result[0];
  return {
    ...config,
    apiKey: decryptSecret(config.apiKey) ?? config.apiKey,
  };
}

// WhatsApp Numbers functions
export async function addWhatsappNumber(
  userId: number,
  phoneNumber: string,
  sessionName: string,
  openwaSessionId?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(whatsappNumbers).values({
    userId,
    phoneNumber,
    sessionName,
    openwaSessionId: openwaSessionId ?? null,
  });
}

export async function getWhatsappNumbers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(whatsappNumbers).where(eq(whatsappNumbers.userId, userId));
}

export async function getWhatsappNumberById(userId: number, numberId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(whatsappNumbers)
    .where(and(eq(whatsappNumbers.userId, userId), eq(whatsappNumbers.id, numberId)))
    .limit(1);

  return result[0];
}

export async function getWhatsappNumberBySessionId(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(whatsappNumbers)
    .where(and(eq(whatsappNumbers.userId, userId), eq(whatsappNumbers.openwaSessionId, sessionId)))
    .limit(1);

  return result[0];
}

export async function getWhatsappNumberBySessionIdGlobal(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(whatsappNumbers)
    .where(eq(whatsappNumbers.openwaSessionId, sessionId))
    .limit(1);

  return result[0];
}

export async function updateWhatsappNumberSessionId(numberId: number, openwaSessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(whatsappNumbers)
    .set({ openwaSessionId, updatedAt: new Date() })
    .where(eq(whatsappNumbers.id, numberId));
}

export async function updateWhatsappNumberStatus(numberId: number, isConnected: boolean, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(whatsappNumbers)
    .set({ isConnected, connectionStatus: status, lastActivity: new Date() })
    .where(eq(whatsappNumbers.id, numberId));
}

export async function deleteWhatsappNumber(numberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(whatsappNumbers).where(eq(whatsappNumbers.id, numberId));
}

// Campaign functions
export async function createCampaign(userId: number, name: string, message: string, targetNumbers: string[], description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(campaigns).values({
    userId,
    name,
    message,
    targetNumbers: JSON.stringify(targetNumbers),
    description,
  });
}

export async function getCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.createdAt));
}

export async function updateCampaignStatus(campaignId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(campaigns)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId));
}

export async function updateCampaignStats(campaignId: number, sentCount: number, failedCount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(campaigns)
    .set({ sentCount, failedCount, updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId));
}

// Automation Flow functions
export async function createAutomationFlow(
  userId: number,
  name: string,
  triggerKeywords: string[],
  responseType: string,
  staticResponse?: string,
  geminiApiKey?: string,
  geminiPrompt?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(automationFlows).values({
    userId,
    name,
    triggerKeywords: JSON.stringify(triggerKeywords),
    responseType: responseType as any,
    staticResponse,
    geminiApiKey: geminiApiKey ? encryptSecret(geminiApiKey) ?? geminiApiKey : undefined,
    geminiPrompt,
  });
}

export async function getAutomationFlows(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const flows = await db
    .select()
    .from(automationFlows)
    .where(
      and(
        eq(automationFlows.userId, userId),
        eq(automationFlows.isActive, true)
      )
    )
    .orderBy(desc(automationFlows.createdAt));

  return flows.map(flow => ({
    ...flow,
    geminiApiKey: flow.geminiApiKey ? (decryptSecret(flow.geminiApiKey) ?? flow.geminiApiKey) : null,
  }));
}

export async function updateAutomationFlow(flowId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedUpdates = { ...updates };
  if (typeof normalizedUpdates.geminiApiKey === "string") {
    normalizedUpdates.geminiApiKey = encryptSecret(normalizedUpdates.geminiApiKey) ?? normalizedUpdates.geminiApiKey;
  }

  return db.update(automationFlows)
    .set({ ...normalizedUpdates, updatedAt: new Date() })
    .where(eq(automationFlows.id, flowId));
}

export async function deleteAutomationFlow(flowId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(automationFlows).where(eq(automationFlows.id, flowId));
}

// Message Stats functions
export async function recordMessageStat(userId: number, phoneNumber: string, direction: 'incoming' | 'outgoing', isAutomated: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.select().from(messageStats)
    .where(and(
      eq(messageStats.userId, userId),
      eq(messageStats.phoneNumber, phoneNumber)
    )).limit(1);

  if (existing.length > 0) {
    const stat = existing[0];
    const updates: any = { totalMessages: (stat.totalMessages || 0) + 1 };
    
    if (direction === 'incoming') {
      updates.totalReceived = (stat.totalReceived || 0) + 1;
    } else {
      updates.totalSent = (stat.totalSent || 0) + 1;
    }
    
    if (isAutomated) {
      updates.automatedResponses = (stat.automatedResponses || 0) + 1;
    }

    return db.update(messageStats)
      .set(updates)
      .where(eq(messageStats.id, stat.id));
  } else {
    const newStat: any = {
      userId,
      phoneNumber,
      totalMessages: 1,
      date: today,
    };

    if (direction === 'incoming') {
      newStat.totalReceived = 1;
    } else {
      newStat.totalSent = 1;
    }

    if (isAutomated) {
      newStat.automatedResponses = 1;
    }

    return db.insert(messageStats).values(newStat);
  }
}

export async function getMessageStats(userId: number, phoneNumber?: string) {
  const db = await getDb();
  if (!db) return [];

  if (phoneNumber) {
    return db
      .select()
      .from(messageStats)
      .where(
        and(eq(messageStats.userId, userId), eq(messageStats.phoneNumber, phoneNumber))
      )
      .orderBy(desc(messageStats.date));
  }

  return db
    .select()
    .from(messageStats)
    .where(eq(messageStats.userId, userId))
    .orderBy(desc(messageStats.date));
}

// Message Log functions
export async function logMessage(
  userId: number,
  phoneNumber: string,
  contactNumber: string,
  message: string,
  direction: 'incoming' | 'outgoing',
  isAutomated: boolean = false,
  campaignId?: number,
  automationFlowId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(messageLog).values({
    userId,
    phoneNumber,
    contactNumber,
    message,
    direction,
    isAutomated,
    campaignId,
    automationFlowId,
  });
}

export async function getMessageLog(userId: number, phoneNumber?: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  if (phoneNumber) {
    return db
      .select()
      .from(messageLog)
      .where(and(eq(messageLog.userId, userId), eq(messageLog.phoneNumber, phoneNumber)))
      .orderBy(desc(messageLog.createdAt))
      .limit(limit);
  }

  return db
    .select()
    .from(messageLog)
    .where(eq(messageLog.userId, userId))
    .orderBy(desc(messageLog.createdAt))
    .limit(limit);
}
