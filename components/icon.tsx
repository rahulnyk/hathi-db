// ElephantIcon.jsx
import React from "react";

interface ElephantIconProps extends React.SVGProps<SVGSVGElement> {
    /**
     * The size of the icon in pixels (both width and height)
     * @default 100
     */
    size?: number;
}

export const ElephantIcon = ({ size = 100, ...rest }: ElephantIconProps) => (
    <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
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

interface HathiIconProps {
    className?: string;
    width?: number | string;
    height?: number | string;
    color?: string;
    size?: number; // Optional size prop for convenience
    strokeWidth?: number; // Optional stroke width prop
}

export const HathiIcon: React.FC<HathiIconProps> = ({
    className = "",
    size = 24,
    color = "currentColor",
    strokeWidth = 10,
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M89.1311 85.7828V103.816H67.1595C66.5472 99.2404 63.2315 90.0902 54.8667 90.0902C46.502 90.0902 42.5268 99.2404 41.5848 103.816H27.4552C23.3724 99.4516 16.5058 88.2964 14.7385 75.6348M85.4574 58.2591C82.0663 44.9718 70.268 32.8526 54.8667 30.9544C39.4654 29.0562 24.2593 36.4985 17.5645 52.9296C14.7385 59.8653 14.1307 71.2799 14.7385 75.6348M104.604 104H110.749C111.338 84.4584 113.242 49.7903 110.749 38.7662C108.257 27.7421 101.141 15.8419 85.4574 15.0389C69.7735 14.2358 54.8667 25.9182 54.8667 44.7528C54.8667 61.3041 71.8 78.1419 92.2396 70.3783M14.7385 75.6348C13.9393 78.6768 11.3474 90.0902 4 90.0902"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                width={size}
                height={size}
                // strokeLinecap="round"
            />
        </svg>
    );
};
