// import { google } from "@ai-sdk/google";
import { streamText, stepCountIs } from "ai";
import { agentSystemPrompt } from "@/lib/prompts/agent-prompt";
import { gemini } from "@/lib/ai";
import { tools } from "@/app/agent_tools";

export const maxDuration = 50;

export async function POST(req: Request) {
    try {
        const { messages, id } = await req.json();

        console.log("Received messages:", messages?.length);
        console.log("Chat ID:", id);
        console.log("Google API Key present:", !!process.env.GOOGLE_AI_API_KEY);

        const result = streamText({
            model: gemini("gemini-2.5-flash"),
            messages,
            maxRetries: 2,
            system: agentSystemPrompt(),
            stopWhen: stepCountIs(5),
            toolChoice: "auto", // let the agent decide when to use tools vs respond directly
            tools,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API error:", error);
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
