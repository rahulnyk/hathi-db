"use client";

import React, { useState, useMemo } from "react";
import { Note, TodoStatus, patchNote } from "@/store/notesSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CardHeader } from "./card-header";
import { NoteStatusIndicator } from "./note-status-indicator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Assuming Popover exists
import { CalendarIcon, Edit3Icon, CheckCircle, Circle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export interface TodoNoteCardProps {
    note: Note;
    disableCardHeader?: boolean;
}

export function TodoNoteCard({ note: initialNote, disableCardHeader = false }: TodoNoteCardProps) {
    const dispatch = useAppDispatch();

    // Ensure we are working with the latest version of the note from the store
    const storeNote = useAppSelector((state) =>
        state.notes.notes.find((n) => n.id === initialNote.id)
    );
    const note = useMemo(() => storeNote || initialNote, [storeNote, initialNote]);

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const currentDeadline = useMemo(() => {
        return note.deadline ? new Date(note.deadline) : undefined;
    }, [note.deadline]);

    const currentStatus = useMemo(() => {
        return note.status || TodoStatus.TODO;
    }, [note.status]);

    const handleDeadlineChange = (newDate: Date | undefined) => {
        setIsDatePickerOpen(false);
        if (newDate && newDate.toISOString() !== note.deadline) {
            const isoDate = newDate.toISOString();
            dispatch(patchNote({ noteId: note.id, patches: { deadline: isoDate } }));
        } else if (!newDate && note.deadline) {
            dispatch(patchNote({ noteId: note.id, patches: { deadline: null } }));
        }
    };

    const getNextStatus = (status: TodoStatus): TodoStatus => {
        switch (status) {
            case TodoStatus.TODO: return TodoStatus.DOING;
            case TodoStatus.DOING: return TodoStatus.DONE;
            case TodoStatus.DONE: return TodoStatus.OBSOLETE;
            case TodoStatus.OBSOLETE: return TodoStatus.TODO;
            default: return TodoStatus.TODO;
        }
    };

    const handleStatusChange = () => {
        const nextStatus = getNextStatus(currentStatus);
        dispatch(patchNote({ noteId: note.id, patches: { status: nextStatus } }));
    };

    const getStatusIcon = (status: TodoStatus) => {
        switch (status) {
            case TodoStatus.TODO: return <Circle className="h-4 w-4" />; // Removed mr-2
            case TodoStatus.DOING: return <Loader2 className="h-4 w-4 animate-spin" />; // Removed mr-2
            case TodoStatus.DONE: return <CheckCircle className="h-4 w-4 text-green-500" />; // Removed mr-2
            case TodoStatus.OBSOLETE: return <XCircle className="h-4 w-4 text-gray-500" />; // Removed mr-2
            default: return <Circle className="h-4 w-4" />; // Removed mr-2
        }
    };

    const displayContent = note.content.toLowerCase().startsWith("todo ")
        ? note.content.substring(5)
        : note.content.toLowerCase().startsWith("todo")
        ? note.content.substring(4)
        : note.content;


    return (
        <div
            data-note-id={note.id}
            className={cn(
                "px-2 sm:px-4 my-2 rounded-lg relative transition-colors duration-500",
                "bg-orange-50 dark:bg-orange-900/40" // Light orange background
            )}
        >
            {!disableCardHeader && <CardHeader note={note} />}

            <div className="flex items-start gap-2 mt-1 mb-2"> {/* Flex container for button and content */}
                {/* Status Toggle Button - MOVED HERE */}
                <Button
                    variant="outline"
                    size="sm" // Changed from icon to sm for text
                    onClick={handleStatusChange}
                    className="h-7 rounded-full px-3 py-1 flex-shrink-0 mt-0.5 flex items-center gap-1.5 text-xs" // Pill shape, padding, alignment
                    title={`Change status: ${currentStatus}`}
                >
                    {getStatusIcon(currentStatus)}
                    <span>{currentStatus}</span>
                </Button>

                <div className="prose prose-sm dark:prose-invert max-w-none flex-grow">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {displayContent}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs ml-24"> {/* Adjusted indent for deadline picker */}
                {/* Deadline Picker */}
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2 py-1"
                        >
                            <CalendarIcon className="h-3 w-3 mr-1.5" />
                            {currentDeadline ? format(currentDeadline, "MMM dd, yyyy") : "Set Deadline"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                            selectedDate={currentDeadline}
                            onDateChange={handleDeadlineChange}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* We can keep the existing NoteStatusIndicator or adapt parts of it if needed */}
            {/* For now, let's assume it might not be directly relevant or needs specific props */}
            {/* <NoteStatusIndicator note={note} /> */}
        </div>
    );
}
