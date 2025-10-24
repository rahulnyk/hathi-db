import { EditorPluginContext } from "./types";

/**
 * Gets a consistent editor ID for the current editor context
 * @param context - The editor plugin context
 * @returns A unique editor ID
 */
export function getEditorId(context: EditorPluginContext): string {
    return context.isEditMode ? "edit" : "new";
}
