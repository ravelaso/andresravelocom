import React, { useState, useEffect } from 'react';

interface NavItem {
    href: string;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
}

const NavBar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState('');

    useEffect(() => {
        setCurrentPath(window.location.pathname);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        // Prevent body scroll when menu is open
        document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
    };

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMenu();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = ''; // Cleanup on unmount
        };
    }, [isMenuOpen]);

    const navItems: NavItem[] = [
        // {
        //     href: '/music/',
        //     label: 'Music',
        //     shortLabel: 'Music',
        //     icon: (
        //         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        //             <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
        //         </svg>
        //     )
        // },
        {
            href: '/code/',
            label: 'Development',
            shortLabel: 'Dev',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
            )
        },
        {
            href: '/photography',
            label: 'Photography',
            shortLabel: 'Photo',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
            )
        }
    ];

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <a
                                href="/"
                                className="text-white text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
                                onClick={closeMenu}
                            >
                                <span className="text-gray-300 font-extralight">ANDRES</span>{' '}
                                <span className="text-white">RAVELO</span>
                            </a>
                        </div>

                        {/* Desktop Nav Links */}
                        <nav className="hidden md:flex space-x-4">
                            {navItems.map((item) => {
                                const isActive = currentPath === item.href;
                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className={`group px-5 py-2 rounded-full border-2 transition-all duration-300 flex items-center ${
                                            isActive
                                                ? 'border-white bg-white/10 text-white'
                                                : 'border-gray-600 hover:border-white hover:bg-white/5'
                                        }`}
                                    >
                    <span className={`mr-2 transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`}>
                      {item.icon}
                    </span>
                                        <span className={`transition-colors ${
                                            isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                                        }`}>
                      {item.shortLabel}
                    </span>
                                    </a>
                                );
                            })}
                        </nav>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg p-2 transition-all duration-200"
                                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMenuOpen}
                            >
                                <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                  <span className={`block h-0.5 bg-current transform transition-all duration-300 ${
                      isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`} />
                                    <span className={`block h-0.5 bg-current transition-all duration-300 ${
                                        isMenuOpen ? 'opacity-0' : ''
                                    }`} />
                                    <span className={`block h-0.5 bg-current transform transition-all duration-300 ${
                                        isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                                    }`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Menu */}
            <div className={`fixed top-16 left-0 right-0 bg-black/95 backdrop-blur border-b border-white/10 z-40 md:hidden transform transition-all duration-300 ease-out ${
                isMenuOpen
                    ? 'translate-y-0 opacity-100'
                    : '-translate-y-full opacity-0 pointer-events-none'
            }`}>
                <nav className="px-4 py-6 space-y-1">
                    {navItems.map((item, index) => {
                        const isActive = currentPath === item.href;
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className={`flex items-center px-4 py-4 rounded-xl transition-all duration-200 group ${
                                    isActive
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                }`}
                                style={{
                                    animationDelay: `${index * 0.1}s`,
                                    animation: isMenuOpen ? 'slideInFromRight 0.3s ease-out forwards' : 'none'
                                }}
                            >
                <span className={`mr-4 p-2 rounded-lg transition-all duration-200 ${
                    isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-800 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  {item.icon}
                </span>
                                <div className="flex-1">
                                    <span className="text-lg font-medium">{item.label}</span>
                                    {isActive && (
                                        <div className="w-2 h-2 bg-white rounded-full ml-auto opacity-80" />
                                    )}
                                </div>
                            </a>
                        );
                    })}
                </nav>

                {/* Social Links or Additional Items */}
                <div className="border-t border-white/10 px-4 py-4">
                    <p className="text-gray-500 text-sm text-center">
                        © 2025 Andres Ravelo
                    </p>
                </div>
            </div>

            {/* Spacer to push content down */}
            <div className="h-16"></div>

            <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </>
    );
};

export default NavBar;