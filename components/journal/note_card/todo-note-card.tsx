"use client";

import React, { useState, useMemo } from "react";
import { Note, TodoStatus, updateNoteOptimistically } from "@/store/notesSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CardHeader } from "./card-header";
import { NotesEditor } from "../editor";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Circle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useRef } from "react";
import { setEditingNoteId } from "@/store/uiSlice";
import { cleanTodoContent } from "@/lib/note-type-utils";
import remarkContextPlugin from "@/lib/remark_context_plugin";
import remarkHashtagPlugin from "@/lib/remark_hashtag_plugin";

export interface TodoNoteCardProps {
    note: Note;
    disableCardHeader?: boolean;
}

export function TodoNoteCard({
    note: initialNote,
    disableCardHeader = false,
}: TodoNoteCardProps) {
    const dispatch = useAppDispatch();

    // Ensure we are working with the latest version of the note from the store
    const storeNote = useAppSelector((state) => {
        const inContext = state.notes.contextNotes.find(
            (n) => n.id === initialNote.id
        );
        if (inContext) return inContext;
        return state.notes.searchResultNotes.find(
            (n) => n.id === initialNote.id
        );
    });
    const note = useMemo(
        () => storeNote || initialNote,
        [storeNote, initialNote]
    );

    // Get editing state
    const editingNoteId = useAppSelector((state) => state.ui.editingNoteId);
    const isNoteEditing = note.id === editingNoteId;

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // For mobile double-tap handling
    const lastTouchTime = useRef(0);
    const touchCount = useRef(0);

    const currentDeadline = useMemo(() => {
        return note.deadline ? new Date(note.deadline) : undefined;
    }, [note.deadline]);

    const currentStatus = useMemo(() => {
        return note.status || TodoStatus.TODO;
    }, [note.status]);

    const handleDeadlineChange = (newDate: Date | undefined) => {
        setIsDatePickerOpen(false);

        // Avoid unnecessary API calls if there's no actual change
        const currentDeadline = note.deadline
            ? new Date(note.deadline).toISOString()
            : null;
        const newDeadline = newDate ? newDate.toISOString() : null;
        if (currentDeadline === newDeadline) {
            return;
        }

        const deadlineValue = newDate ? newDate.toISOString() : null;

        // Use optimistic update - middleware will handle persistence automatically
        dispatch(
            updateNoteOptimistically({
                noteId: note.id,
                patches: { deadline: deadlineValue },
            })
        );
    };

    const getStatusIcon = (status: TodoStatus) => {
        switch (status) {
            case TodoStatus.TODO:
                return <Circle className="h-5 w-5 text-gray-400" />;
            case TodoStatus.DOING:
                return <Clock className="h-5 w-5 text-blue-500" />;
            case TodoStatus.DONE:
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            default:
                return <Circle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusText = (status: TodoStatus) => {
        switch (status) {
            case TodoStatus.TODO:
                return "To Do";
            case TodoStatus.DOING:
                return "In Progress";
            case TodoStatus.DONE:
                return "Done";
            default:
                return "To Do";
        }
    };

    const CARD_STYLES: Record<TodoStatus | "default", string> = {
        [TodoStatus.TODO]: "bg-slate-50 dark:bg-gray-800",
        [TodoStatus.DOING]: "bg-blue-50 dark:bg-blue-900/10",
        [TodoStatus.DONE]: "bg-green-50 dark:bg-green-900/10",
        [TodoStatus.OBSOLETE]: "bg-gray-50 dark:bg-gray-700",
        default: "bg-white dark:bg-gray-800",
    };

    const getCardStyle = (status: TodoStatus) => {
        return CARD_STYLES[status] || CARD_STYLES.default;
    };

    const getNextStatus = (status: TodoStatus): TodoStatus => {
        switch (status) {
            case TodoStatus.TODO:
                return TodoStatus.DOING;
            case TodoStatus.DOING:
                return TodoStatus.DONE;
            case TodoStatus.DONE:
                return TodoStatus.TODO;
            default:
                return TodoStatus.TODO;
        }
    };

    const handleStatusChange = () => {
        const nextStatus = getNextStatus(currentStatus);

        // Use optimistic update - middleware will handle persistence automatically
        dispatch(
            updateNoteOptimistically({
                noteId: note.id,
                patches: { status: nextStatus },
            })
        );
    };

    const handleDoubleClick = () => {
        if (note.persistenceStatus !== "persisted") return;
        dispatch(setEditingNoteId(note.id));
    };

    const handleTouchStart = (event: React.TouchEvent) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTouchTime.current;

        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            event.preventDefault();
            handleDoubleClick();
        } else {
            // Reset for new tap sequence
            touchCount.current = 1;
        }

        lastTouchTime.current = currentTime;
    };

    const displayContent = cleanTodoContent(note.content);

    return (
        <div
            data-note-id={note.id}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            className={cn(
                "p-4 my-2 rounded-lg relative transition-all duration-200",
                getCardStyle(currentStatus),
                currentStatus === TodoStatus.DONE && "opacity-75",
                isNoteEditing &&
                "border-l-2 border-dashed border-blue-500 rounded-none"
            )}
        >
            {!disableCardHeader && !isNoteEditing && (
                <CardHeader
                    note={note}
                    showDeleteButton={true}
                    showStructurizeButton={false}
                />
            )}

            {isNoteEditing ? (
                <div className="mb-0">
                    <NotesEditor note={note} />
                </div>
            ) : (
                <>
                    {/* Main todo content */}
                    <div className="flex items-start gap-3 mt-1">
                        {/* Status checkbox */}
                        <button
                            onClick={handleStatusChange}
                            className="flex-shrink-0 mt-1 hover:scale-110 transition-transform duration-150"
                            title={`Change status to ${getStatusText(
                                getNextStatus(currentStatus)
                            )}`}
                        >
                            {getStatusIcon(currentStatus)}
                        </button>

                        {/* Todo content */}
                        <div className="flex-1 min-w-0">
                            <div
                                className={cn(
                                    "prose prose-sm dark:prose-invert max-w-none cursor-pointer",
                                    currentStatus === TodoStatus.DONE &&
                                    "line-through opacity-60"
                                )}
                                title="Double-click to edit"
                            >
                                <ReactMarkdown
                                    remarkPlugins={[
                                        remarkGfm,
                                        remarkContextPlugin,
                                        remarkHashtagPlugin,
                                    ]}
                                >
                                    {displayContent}
                                </ReactMarkdown>
                            </div>

                            {/* Todo metadata */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {/* Deadline picker */}
                                <Popover
                                    open={isDatePickerOpen}
                                    onOpenChange={setIsDatePickerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "text-xs h-7 gap-1.5",
                                                currentDeadline &&
                                                "text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700"
                                            )}
                                        >
                                            <CalendarIcon className="h-3 w-3" />
                                            {currentDeadline
                                                ? format(
                                                    currentDeadline,
                                                    "MMM dd"
                                                )
                                                : "Add deadline"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <DatePicker
                                            selectedDate={currentDeadline}
                                            onDateChange={handleDeadlineChange}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
