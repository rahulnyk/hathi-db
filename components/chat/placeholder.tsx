import React from "react";
import { HathiIcon } from "../icon";

const Placeholder: React.FC = () => {
    return (
        <div className="text-center text-muted-foreground py-4 sm:py-8 px-2">
            <HathiIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4" />
            <p className="mb-2 text-sm sm:text-base font-bold">Talk to Hathi</p>
            <div className="text-xs space-y-1">
                <p>Try asking:</p>
                <div className="space-y-1 text-muted-foreground/70">
                    <p>• Show me notes from last week</p>
                    <p>• Find notes about React</p>
                    <p>• What contexts do I have?</p>
                    <p className="hidden sm:block">
                        • Show me all my todo notes
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Placeholder;
