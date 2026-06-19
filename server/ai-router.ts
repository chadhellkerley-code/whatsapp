import { z } from "zod";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { protectedProcedure, router } from "./_core/trpc";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

export const aiRouter = router({
  models: protectedProcedure.query(async () => {
    return listLLMModels();
  }),

  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(messageSchema).min(1),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
        maxTokens: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const messages = [
        ...(input.systemPrompt
          ? [{ role: "system" as const, content: input.systemPrompt }]
          : []),
        ...input.messages,
      ];

      const response = await invokeLLM({
        messages,
        model: input.model,
        maxTokens: input.maxTokens ?? 512,
      });

      const message = response.choices[0]?.message?.content;
      const text =
        typeof message === "string"
          ? message
          : Array.isArray(message)
            ? message
                .map((part) => ("text" in part ? part.text : ""))
                .join("")
            : "";

      return {
        text,
        raw: response,
      };
    }),
});
