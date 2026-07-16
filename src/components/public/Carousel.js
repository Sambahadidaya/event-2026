'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({
    items,
    renderItem,
    animated = true,
    autoPlay = true,
    autoplayDelay = 2000,
    className = ''
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [windowWidth, setWindowWidth] = useState(1024);
    const startX = useRef(null);
    const timerRef = useRef(null);
    const containerRef = useRef(null);

    const len = items.length;

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % len);
    }, [len]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + len) % len);
    }, [len]);

    // Autoplay
    useEffect(() => {
        if (animated && autoPlay && !isHovered && !isDragging) {
            timerRef.current = setInterval(nextSlide, autoplayDelay);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [animated, isHovered, isDragging, autoplayDelay, nextSlide]);

    // Drag/Swipe handlers
    const handleDragStart = (clientX) => {
        startX.current = clientX;
        setIsDragging(true);
    };

    const handleDragEnd = (clientX) => {
        if (startX.current === null) return;
        const diff = startX.current - clientX;
        if (diff > 50) nextSlide();
        else if (diff < -50) prevSlide();
        startX.current = null;
        setIsDragging(false);
    };

    if (!animated) {
        // Static scrollable mode (Jelajahi)
        return (
            <div className={`relative w-full overflow-hidden pb-16 ${className}`}>
                <div
                    ref={containerRef}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-4 px-4 md:px-8 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onScroll={(e) => {
                        if (!e.target) return;
                        const scrollLeft = e.target.scrollLeft;
                        const itemWidth = e.target.scrollWidth / len;
                        const newIndex = Math.round(scrollLeft / itemWidth);
                        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < len) {
                            setCurrentIndex(newIndex);
                        }
                    }}
                >
                    {items.map((item, idx) => (
                        <div key={idx} className="snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]">
                            {renderItem(item, idx)}
                        </div>
                    ))}
                </div>

                {/* Navigation Controls */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/40 dark:border-white/10 z-50">
                    <button
                        onClick={() => {
                            if (containerRef.current) {
                                const itemWidth = containerRef.current.scrollWidth / len;
                                containerRef.current.scrollBy({ left: -itemWidth, behavior: 'smooth' });
                            }
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-1.5 text-sm font-bold">
                    <span className={`text-gray-900 dark:text-white text-center ${windowWidth >= 1024 ? 'min-w-[2.5rem]' : 'min-w-[1.2rem]'}`}>
                        {windowWidth >= 1024 
                            ? `${((currentIndex - 1 + len) % len) + 1}-${((currentIndex + 1) % len) + 1}`
                            : currentIndex + 1
                        }
                    </span>
                        <span className="text-gray-400 dark:text-gray-500">/</span>
                        <span className="text-gray-500 dark:text-gray-400 min-w-[1.2rem] text-center">
                            {len}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            if (containerRef.current) {
                                const itemWidth = containerRef.current.scrollWidth / len;
                                containerRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
                            }
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    // Animated Coverflow Mode
    return (
        <div
            className={`relative w-full h-[420px] sm:h-[480px] pb-12 flex items-center justify-center overflow-hidden ${className} select-none touch-pan-y cursor-grab active:cursor-grabbing`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsDragging(false);
                startX.current = null;
            }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseUp={(e) => handleDragEnd(e.clientX)}
        >
            <div className="relative w-full max-w-6xl h-full flex items-center justify-center pointer-events-none">
                {items.map((item, idx) => {
                    let offset = idx - currentIndex;
                    if (offset < -Math.floor(len / 2)) offset += len;
                    if (offset > Math.floor(len / 2)) offset -= len;

                    // Support up to 5 visible items ideally, but keep it simple
                    const isCenter = offset === 0;

                    let translateX = 0;
                    let scale = 1;
                    let zIndex = 0;
                    let opacity = 0;
                    let blur = 'blur-md';

                    const isMobile = windowWidth < 640;
                    const isLg = windowWidth >= 1024;
                    const shiftX = isMobile ? 60 : 70; // percentage shift for below lg

                    if (isCenter) {
                        translateX = 0;
                        scale = 1;
                        zIndex = 30;
                        opacity = 1;
                        blur = 'blur-0';
                    } else if (offset === 1) {
                        translateX = isLg ? 105 : shiftX;
                        scale = isLg ? 0.95 : 0.85;
                        zIndex = 20;
                        opacity = isLg ? 1 : 0.8;
                        blur = isLg ? 'blur-0' : 'blur-sm';
                    } else if (offset === -1) {
                        translateX = isLg ? -105 : -shiftX;
                        scale = isLg ? 0.95 : 0.85;
                        zIndex = 20;
                        opacity = isLg ? 1 : 0.8;
                        blur = isLg ? 'blur-0' : 'blur-sm';
                    } else if (offset === 2) {
                        translateX = isLg ? 190 : shiftX * 2;
                        scale = isLg ? 0.8 : 0.7;
                        zIndex = 10;
                        opacity = isLg ? 0.6 : 0;
                        blur = isLg ? 'blur-sm' : 'blur-md';
                    } else if (offset === -2) {
                        translateX = isLg ? -190 : -shiftX * 2;
                        scale = isLg ? 0.8 : 0.7;
                        zIndex = 10;
                        opacity = isLg ? 0.6 : 0;
                        blur = isLg ? 'blur-sm' : 'blur-md';
                    }

                    return (
                        <div
                            key={idx}
                            className={`absolute top-1/2 -translate-y-1/2 w-[85%] sm:w-[50%] md:w-[32%] transition-all duration-700 ease-in-out pointer-events-auto ${zIndex >= 20 ? 'cursor-pointer' : 'pointer-events-none'} ${blur}`}
                            style={{
                                zIndex: zIndex,
                                opacity: opacity,
                                transform: `translateX(${translateX}%) scale(${scale})`,
                            }}
                            onClick={() => {
                                if (offset === 1) nextSlide();
                                if (offset === -1) prevSlide();
                            }}
                        >
                            {renderItem(item, idx, isCenter)}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/40 dark:border-white/10 z-50 pointer-events-auto">
                <button
                    onClick={prevSlide}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-1.5 text-sm font-bold">
                    <span className={`text-gray-900 dark:text-white text-center ${windowWidth >= 1024 ? 'min-w-[2.5rem]' : 'min-w-[1.2rem]'}`}>
                        {windowWidth >= 1024 
                            ? `${((currentIndex - 1 + len) % len) + 1}-${((currentIndex + 1) % len) + 1}`
                            : currentIndex + 1
                        }
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">/</span>
                    <span className="text-gray-500 dark:text-gray-400 min-w-[1.2rem] text-center">
                        {len}
                    </span>
                </div>

                <button
                    onClick={nextSlide}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
