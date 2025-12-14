"use client";

import { ChatComponent } from "../chat";

export function ChatMenu() {
    return (
        <div className="flex flex-col h-full">
            <ChatComponent className="h-full flex flex-col" showInput={true} />
        </div>
    );
}
