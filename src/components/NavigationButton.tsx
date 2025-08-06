
import React from 'react';

interface NavigationButtonProps {
    href: string;
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'hero';
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
                                                               href,
                                                               children,
                                                               isActive = false,
                                                               onClick,
                                                               className = '',
                                                               variant = 'default'
                                                           }) => {
    const baseClasses = "group flex items-center px-6 py-3 rounded-lg border-2 transition-all duration-300";

    const variantClasses = {
        default: isActive
            ? "border-white bg-white/10 text-white"
            : "border-gray-600 hover:border-white hover:bg-white/5",
        hero: "border-gray-600 hover:border-white hover:bg-white/5"
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

    return (
        <a
            href={href}
            onClick={onClick}
            className={combinedClasses}
        >
            {children}
        </a>
    );
};

export default NavigationButton;