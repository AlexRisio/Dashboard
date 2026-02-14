import { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export default function GlassCard({ children, className = '', delay = 0 }) {
    const ref = useRef(null);

    return (
        <motion.div
            ref={ref}
            className={`neu ${className}`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: delay * 0.08,
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
            }}
        >
            {children}
        </motion.div>
    );
}
