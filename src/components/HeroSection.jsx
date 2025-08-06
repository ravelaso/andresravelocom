import { useState, useEffect, useRef } from 'react';

const HeroSection = () => {
    const heroRef = useRef(null);
    const animationRef = useRef(null);
    const elementsDataRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0, isMoving: false });

    // Generate floating elements data
    const generateFloatingElements = () => {
        const svgIcons = [
            // Music note
            `<ellipse cx="7" cy="17" rx="2" ry="1.5" stroke="currentColor" stroke-width="1.5" fill="currentColor"/><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M9 17V6l7-2v11"/><ellipse cx="14" cy="15" rx="2" ry="1.5" stroke="currentColor" stroke-width="1.5" fill="currentColor"/>`,

            // Camera
            `<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M14.5 4h-5L7 6H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-2.5-2z"/><circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>`,

            // Code brackets
            `<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" d="m18 16 4-4-4-4M6 8l-4 4 4 4"/>`,
        ];

        const sizes = ["w-6 h-6", "w-7 h-7", "w-8 h-8", "w-10 h-10"];
        const opacities = ["opacity-50"];
        const colors = ["text-gray-200"];

        const elements = [];
        for (let i = 0; i < 50; i++) {
            elements.push({
                id: i,
                top: Math.floor(Math.random() * 90) + 5,
                left: Math.floor(Math.random() * 90) + 5,
                svgPath: svgIcons[Math.floor(Math.random() * svgIcons.length)],
                sizeClass: sizes[Math.floor(Math.random() * sizes.length)],
                opacityClass: opacities[Math.floor(Math.random() * opacities.length)],
                colorClass: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        return elements;
    };

    const [floatingElements] = useState(() => generateFloatingElements());

    useEffect(() => {
        const heroSection = heroRef.current;
        if (!heroSection) return;

        // Configuration
        const CONFIG = {
            INITIAL_VELOCITY: 0.03,
            MAX_SPEED: 0.08,
            FRICTION: 0.895,
            RETURN_FORCE: 0.003,
            BOUNDARY_PUSH: 0.005,
            COLLISION_RADIUS: 3,
            COLLISION_FORCE: 0.02,
            MOUSE_DISTANCE: 10,
            MOUSE_REPEL_FORCE: 0.05,
            GLOW_MAX_SIZE: 40,
            SCALE_MAX: 0.2,
            TARGET_FPS: 60,
            BOUNDARY_MARGIN: 5,
            ICON_COUNT: {
                mobile: 8,
                tablet: 15,
                desktop: 35,
                large: 50
            }
        };

        function getDeviceType() {
            const width = window.innerWidth;
            if (width < 640) return 'mobile';
            if (width < 1024) return 'tablet';
            if (width < 1440) return 'desktop';
            return 'large';
        }

        // Get visible elements
        const floatingDivs = heroSection.querySelectorAll('.floating-element');
        const targetIconCount = CONFIG.ICON_COUNT[getDeviceType()];
        const visibleElements = Array.from(floatingDivs).slice(0, targetIconCount);

        // Hide excess elements
        floatingDivs.forEach((el, index) => {
            el.style.display = index < targetIconCount ? '' : 'none';
        });

        // Initialize elements data
        elementsDataRef.current = visibleElements.map((element, index) => ({
            element,
            id: index,
            x: parseFloat(element.style.left) || Math.random() * 90 + 5,
            y: parseFloat(element.style.top) || Math.random() * 90 + 5,
            vx: (Math.random() - 0.5) * CONFIG.INITIAL_VELOCITY,
            vy: (Math.random() - 0.5) * CONFIG.INITIAL_VELOCITY,
            radius: CONFIG.COLLISION_RADIUS,
            originalX: parseFloat(element.style.left) || Math.random() * 90 + 5,
            originalY: parseFloat(element.style.top) || Math.random() * 90 + 5
        }));

        // Set initial positions
        elementsDataRef.current.forEach(data => {
            data.element.style.left = `${data.x}%`;
            data.element.style.top = `${data.y}%`;
        });

        let lastTime = 0;
        const frameTime = 1000 / CONFIG.TARGET_FPS;

        // Mobile optimizations
        const deviceType = getDeviceType();
        if (deviceType === 'mobile') {
            CONFIG.INITIAL_VELOCITY *= 0.5;
            CONFIG.MAX_SPEED *= 0.5;
            CONFIG.MOUSE_REPEL_FORCE *= 0.5;
        }

        // Animation functions
        function updatePositions() {
            elementsDataRef.current.forEach(data => {
                const dx = data.originalX - data.x;
                const dy = data.originalY - data.y;

                data.vx += dx * CONFIG.RETURN_FORCE;
                data.vy += dy * CONFIG.RETURN_FORCE;
                data.vx *= CONFIG.FRICTION;
                data.vy *= CONFIG.FRICTION;

                data.x += data.vx;
                data.y += data.vy;

                // Boundary constraints
                if (data.x < CONFIG.BOUNDARY_MARGIN) {
                    data.vx += (CONFIG.BOUNDARY_MARGIN - data.x) * CONFIG.BOUNDARY_PUSH;
                }
                if (data.x > 95 - CONFIG.BOUNDARY_MARGIN) {
                    data.vx -= (data.x - (95 - CONFIG.BOUNDARY_MARGIN)) * CONFIG.BOUNDARY_PUSH;
                }
                if (data.y < CONFIG.BOUNDARY_MARGIN) {
                    data.vy += (CONFIG.BOUNDARY_MARGIN - data.y) * CONFIG.BOUNDARY_PUSH;
                }
                if (data.y > 95 - CONFIG.BOUNDARY_MARGIN) {
                    data.vy -= (data.y - (95 - CONFIG.BOUNDARY_MARGIN)) * CONFIG.BOUNDARY_PUSH;
                }

                data.element.style.left = `${data.x}%`;
                data.element.style.top = `${data.y}%`;
            });
        }

        function checkCollisions() {
            const elementsData = elementsDataRef.current;
            for (let i = 0; i < elementsData.length; i++) {
                for (let j = i + 1; j < elementsData.length; j++) {
                    const a = elementsData[i];
                    const b = elementsData[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < a.radius) {
                        const angle = Math.atan2(dy, dx);
                        a.vx += Math.cos(angle) * CONFIG.COLLISION_FORCE;
                        a.vy += Math.sin(angle) * CONFIG.COLLISION_FORCE;
                        b.vx -= Math.cos(angle) * CONFIG.COLLISION_FORCE;
                        b.vy -= Math.sin(angle) * CONFIG.COLLISION_FORCE;

                        // Limit velocity
                        a.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, a.vx));
                        a.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, a.vy));
                        b.vx = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, b.vx));
                        b.vy = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, b.vy));
                    }
                }
            }
        }

        function animate(currentTime) {
            if (currentTime - lastTime >= frameTime) {
                updatePositions();
                checkCollisions();
                lastTime = currentTime;
            }
            animationRef.current = requestAnimationFrame(animate);
        }

        function updateMouseEffects() {
            if (!mouseRef.current.isMoving) return;

            elementsDataRef.current.forEach(data => {
                const dx = mouseRef.current.x - data.x;
                const dy = mouseRef.current.y - data.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONFIG.MOUSE_DISTANCE) {
                    const intensity = Math.max(0, (CONFIG.MOUSE_DISTANCE - distance) / CONFIG.MOUSE_DISTANCE);
                    const glowSize = Math.round(intensity * CONFIG.GLOW_MAX_SIZE);
                    const opacity = intensity * 2;
                    const brightness = 1 + intensity * 2;
                    const scale = 1 + intensity * CONFIG.SCALE_MAX;

                    data.element.style.filter = `
            drop-shadow(0 0 ${glowSize}px rgba(0, 150, 255, ${opacity}))
            drop-shadow(0 0 ${glowSize * 1.5}px rgba(100, 200, 255, ${opacity * 0.8}))
            brightness(${brightness})
          `;
                    data.element.style.transform = `scale(${scale})`;
                    data.element.style.transition = 'none';

                    const angle = Math.atan2(data.y - mouseRef.current.y, data.x - mouseRef.current.x);
                    data.vx += Math.cos(angle) * CONFIG.MOUSE_REPEL_FORCE * intensity;
                    data.vy += Math.sin(angle) * CONFIG.MOUSE_REPEL_FORCE * intensity;
                } else {
                    data.element.style.filter = '';
                    data.element.style.transform = '';
                    data.element.style.transition = 'filter 0.15s ease-out, transform 0.15s ease-out';
                }
            });

            mouseRef.current.isMoving = false;
        }

        // Event handlers
        function handleMouseMove(e) {
            const rect = heroSection.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 100;
            mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * 100;
            mouseRef.current.isMoving = true;
            requestAnimationFrame(updateMouseEffects);
        }

        function handleMouseLeave() {
            elementsDataRef.current.forEach(data => {
                data.element.style.filter = '';
                data.element.style.transform = '';
                data.element.style.transition = 'filter 0.2s ease-out, transform 0.2s ease-out';
            });
        }

        // Add event listeners
        heroSection.addEventListener('mousemove', handleMouseMove);
        heroSection.addEventListener('mouseleave', handleMouseLeave);

        // Start animation
        animate(0);

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            heroSection.removeEventListener('mousemove', handleMouseMove);
            heroSection.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative bg-black min-h-screen flex items-center justify-center overflow-hidden"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-gray-900 to-gray-800">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '80px 80px'
                    }}
                />
            </div>

            {/* Floating Elements Container */}
            <div className="absolute inset-0 pointer-events-none">
                {floatingElements.map((element) => (
                    <div
                        key={element.id}
                        className={`floating-element absolute ${element.opacityClass} ${element.colorClass}`}
                        style={{
                            top: `${element.top}%`,
                            left: `${element.left}%`,
                            willChange: 'transform, left, top',
                            transition: 'filter 0.15s ease-out, transform 0.15s ease-out'
                        }}
                    >
                        <svg
                            className={element.sizeClass}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            dangerouslySetInnerHTML={{ __html: element.svgPath }}
                        />
                    </div>
                ))}
            </div>

            <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                {/* Main Title */}
                <div className="mb-16 text-center">
                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight">
                        <span className="font-extralight text-gray-300">ANDRES</span>
                        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              RAVELO
            </span>
                    </h1>

                    {/* Interactive Role Buttons */}
                    <div className="flex flex-wrap justify-center gap-6 text-lg sm:text-xl font-medium mb-12">
                        <a href="/music" className="group flex items-center px-6 py-3 rounded-full border-2 border-gray-600 hover:border-white transition-all duration-300 hover:bg-white/5">
                            <div className="w-10 h-10 mr-4 rounded-full border border-gray-500 group-hover:border-white flex items-center justify-center transition-all duration-300">
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                                </svg>
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Music</span>
                        </a>

                        <a href="/code" className="group flex items-center px-6 py-3 rounded-full border-2 border-gray-600 hover:border-white transition-all duration-300 hover:bg-white/5">
                            <div className="w-10 h-10 mr-4 rounded-full border border-gray-500 group-hover:border-white flex items-center justify-center transition-all duration-300">
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Code</span>
                        </a>

                        <a href="/photography" className="group flex items-center px-6 py-3 rounded-full border-2 border-gray-600 hover:border-white transition-all duration-300 hover:bg-white/5">
                            <div className="w-10 h-10 mr-4 rounded-full border border-gray-500 group-hover:border-white flex items-center justify-center transition-all duration-300">
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Photography</span>
                        </a>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-lg sm:text-xl font-medium mb-12">
                        {/* TODO: Github, Instagram, Spotify */}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;