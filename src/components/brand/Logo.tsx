import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'white';
}

/**
 * Yatra Setu Logo Component
 * Hand-crafted SVG representing a Road/Bridge fusion.
 */
export const Logo: React.FC<LogoProps> = ({ className = "h-8", variant = 'full' }) => {
    const primaryColor = variant === 'white' ? '#FFFFFF' : '#1E3A8A';
    const accentColor = variant === 'white' ? '#FFFFFF' : '#2563EB';

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Bridge Arch */}
                <path
                    d="M10 80 C 10 20, 90 20, 90 80"
                    stroke={primaryColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* Inner Path/Road */}
                <path
                    d="M30 80 C 30 40, 70 40, 70 80"
                    stroke={accentColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="4 8"
                />
                {/* Moving Bus (Minimal) */}
                <rect x="42" y="32" width="16" height="8" rx="4" fill={accentColor} />
            </svg>
            <div className="flex flex-col leading-none">
                <span className={`text-[1.8em] font-bold tracking-tight ${variant === 'white' ? 'text-white' : 'text-primary'}`}>
                    Yatra<span className="font-medium text-blue-500">Setu</span>
                </span>
                <span className={`text-[0.6em] font-medium tracking-[0.2em] uppercase opacity-60 ${variant === 'white' ? 'text-blue-100' : 'text-primary/70'}`}>
                    Smart Transport
                </span>
            </div>
        </div>
    );
};

export default Logo;
