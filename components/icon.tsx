// ElephantIcon.jsx
import React from "react";

interface ElephantIconProps extends React.SVGProps<SVGSVGElement> {
    /**
     * The size of the icon in pixels (both width and height)
     * @default 100
     */
    size?: number;
}

export const ElephantIcon = ({ ...props }: ElephantIconProps) => (
    <svg
        viewBox="0 0 200 200"
        width={props.size || 100}
        height={props.size || 100}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Back and body */}
        <path d="M40 120 Q40 60, 100 60 Q140 60, 140 120" />

        {/* Legs */}
        <path d="M40 120 H70 V140 H40 Z M110 120 H140 V140 H110 Z" />

        {/* Trunk and head */}
        <path d="M100 60 Q160 60, 160 140" />

        {/* Ear */}
        <path d="M60 80 Q100 80, 100 120" />

        {/* Eye */}
        <circle cx="140" cy="90" r="6" fill="currentColor" stroke="none" />
    </svg>
);

// export default ElephantIcon;
