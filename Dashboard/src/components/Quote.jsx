import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Q = [
    { t: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
    { t: "Innovation distinguishes between a leader and a follower.", a: "Steve Jobs" },
    { t: "Stay hungry, stay foolish.", a: "Steve Jobs" },
    { t: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
    { t: "It is during our darkest moments that we must focus to see the light.", a: "Aristotle" },
    { t: "The best time to plant a tree was 20 years ago. The second best time is now.", a: "Chinese Proverb" },
    { t: "Your time is limited, do not waste it living someone else's life.", a: "Steve Jobs" },
    { t: "Believe you can and you are halfway there.", a: "Theodore Roosevelt" },
    { t: "Simplicity is the ultimate sophistication.", a: "Leonardo da Vinci" },
    { t: "Whether you think you can or you think you cannot, you are right.", a: "Henry Ford" },
    { t: "The best revenge is massive success.", a: "Frank Sinatra" },
];

export default function Quote() {
    const [q, setQ] = useState(null);
    const shuffle = useCallback(() => {
        const currentIndex = q ? Q.findIndex((item) => item.t === q.t) : -1;
        let nextIndex = Math.floor(Math.random() * Q.length);
        if (Q.length > 1 && currentIndex >= 0) {
            while (nextIndex === currentIndex) {
                nextIndex = Math.floor(Math.random() * Q.length);
            }
        }
        setQ(Q[nextIndex]);
    }, [q]);
    useEffect(() => {
        setQ(Q[Math.floor(Math.random() * Q.length)]);
    }, []);

    return (
        <>
            <div className="wh"><h2>Inspiration</h2></div>
            <AnimatePresence mode="wait">
                {q && (
                    <motion.div key={q.t} className="qt-well"
                        initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="qt-t">{q.t}</div>
                        <motion.div className="qt-a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            -- {q.a}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button className="btn-s" onClick={shuffle} style={{ marginTop: 14 }}
                whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            >New Quote</motion.button>
        </>
    );
}
