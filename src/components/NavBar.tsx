import React, { useState, useEffect } from 'react';

interface NavItem {
    href: string;
    label: string;
}

const NavBar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState('');

    useEffect(() => {
        setCurrentPath(window.location.pathname);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMenu();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const navItems: NavItem[] = [
        { href: '/gallery', label: 'Gallery' },
        { href: '/expose-film', label: 'Expose Film' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <a
                            href="/"
                            className="text-white text-lg font-light tracking-[0.15em] uppercase hover:opacity-60 transition-opacity duration-300"
                        >
                            Andres Ravelo
                        </a>

                        <nav className="hidden md:flex items-center gap-10">
                            {navItems.map((item) => {
                                const isActive = currentPath === item.href;
                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className={`relative text-sm tracking-[0.12em] uppercase font-light transition-colors duration-200 ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-neutral-600 hover:text-white'
                                        }`}
                                    >
                                        {item.label}
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-white" />
                                        )}
                                    </a>
                                );
                            })}
                        </nav>

                        <button
                            onClick={toggleMenu}
                            className="md:hidden text-white hover:text-neutral-400 transition-colors focus:outline-none p-2"
                            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            <div className="w-5 h-4 relative flex flex-col justify-between">
                                <span className={`block h-[1.5px] bg-current transform transition-all duration-300 ${
                                    isMenuOpen ? 'rotate-45 translate-y-[6.5px]' : ''
                                }`} />
                                <span className={`block h-[1.5px] bg-current transition-all duration-300 ${
                                    isMenuOpen ? 'opacity-0' : ''
                                }`} />
                                <span className={`block h-[1.5px] bg-current transform transition-all duration-300 ${
                                    isMenuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''
                                }`} />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeMenu}
                />
            )}

            <div className={`fixed top-16 left-0 right-0 bg-black/95 z-40 md:hidden transform transition-all duration-300 ${
                isMenuOpen
                    ? 'translate-y-0 opacity-100'
                    : '-translate-y-full opacity-0 pointer-events-none'
            }`}>
                <nav className="px-8 py-12 space-y-8">
                    {navItems.map((item) => {
                        const isActive = currentPath === item.href;
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className={`block text-xl tracking-[0.15em] uppercase font-light transition-colors duration-200 ${
                                    isActive
                                        ? 'text-white'
                                        : 'text-neutral-600 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </a>
                        );
                    })}
                </nav>

                <div className="border-t border-white/5 px-8 py-6">
                    <p className="text-neutral-700 text-xs tracking-wider uppercase">
                        &copy; 2026 Andres Ravelo
                    </p>
                </div>
            </div>

            <div className="h-16" />
        </>
    );
};

export default NavBar;
