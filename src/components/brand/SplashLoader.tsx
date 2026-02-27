import React, { useEffect, useState } from 'react';
import LogoIcon from './LogoIcon';

/**
 * SplashLoader Component
 * Professional entrance animation for Yatra Setu.
 */
export const SplashLoader: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [phase, setPhase] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animation sequence phases
        const timers = [
            setTimeout(() => setPhase(1), 300),  // Start
            setTimeout(() => setPhase(2), 800),  // Image reveal
            setTimeout(() => setPhase(3), 2800), // Hold
            setTimeout(() => setPhase(4), 3200), // Fade exit
            setTimeout(() => setIsVisible(false), 3800)
        ];

        // Progress counter logic
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                const increment = Math.random() * 15;
                return Math.min(100, prev + increment);
            });
        }, 150);

        return () => {
            timers.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-1000 bg-[#1E3A8A] ${phase >= 4 ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>

            {/* Logo Container */}
            <div className="relative flex flex-col items-center justify-center">
                {/* Visual Flair / Glow - Enhanced for a clean flash */}
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white/20 rounded-full blur-[120px] transition-opacity duration-1000 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`} />

                <div className={`relative transition-all duration-1000 ease-out transform ${phase >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}>
                    {/* The logo in a premium white container for consistency */}
                    <div className="bg-white p-10 rounded-[32px] shadow-2xl overflow-hidden">
                        <LogoIcon
                            size={280}
                            variant="full"
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Progress Percentage - Subtle & Integrated */}
            <div className={`mt-8 transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="text-white/40 text-sm font-bold tracking-[0.5em] uppercase tabular-nums flex items-baseline gap-2">
                    <span className="text-white/80">{Math.round(progress)}%</span>
                    <span className="text-[10px] opacity-40 font-medium">Synced</span>
                </div>
            </div>

            {/* Loading Bar */}
            <div className={`absolute bottom-20 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden transition-all duration-1000 ${phase >= 4 ? 'opacity-0' : 'opacity-100'}`}>
                <div
                    className="h-full bg-white shadow-[0_0_10px_#fff] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default SplashLoader;
