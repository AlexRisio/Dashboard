import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const BREAK_LEN = 5 * 60;
const PRESETS = [15, 20, 25, 30, 45, 60];

export default function Pomodoro() {
    const [focusMins, setFocusMins] = useState(25);
    const [customInput, setCustomInput] = useState('');
    const [total, setTotal] = useState(25 * 60);
    const [left, setLeft] = useState(25 * 60);
    const [running, setRunning] = useState(false);
    const [mode, setMode] = useState('focus');
    const [sessions, setSessions] = useState(0);
    const interval = useRef(null);

    const tick = useCallback(() => {
        setLeft(prev => {
            if (prev <= 1) {
                setRunning(false);
                if (mode === 'focus') {
                    setSessions(s => s + 1);
                    setMode('break');
                    setTotal(BREAK_LEN);
                    return BREAK_LEN;
                } else {
                    setMode('focus');
                    setTotal(focusMins * 60);
                    return focusMins * 60;
                }
            }
            return prev - 1;
        });
    }, [mode, focusMins]);

    useEffect(() => {
        if (running) interval.current = setInterval(tick, 1000);
        else clearInterval(interval.current);
        return () => clearInterval(interval.current);
    }, [running, tick]);

    useEffect(() => {
        const handler = (e) => {
            const m = e.detail?.minutes;
            if (m && m > 0) {
                setRunning(false);
                setMode('focus');
                setFocusMins(m);
                setTotal(m * 60);
                setLeft(m * 60);
            }
        };
        window.addEventListener('timer-set', handler);
        return () => window.removeEventListener('timer-set', handler);
    }, []);

    const setDuration = (mins) => {
        if (running) return;
        const m = Math.max(1, Math.min(120, mins));
        setFocusMins(m);
        if (mode === 'focus') { setTotal(m * 60); setLeft(m * 60); }
    };

    const handleCustom = () => {
        const v = parseInt(customInput);
        if (v && v > 0) { setDuration(v); setCustomInput(''); }
    };

    const reset = () => {
        setRunning(false);
        setMode('focus');
        setTotal(focusMins * 60);
        setLeft(focusMins * 60);
    };

    const mins = String(Math.floor(left / 60)).padStart(2, '0');
    const secs = String(left % 60).padStart(2, '0');
    const pct = 1 - left / total;
    const R = 68;
    const circ = 2 * Math.PI * R;

    return (
        <>
            <div className="wh">
                <h2>Focus Timer</h2>
                <span className="wh-badge">{mode === 'focus' ? 'FOCUS' : 'BREAK'}</span>
            </div>

            <div className="pomo-body">
                <motion.div className="pomo-ring"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                >
                    <svg viewBox="0 0 160 160">
                        <circle className="trk" cx="80" cy="80" r={R} />
                        <circle className="bar" cx="80" cy="80" r={R}
                            strokeDasharray={circ}
                            strokeDashoffset={circ - pct * circ}
                        />
                    </svg>
                    <div className="pomo-ring-inner">
                        <div className="pomo-time">{mins}:{secs}</div>
                        <div className="pomo-label">{mode === 'focus' ? `${focusMins}m focus` : 'Break'}</div>
                    </div>
                </motion.div>

                {!running && mode === 'focus' && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}
                    >
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {PRESETS.map(p => (
                                <motion.button key={p}
                                    className={p === focusMins ? 'btn-primary' : 'btn-s'}
                                    onClick={() => setDuration(p)}
                                    whileTap={{ scale: 0.9 }}
                                    style={{ minWidth: 36, justifyContent: 'center' }}
                                >{p}</motion.button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="inp-sm" type="number" placeholder="Custom min"
                                value={customInput} onChange={e => setCustomInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCustom()}
                                style={{ width: 90, textAlign: 'center' }}
                            />
                            <motion.button className="btn-s" onClick={handleCustom} whileTap={{ scale: 0.9 }}>Set</motion.button>
                        </div>
                    </motion.div>
                )}

                <div className="pomo-ctrls">
                    <motion.button className="btn" onClick={reset} whileTap={{ scale: 0.92 }}>Reset</motion.button>
                    <motion.button
                        className={running ? 'btn' : 'btn-primary'}
                        onClick={() => setRunning(r => !r)}
                        whileTap={{ scale: 0.92 }}
                    >
                        {running ? 'Pause' : 'Start'}
                    </motion.button>
                </div>

                <div className="pomo-sessions">{sessions} session{sessions !== 1 ? 's' : ''} completed</div>
            </div>
        </>
    );
}
