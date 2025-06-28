"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { answerQuestion } from "@/app/actions/qa";

interface QAMessage {
    id: string;
    type: "question" | "answer";
    content: string;
    timestamp: Date;
}

interface QAInterfaceProps {
    onClose: () => void;
}

export function QAInterface({ onClose }: QAInterfaceProps) {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<QAMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading) return;

        const currentQuestion = question.trim();
        setQuestion("");
        setIsLoading(true);

        // Add question to messages
        const questionMessage: QAMessage = {
            id: `q-${Date.now()}`,
            type: "question",
            content: currentQuestion,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, questionMessage]);

        try {
            const result = await answerQuestion(currentQuestion);
            
            // Add answer to messages
            const answerMessage: QAMessage = {
                id: `a-${Date.now()}`,
                type: "answer",
                content: result.answer,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, answerMessage]);
        } catch (error) {
            console.error("Error asking question:", error);
            const errorMessage: QAMessage = {
                id: `e-${Date.now()}`,
                type: "answer",
                content: "Sorry, I encountered an error while processing your question. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Ask about your notes</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    ✕
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Ask me anything about your notes!</p>
                        <p className="text-sm mt-2">
                            For example: &ldquo;Summarize my ideas about the app project&rdquo;
                        </p>
                    </div>
                )}
                
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.type === "question" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                message.type === "question"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            }`}
                        >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Searching your notes and thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <Textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about your notes..."
                        className="flex-1 min-h-0 resize-none"
                        rows={2}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!question.trim() || isLoading}
                        className="self-end"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
