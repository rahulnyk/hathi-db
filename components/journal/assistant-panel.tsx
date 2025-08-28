"use client";

import React from "react";
import { ChatComponent } from "../chat";

export function AssistantPanel() {
    return (
        <div className="w-full flex-grow overflow-y-auto px-4 md:px-6 py-4 md:py-6 smooth-scroll">
            <ChatComponent className="h-full flex flex-col" />
        </div>
    );
}
