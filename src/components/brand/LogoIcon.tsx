import React from 'react';

interface LogoIconProps {
    className?: string;
    size?: number;
}

/**
 * Yatra Setu Branding - Icon Only
 * Optimized for App Icons, Favicons, and Splash Screens.
 */
export const LogoIcon: React.FC<LogoIconProps> = ({ className = "", size = 100 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background Circle / Shield */}
            <rect width="100" height="100" rx="24" fill="#1E3A8A" />

            {/* Bridge Arch */}
            <path
                d="M20 75 C 20 25, 80 25, 80 75"
                stroke="white"
                strokeWidth="10"
                strokeLinecap="round"
            />

            {/* Inner Road Line */}
            <path
                d="M35 75 C 35 45, 65 45, 65 75"
                stroke="#60A5FA"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="2 6"
            />

            {/* Smart Bus (Moving forward indicator) */}
            <circle cx="50" cy="35" r="5" fill="#60A5FA" />
            <rect x="44" y="33" width="12" height="4" rx="2" fill="white" />
        </svg>
    );
};

export default LogoIcon;
