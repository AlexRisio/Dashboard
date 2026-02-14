import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Clock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

    const h = time.getHours(), h12 = h % 12 || 12;
    const m = time.getMinutes();
    const s = time.getSeconds();
    const mins = m.toString().padStart(2, '0');
    const secs = s.toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const greeting = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Late night';


    const hAngle = (h % 12) * 30 + m * 0.5;
    const mAngle = m * 6 + s * 0.1;
    const sAngle = s * 6;


    const ticks = [];
    for (let i = 0; i < 12; i++) {
        const angle = i * 30;
        const rad = (angle * Math.PI) / 180;
        const r = 52;
        const x = 60 + r * Math.sin(rad);
        const y = 60 - r * Math.cos(rad);
        ticks.push({ x, y, angle, major: true });
    }

    return (
        <>
            <div className="wh">
                <h2>Clock</h2>
                <span className="wh-badge">LIVE</span>
            </div>
            <div className="clk-layout">
                <motion.div className="clk-analog"
                    initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                >

                    {ticks.map((t, i) => (
                        <div key={i}
                            className={`clk-tick major`}
                            style={{
                                top: 8,
                                left: '50%',
                                transform: `translateX(-50%) rotate(${t.angle}deg)`,
                                transformOrigin: '50% 52px',
                            }}
                        />
                    ))}


                    <motion.div
                        className="clk-hand clk-hand-h"
                        style={{ transform: `rotate(${hAngle}deg)` }}
                    />


                    <motion.div
                        className="clk-hand clk-hand-m"
                        style={{ transform: `rotate(${mAngle}deg)` }}
                    />


                    <div
                        className="clk-hand clk-hand-s"
                        style={{ transform: `rotate(${sAngle}deg)` }}
                    />


                    <div className="clk-center" />
                </motion.div>

                <div className="clk-digital">
                    <motion.div className="clk-hi"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >{greeting}</motion.div>
                    <div className="clk-time">
                        <AnimatePresence mode="popLayout">
                            {String(h12).split('').map((c, i) => (
                                <motion.span key={`h-${c}-${i}-${h12}`} className="clk-hm"
                                    initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                >{c}</motion.span>
                            ))}
                            <motion.span key="col" className="clk-hm" style={{ color: 'var(--accent)' }}>:</motion.span>
                            {mins.split('').map((c, i) => (
                                <motion.span key={`m-${c}-${i}-${mins}`} className="clk-hm"
                                    initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                                    transition={{ duration: 0.35, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
                                >{c}</motion.span>
                            ))}
                        </AnimatePresence>
                        <AnimatePresence mode="popLayout">
                            <motion.span key={secs} className="clk-sec"
                                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                            >:{secs}</motion.span>
                        </AnimatePresence>
                        <span className="clk-ampm">{ampm}</span>
                    </div>
                    <motion.div className="clk-date"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    >{days[time.getDay()]}, {mons[time.getMonth()]} {time.getDate()}</motion.div>
                </div>
            </div>
        </>
    );
}
