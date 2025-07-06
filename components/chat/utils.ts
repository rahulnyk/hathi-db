import type { UIMessage } from "ai";
import {
    TextUIPart,
    ReasoningUIPart,
    ToolInvocationUIPart,
    SourceUIPart,
    FileUIPart,
    StepStartUIPart,
} from "@ai-sdk/ui-utils";

export type MessagePart =
    | TextUIPart
    | ReasoningUIPart
    | ToolInvocationUIPart
    | SourceUIPart
    | FileUIPart
    | StepStartUIPart;

export const messageHasParts = (message: UIMessage): boolean => {
    return !!(message.parts && message.parts.length > 0);
};
