"use client";

import React, { useState } from "react";
import { Note } from "@/store/notesSlice";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "./notes-card";
import { cn } from "@/lib/utils";

interface CollapsibleSourceNoteProps {
    note: Note;
    initiallyCollapsed?: boolean;
}

export function CollapsibleSourceNote({ 
    note, 
    initiallyCollapsed = true 
}: CollapsibleSourceNoteProps) {
    const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Generate a title from note content (first line or first 60 chars)
    const noteTitle = React.useMemo(() => {
        const content = note.content.trim();
        if (!content) return 'Empty note';
        
        // Remove markdown formatting for cleaner title
        const cleanContent = content
            .replace(/^#{1,6}\s+/, '') // Remove markdown headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1'); // Remove inline code
            
        const firstLine = cleanContent.split('\n')[0];
        const title = firstLine.length > 60 
            ? firstLine.substring(0, 60) + '...' 
            : firstLine;
        return title || 'Untitled note';
    }, [note.content]);

    return (
        <div className={cn(
            "border rounded-lg mb-2 transition-all duration-200",
            "bg-card hover:bg-accent/5",
            "sm:mb-3" // Slightly more spacing on larger screens
        )}>
            {/* Collapse/Expand Header */}
            <div 
                className={cn(
                    "flex items-center p-2 sm:p-3 cursor-pointer select-none",
                    "hover:bg-accent/10 rounded-t-lg transition-colors",
                    "min-h-[48px] touch-manipulation", // Ensure good touch targets on mobile
                    isCollapsed && "rounded-b-lg"
                )}
                onClick={toggleCollapse}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto mr-2 hover:bg-accent/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse();
                    }}
                >
                    {isCollapsed ? (
                        <ChevronRightIcon size={16} />
                    ) : (
                        <ChevronDownIcon size={16} />
                    )}
                </Button>
                
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground mb-1">
                        Source Note
                    </div>
                    <div className="font-medium text-sm truncate">
                        {noteTitle}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {!isCollapsed && (
                <div className="border-t bg-background/50">
                    <div className="p-2">
                        <NoteCard note={note} />
                    </div>
                </div>
            )}
        </div>
    );
}
