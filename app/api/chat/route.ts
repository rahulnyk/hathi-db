// import { google } from "@ai-sdk/google";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { agentSystemPrompt } from "@/lib/prompts/agent-prompt";
import { gemini } from "@/lib/ai";
import { tools } from "@/app/agent_tools";
import { UIMessage } from "ai";
import { createChatLogger } from "@/lib/chat-loggers/server-chat-logger";

export const maxDuration = 50;

export async function POST(req: Request) {
    try {
        const { messages, id }: { messages: UIMessage[]; id: string } =
            await req.json();
        // const { messages, id } = await req.json();

        console.log("Received messages:", messages?.length);
        console.log("Chat ID:", id);
        console.log("Google API Key present:", !!process.env.GOOGLE_AI_API_KEY);

        // Create comprehensive logger for this chat session
        const logger = createChatLogger(id);

        const result = streamText({
            model: gemini("gemini-2.5-flash"),
            messages: convertToModelMessages(messages, {
                ignoreIncompleteToolCalls: true,
            }),
            maxRetries: 2,
            system: agentSystemPrompt(),
            stopWhen: stepCountIs(5),
            toolChoice: "auto", // let the agent decide when to use tools vs respond directly
            tools,
            // Add comprehensive logging hooks
            onChunk: logger.onChunk,
            onStepFinish: logger.onStepFinish,
            onFinish: logger.onFinish,
            onError: logger.onError,
            onAbort: logger.onAbort,
        });

        // Log the start of the session
        logger.onStart();

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API error:", error);

        // Log the error if we have access to the logger
        // Note: This is a top-level error, so we create a temporary logger
        const errorLogger = createChatLogger();
        errorLogger.onError(error);

        return new Response(
            JSON.stringify({
                error: "An error occurred while processing your request",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
