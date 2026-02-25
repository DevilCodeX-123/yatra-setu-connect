import logoImg from "@/assets/logo_new.png";

interface LogoIconProps {
    className?: string;
    size?: number;
    variant?: 'full' | 'white';
}

/**
 * Yatra Setu Branding - Icon Only
 * Optimized for App Icons, Favicons, and Splash Screens.
 */
export const LogoIcon: React.FC<LogoIconProps> = ({ className = "", size = 100, variant = 'full' }) => {
    return (
        <img
            src={logoImg}
            alt="Yatra Setu"
            className={className}
            style={{
                width: size,
                height: 'auto',
                maxHeight: size,
                filter: variant === 'white' ? 'grayscale(1) invert(1) contrast(5) invert(1) brightness(1.5)' : 'none',
                mixBlendMode: variant === 'white' ? 'screen' : 'multiply'
            }}
        />
    );
};

export default LogoIcon;
