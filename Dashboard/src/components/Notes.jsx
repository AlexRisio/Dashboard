import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const K = 'dashboard-notes';

export default function Notes() {
    const [text, setText] = useState(() => { try { return localStorage.getItem(K) || ''; } catch { return ''; } });
    const [saved, setSaved] = useState(false);
    const t = useRef(null);

    useEffect(() => {
        if (t.current) clearTimeout(t.current);
        t.current = setTimeout(() => { localStorage.setItem(K, text); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 400);
        return () => clearTimeout(t.current);
    }, [text]);

    return (
        <>
            <div className="wh"><h2>Notes</h2></div>
            <motion.textarea className="n-ta"
                placeholder={"Jot something down...\n\nAuto-saves as you type."}
                value={text} onChange={e => setText(e.target.value)}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            />
            <div className="n-meta">
                <span className="nc">{text.length} chars</span>
                <AnimatePresence>
                    {saved && (
                        <motion.span className="ns"
                            initial={{ opacity: 0, y: 3, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -3, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >Saved</motion.span>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
