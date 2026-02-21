import React, { useEffect, useState } from 'react';
import LogoIcon from './LogoIcon';

/**
 * SplashLoader Component
 * Professional entrance animation for Yatra Setu.
 */
export const SplashLoader: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        // Animation sequence phases
        const timers = [
            setTimeout(() => setPhase(1), 500),  // Path start
            setTimeout(() => setPhase(2), 1200), // Bridge form
            setTimeout(() => setPhase(3), 2000), // Logo Show
            setTimeout(() => setPhase(4), 3500), // Fade exit
            setTimeout(() => setIsVisible(false), 4000)
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-700 bg-[#1E3A8A] ${phase >= 4 ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>

            {/* Animated SVG Path Container */}
            <div className="relative w-48 h-48 flex items-center justify-center">

                {/* Bridge Formation Line */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full rotate-[-10deg]">
                    <path
                        d="M10 80 C 10 20, 90 20, 90 80"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        className={`transition-all duration-[1500ms] ease-out ${phase >= 1 ? 'stroke-dashoffset-0' : 'stroke-dashoffset-[300]'}`}
                        style={{ strokeDasharray: 300, strokeDashoffset: phase >= 1 ? 0 : 300 }}
                    />
                </svg>

                {/* Logo Icon Scale-in */}
                <div className={`transition-all duration-1000 ease-out transform ${phase >= 2 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    <LogoIcon size={120} />
                </div>

                {/* Pulsing Light Effect */}
                <div className={`absolute inset-0 bg-blue-400/20 rounded-full blur-[40px] transition-opacity duration-1000 ${phase === 3 ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Brand Text Fade In */}
            <div className={`mt-8 text-center transition-all duration-1000 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                    Yatra<span className="text-blue-400 font-medium">Setu</span>
                </h1>
                <p className="text-blue-200/50 text-xs uppercase tracking-[0.3em] mt-2 font-semibold">
                    Connecting Every Mile
                </p>
            </div>

            {/* Minimal Loading Bar */}
            <div className="absolute bottom-20 w-40 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-400 transition-all duration-[3000ms] ease-linear ${phase >= 1 ? 'w-full' : 'w-0'}`} />
            </div>

        </div>
    );
};

export default SplashLoader;
