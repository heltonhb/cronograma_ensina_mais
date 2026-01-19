'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { ReactNode } from 'react';

interface MotionProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    duration?: number;
}

export const FadeIn = ({ children, delay = 0, className = "", duration = 0.5 }: MotionProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

export const ScaleIn = ({ children, delay = 0, className = "" }: MotionProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, delay, type: "spring", stiffness: 200, damping: 20 }}
        className={className}
    >
        {children}
    </motion.div>
);

export const StaggerContainer = ({ children, className = "", staggerDelay = 0.1 }: { children: ReactNode, className?: string, staggerDelay?: number }) => (
    <motion.div
        initial="hidden"
        animate="show"
        exit="hidden"
        variants={{
            hidden: { opacity: 0 },
            show: {
                opacity: 1,
                transition: {
                    staggerChildren: staggerDelay
                }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export const StaggerItem = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export const AnimateNumber = ({ value, duration = 2 }: { value: number, duration?: number }) => {
    // Basic number animation component using pure React for simplicity on small values,
    // or we could use framer-motion's useSpring/useTransform if needed.
    // For now, let's keep it simple or strictly visual.
    // Actually, let's just render the value directly for now, 
    // or use a simple counting logic if requested. 
    // Since "Contadores animados" was promised, let's implement a simple hook-based one.

    const [displayValue, setDisplayValue] = React.useState(0);

    React.useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        let totalDuration = duration * 1000;
        let startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            setDisplayValue(Math.floor(ease * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{displayValue}</>;
};
