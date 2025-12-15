"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import { searchContexts } from "@/app/actions/contexts";
import { ContextStats } from "@/db/types";
import { ContextList } from "@/components/menu/context-list";
import { DateContextPicker } from "@/components/journal/date-context-picker";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/store";

interface ContextMenuModalProps {
    onClose: () => void;
}

export function ContextMenuModal({ onClose }: ContextMenuModalProps) {
    const deviceType = useAppSelector((state) => state.ui.deviceType);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<ContextStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const results = await searchContexts(debouncedSearchTerm, 5);
                setSearchResults(results);
            } catch (error) {
                console.error("Error searching contexts:", error);
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedSearchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="flex flex-col gap-4 p-2 w-full max-w-3xl mx-auto">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search contexts..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-8"
                    autoFocus
                />
            </div>

            {/* Content Area */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Date Picker - Left on Desktop, Bottom on Mobile */}
                <div className="order-2 md:order-1 w-full md:w-1/2 flex justify-center">
                    <DateContextPicker
                        isOpen={true}
                        onDateChangeHook={onClose}
                    />
                </div>

                {/* Context List - Right on Desktop, Top on Mobile */}
                <div className="order-1 md:order-2 w-full md:w-1/2 h-[350px] overflow-y-auto border rounded-md p-2 bg-background">
                    <ContextList
                        onCloseMenu={onClose}
                        deviceType={deviceType}
                        contextsOverride={
                            isSearching ? searchResults : undefined
                        }
                        isLoadingOverride={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
