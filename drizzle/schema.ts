import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// WhatsApp Manager Tables

export const openwaConfigs = mysqlTable("openwa_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  apiKey: varchar("apiKey", { length: 500 }).notNull(),
  apiUrl: varchar("apiUrl", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpenwaConfig = typeof openwaConfigs.$inferSelect;
export type InsertOpenwaConfig = typeof openwaConfigs.$inferInsert;

export const whatsappNumbers = mysqlTable("whatsapp_numbers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  sessionName: varchar("sessionName", { length: 100 }).notNull(),
  openwaSessionId: varchar("openwaSessionId", { length: 100 }),
  isConnected: boolean("isConnected").default(false).notNull(),
  connectionStatus: varchar("connectionStatus", { length: 50 }).default("disconnected").notNull(),
  lastActivity: timestamp("lastActivity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappNumber = typeof whatsappNumbers.$inferSelect;
export type InsertWhatsappNumber = typeof whatsappNumbers.$inferInsert;

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  message: text("message").notNull(),
  targetNumbers: json("targetNumbers").notNull(), // JSON array of phone numbers
  status: mysqlEnum("status", ["draft", "scheduled", "running", "completed", "failed"]).default("draft").notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

export const automationFlows = mysqlTable("automation_flows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerKeywords: json("triggerKeywords").notNull(), // JSON array of keywords
  responseType: mysqlEnum("responseType", ["static", "gemini", "flow"]).default("static").notNull(),
  staticResponse: text("staticResponse"),
  geminiApiKey: varchar("geminiApiKey", { length: 500 }),
  geminiPrompt: text("geminiPrompt"),
  flowSteps: json("flowSteps"), // JSON array of flow steps
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationFlow = typeof automationFlows.$inferSelect;
export type InsertAutomationFlow = typeof automationFlows.$inferInsert;

export const messageStats = mysqlTable("message_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  totalReceived: int("totalReceived").default(0).notNull(),
  totalSent: int("totalSent").default(0).notNull(),
  automatedResponses: int("automatedResponses").default(0).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageStat = typeof messageStats.$inferSelect;
export type InsertMessageStat = typeof messageStats.$inferInsert;

export const messageLog = mysqlTable("message_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  contactNumber: varchar("contactNumber", { length: 20 }).notNull(),
  message: text("message").notNull(),
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).notNull(),
  isAutomated: boolean("isAutomated").default(false).notNull(),
  campaignId: int("campaignId"),
  automationFlowId: int("automationFlowId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageLog = typeof messageLog.$inferSelect;
export type InsertMessageLog = typeof messageLog.$inferInsert;
