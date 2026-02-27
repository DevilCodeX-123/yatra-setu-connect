import logoImg from "@/assets/logo_new.png";

interface LogoProps {
    className?: string;
    variant?: 'full' | 'white';
    size?: string | number;
}

/**
 * Yatra Setu Logo Component
 * Hand-crafted SVG representing a Road/Bridge fusion.
 */
export const Logo: React.FC<LogoProps> = ({ className = "h-8", variant = 'full', size = "2rem" }) => { // Added size default value
    return (
        <div className={`flex items-center ${className}`}>
            <img
                src={logoImg}
                alt="Yatra Setu"
                className="h-full w-auto object-contain"
                style={{
                    filter: variant === 'white' ? 'grayscale(1) invert(1) contrast(5) invert(1) brightness(1.5)' : 'none',
                    mixBlendMode: variant === 'white' ? 'screen' : 'multiply'
                }}
            />
        </div>
    );
};

export default Logo;
