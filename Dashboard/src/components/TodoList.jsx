import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiTrash2 } from 'react-icons/fi';

const KEY = 'dashboard-todos';
function load() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || 'null') || [
            { id: 1, text: 'Review project goals', done: false },
            { id: 2, text: 'Update documentation', done: false },
            { id: 3, text: 'Team standup at 10am', done: true },
        ];
    } catch { return []; }
}

export default function TodoList() {
    const [todos, setTodos] = useState(load);
    const [input, setInput] = useState('');
    useEffect(() => { localStorage.setItem(KEY, JSON.stringify(todos)); }, [todos]);


    useEffect(() => {
        const handler = () => setTodos(load());
        window.addEventListener('dashboard-update', handler);
        return () => window.removeEventListener('dashboard-update', handler);
    }, []);

    const add = () => { const t = input.trim(); if (!t) return; setTodos(p => [...p, { id: Date.now(), text: t, done: false }]); setInput(''); };
    const toggle = id => setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
    const del = id => setTodos(p => p.filter(t => t.id !== id));

    const total = todos.length, done = todos.filter(t => t.done).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <>
            <div className="wh">
                <h2>Tasks</h2>
                {total > 0 && <span className="wh-badge">{done}/{total}</span>}
            </div>

            {total > 0 && (
                <div className="td-stats">
                    <div className="td-stats-bar">
                        <motion.div className="td-stats-fill" animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                    <motion.span className="td-stats-txt" key={pct}
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >{pct}%</motion.span>
                </div>
            )}

            <div className="td-top">
                <input className="inp" placeholder="Add a task..." value={input}
                    onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
                <motion.button className="btn-primary" onClick={add}
                    whileTap={{ scale: 0.93 }}
                >Add</motion.button>
            </div>

            <ul className="td-list">
                <AnimatePresence initial={false}>
                    {todos.length === 0 && (
                        <motion.div className="td-empty" initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >All tasks completed</motion.div>
                    )}
                    {todos.map((t, i) => (
                        <motion.li key={t.id} className={`td-item ${t.done ? 'done' : ''}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.3, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                            layout onClick={() => toggle(t.id)}
                        >
                            <motion.div className="td-ck"
                                animate={t.done ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            >
                                <AnimatePresence>
                                    {t.done && (
                                        <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                                        ><FiCheck size={10} color="white" strokeWidth={3} /></motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            <span className="td-txt">{t.text}</span>
                            <motion.button className="td-x" onClick={e => { e.stopPropagation(); del(t.id); }}
                                whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                            ><FiTrash2 size={11} /></motion.button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
            <div className="td-ft">{total - done} remaining</div>
        </>
    );
}
