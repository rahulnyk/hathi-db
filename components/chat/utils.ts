import type { UIMessage } from "ai";
import {
    TextUIPart,
    ReasoningUIPart,
    ToolInvocationUIPart,
    SourceUIPart,
    FileUIPart,
    StepStartUIPart,
} from "@ai-sdk/ui-utils";

type Parts =
    | TextUIPart
    | ReasoningUIPart
    | ToolInvocationUIPart
    | SourceUIPart
    | FileUIPart
    | StepStartUIPart;

export const hasNonEmptyParts = (message: UIMessage): boolean => {
    return !!(message.parts && message.parts.length > 0);
};

function isToolInvocationPart(part: Parts): part is ToolInvocationUIPart {
    return part.type === "tool-invocation";
}
