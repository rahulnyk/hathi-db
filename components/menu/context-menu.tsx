"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { clearDatePickerSelection } from "@/store/uiSlice";
import { DateContextPicker } from "../journal/date-context-picker";
import { ContextList } from "./context-list";
import { ContextSearchBox } from "../ui/context-search-box";
import { useContextNavigation } from "@/lib/context-navigation";

interface ContextMenuProps {
    onCloseMenu: () => void;
}

export function ContextMenu({ onCloseMenu }: ContextMenuProps) {
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();
    const deviceType = useAppSelector((state) => state.ui.deviceType);

    return (
        <>
            <div className="p-0 rounded-md flex justify-center">
                <DateContextPicker
                    isOpen={true}
                    onDateChangeHook={() => {
                        if (deviceType === "mobile") {
                            onCloseMenu();
                        }
                    }}
                />
            </div>

            {/* Context Search Box */}
            <div className="px-2">
                <ContextSearchBox
                    placeholder="Search contexts..."
                    className="[&_input]:shadow-none"
                    onContextSelect={(context) => {
                        dispatch(clearDatePickerSelection());
                        navigateToContext(context);
                        if (deviceType === "mobile") {
                            onCloseMenu();
                        }
                    }}
                />
            </div>

            <ContextList onCloseMenu={onCloseMenu} deviceType={deviceType} />
        </>
    );
}
