import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiPlus, FiX } from 'react-icons/fi';

const EK = 'dashboard-events';
function loadEv() {
    try {
        return JSON.parse(localStorage.getItem(EK) || 'null') || [
            { id: 1, date: '2026-02-14', title: "Valentine's Day" },
            { id: 2, date: '2026-02-17', title: 'Team celebration' },
            { id: 3, date: '2026-02-20', title: 'Project review' },
        ];
    } catch { return []; }
}
function saveEv(e) { localStorage.setItem(EK, JSON.stringify(e)); }
const DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
    const today = new Date();
    const [mo, setMo] = useState(today.getMonth());
    const [yr, setYr] = useState(today.getFullYear());
    const [evts, setEvts] = useState(loadEv);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [dir, setDir] = useState(0);


    useEffect(() => {
        const handler = () => setEvts(loadEv());
        window.addEventListener('dashboard-update', handler);
        return () => window.removeEventListener('dashboard-update', handler);
    }, []);

    const dim = new Date(yr, mo + 1, 0).getDate();
    const fd = new Date(yr, mo, 1).getDay();
    const pd = new Date(yr, mo, 0).getDate();

    const prev = () => { setDir(-1); mo === 0 ? (setMo(11), setYr(y => y - 1)) : setMo(m => m - 1); };
    const next = () => { setDir(1); mo === 11 ? (setMo(0), setYr(y => y + 1)) : setMo(m => m + 1); };

    const addEv = () => { if (!title.trim() || !date) return; const n = [...evts, { id: Date.now(), date, title: title.trim() }]; setEvts(n); saveEv(n); setTitle(''); setDate(''); };
    const delEv = id => { const n = evts.filter(e => e.id !== id); setEvts(n); saveEv(n); };

    const edSet = new Set(evts.map(e => e.date));
    const ts = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells = [];
    for (let i = fd - 1; i >= 0; i--) cells.push({ d: pd - i, o: true });
    for (let d = 1; d <= dim; d++) {
        const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ d, o: false, t: ds === ts, ev: edSet.has(ds) });
    }
    const r = 42 - cells.length;
    for (let d = 1; d <= r; d++) cells.push({ d, o: true });

    const up = evts.filter(e => e.date >= ts).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

    return (
        <>
            <div className="wh"><h2>Calendar</h2></div>
            <div className="cal-top">
                <motion.button className="btn" onClick={prev} whileTap={{ scale: 0.9 }}>
                    <FiChevronLeft size={13} />
                </motion.button>
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.span key={`${yr}-${mo}`} className="cal-mo"
                        initial={{ opacity: 0, x: dir * 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -25 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >{MN[mo]} {yr}</motion.span>
                </AnimatePresence>
                <motion.button className="btn" onClick={next} whileTap={{ scale: 0.9 }}>
                    <FiChevronRight size={13} />
                </motion.button>
            </div>
            <div className="cal-g">
                {DN.map(d => <div key={d} className="cal-dn">{d}</div>)}
                {cells.map((c, i) => (
                    <motion.div key={`${mo}-${i}`}
                        className={`cal-d ${c.o ? 'dim' : ''} ${c.t ? 'today' : ''} ${c.ev ? 'ev' : ''}`}
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.007, duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
                        whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.85 }}
                    >{c.d}</motion.div>
                ))}
            </div>
            <div className="ev-sec">
                <h3>Upcoming</h3>
                <AnimatePresence initial={false}>
                    {up.length === 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ color: 'var(--t4)', fontFamily: 'var(--mono)', fontSize: '0.68rem', padding: '3px 0' }}
                    >Nothing coming up</motion.div>}
                    {up.map((e, i) => (
                        <motion.div key={e.id} className="ev-r"
                            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }} transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} layout
                        >
                            <span className="ed">{new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="et">{e.title}</span>
                            <button className="ex" onClick={() => delEv(e.id)}><FiX size={11} /></button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div className="ev-f">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <input type="text" placeholder="Event..." value={title}
                        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEv()} />
                    <motion.button onClick={addEv} whileTap={{ scale: 0.92 }}>Add</motion.button>
                </div>
            </div>
        </>
    );
}
