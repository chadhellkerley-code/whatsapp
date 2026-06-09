import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const whatsappRouter = router({
  // OpenWA Configuration
  saveOpenwaConfig: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.saveOpenwaConfig(ctx.user.id, input.apiKey, input.apiUrl);
      return { success: true };
    }),

  getOpenwaConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await db.getOpenwaConfig(ctx.user.id);
      return config || null;
    }),

  // WhatsApp Numbers Management
  addNumber: protectedProcedure
    .input(z.object({
      phoneNumber: z.string(),
      sessionName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.addWhatsappNumber(ctx.user.id, input.phoneNumber, input.sessionName);
      return { success: true, message: "Número agregado correctamente" };
    }),

  listNumbers: protectedProcedure
    .query(async ({ ctx }) => {
      const numbers = await db.getWhatsappNumbers(ctx.user.id);
      return numbers.map(n => ({
        id: n.id,
        phoneNumber: n.phoneNumber,
        sessionName: n.sessionName,
        isConnected: n.isConnected,
        connectionStatus: n.connectionStatus,
        lastActivity: n.lastActivity,
      }));
    }),

  updateNumberStatus: protectedProcedure
    .input(z.object({
      numberId: z.number(),
      isConnected: z.boolean(),
      status: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateWhatsappNumberStatus(input.numberId, input.isConnected, input.status);
      return { success: true };
    }),

  deleteNumber: protectedProcedure
    .input(z.object({ numberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteWhatsappNumber(input.numberId);
      return { success: true };
    }),

  // Campaigns
  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string(),
      message: z.string(),
      targetNumbers: z.array(z.string()),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createCampaign(
        ctx.user.id,
        input.name,
        input.message,
        input.targetNumbers,
        input.description
      );
      return { success: true, message: "Campaña creada correctamente" };
    }),

  listCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      const campaigns = await db.getCampaigns(ctx.user.id);
      return campaigns.map(c => ({
        id: c.id,
        name: c.name,
        message: c.message,
        status: c.status,
        sentCount: c.sentCount,
        failedCount: c.failedCount,
        targetNumbers: typeof c.targetNumbers === 'string' ? JSON.parse(c.targetNumbers) : c.targetNumbers,
        createdAt: c.createdAt,
      }));
    }),

  updateCampaignStatus: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      status: z.enum(["draft", "scheduled", "running", "completed", "failed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateCampaignStatus(input.campaignId, input.status);
      return { success: true };
    }),

  // Automation Flows
  createAutomationFlow: protectedProcedure
    .input(z.object({
      name: z.string(),
      triggerKeywords: z.array(z.string()),
      responseType: z.enum(["static", "gemini", "flow"]),
      staticResponse: z.string().optional(),
      geminiApiKey: z.string().optional(),
      geminiPrompt: z.string().optional(),
    }))
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
      return { success: true, message: "Flujo de automatización creado" };
    }),

  listAutomationFlows: protectedProcedure
    .query(async ({ ctx }) => {
      const flows = await db.getAutomationFlows(ctx.user.id);
      return flows.map(f => ({
        id: f.id,
        name: f.name,
        responseType: f.responseType,
        triggerKeywords: typeof f.triggerKeywords === 'string' ? JSON.parse(f.triggerKeywords) : f.triggerKeywords,
        isActive: f.isActive,
        createdAt: f.createdAt,
      }));
    }),

  // Message Statistics
  getMessageStats: protectedProcedure
    .input(z.object({ phoneNumber: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const stats = await db.getMessageStats(ctx.user.id, input.phoneNumber);
      return stats.map(s => ({
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
    .input(z.object({
      phoneNumber: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const logs = await db.getMessageLog(ctx.user.id, input.phoneNumber, input.limit);
      return logs.map(l => ({
        id: l.id,
        phoneNumber: l.phoneNumber,
        contactNumber: l.contactNumber,
        message: l.message,
        direction: l.direction,
        isAutomated: l.isAutomated,
        createdAt: l.createdAt,
      }));
    }),

  // Dashboard Stats
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      const numbers = await db.getWhatsappNumbers(ctx.user.id);
      const campaigns = await db.getCampaigns(ctx.user.id);
      const flows = await db.getAutomationFlows(ctx.user.id);
      const stats = await db.getMessageStats(ctx.user.id);

      const totalMessages = stats.reduce((sum, s) => sum + (s.totalMessages || 0), 0);
      const totalSent = stats.reduce((sum, s) => sum + (s.totalSent || 0), 0);
      const totalReceived = stats.reduce((sum, s) => sum + (s.totalReceived || 0), 0);
      const automatedResponses = stats.reduce((sum, s) => sum + (s.automatedResponses || 0), 0);

      return {
        connectedNumbers: numbers.filter(n => n.isConnected).length,
        totalNumbers: numbers.length,
        activeCampaigns: campaigns.filter(c => c.status === 'running').length,
        totalCampaigns: campaigns.length,
        activeFlows: flows.filter(f => f.isActive).length,
        totalMessages,
        totalSent,
        totalReceived,
        automatedResponses,
      };
    }),
});
