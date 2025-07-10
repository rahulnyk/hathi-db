// import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { agentSystemPrompt } from "@/lib/prompts/agent-prompt";
import { gemini } from "@/lib/ai";
import { tools } from "@/app/agent_tools";

export const maxDuration = 50;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        console.log("Received messages:", messages?.length);
        console.log("Google API Key present:", !!process.env.GOOGLE_AI_API_KEY);

        const result = streamText({
            model: gemini("gemini-2.5-flash"),
            messages,
            system: agentSystemPrompt(),
            maxSteps: 3,
            toolChoice: "auto", // let the agent decide when to use tools vs respond directly
            tools,
        });

        return result.toDataStreamResponse();
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
