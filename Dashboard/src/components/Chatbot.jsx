import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Chat uses our server API route so the OpenAI key stays on the server (never in the browser).
const useAI = true;

const MSGS_K = 'dashboard-chat-msgs';
const TK = 'dashboard-todos', NK = 'dashboard-notes', EK = 'dashboard-events';
// Same default events as Calendar so we never overwrite them when storage was empty
const DEFAULT_EVENTS = [
    { id: 1, date: '2026-02-14', title: "Valentine's Day" },
    { id: 2, date: '2026-02-17', title: 'Team celebration' },
    { id: 3, date: '2026-02-20', title: 'Project review' },
];
function readDashboard() {
    let todos = [], notes = '', events = [];
    try { todos = JSON.parse(localStorage.getItem(TK) || '[]'); } catch { }
    try { notes = localStorage.getItem(NK) || ''; } catch { }
    try {
        const raw = JSON.parse(localStorage.getItem(EK) || 'null');
        events = Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_EVENTS;
    } catch { events = DEFAULT_EVENTS; }
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weather = localStorage.getItem('dashboard-weather-state') || 'Unknown';
    return {
        todos, events, notes, now, today, weather,
        pending: todos.filter(t => !t.done),
        done: todos.filter(t => t.done),
        upcoming: events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    };
}

function triggerDashboardUpdate() {
    window.dispatchEvent(new CustomEvent('dashboard-update'));
}

function execAction(action) {
    const a = action;
    const type = a.action || a.type;
    const d = readDashboard();

    if (type === 'add_task') {
        const text = a.text || a.title || a.name;
        if (!text) return null;
        if (d.todos.some(t => t.text.toLowerCase() === text.toLowerCase())) return `Task already exists: "${text}"`;
        localStorage.setItem(TK, JSON.stringify([...d.todos, { id: Date.now(), text, done: false }]));
        triggerDashboardUpdate();
        return `Added task: "${text}"`;
    }
    if (type === 'complete_task' || type === 'done_task') {
        const q = (a.text || a.title || a.name || '').toLowerCase();
        const t = d.todos.find(t => !t.done && t.text.toLowerCase().includes(q));
        if (!t) return `Couldn't find pending task "${q}"`;
        t.done = true;
        localStorage.setItem(TK, JSON.stringify(d.todos));
        triggerDashboardUpdate();
        return `Completed: "${t.text}"`;
    }
    if (type === 'delete_task' || type === 'remove_task') {
        const q = (a.text || a.title || a.name || '').toLowerCase();
        const idx = d.todos.findIndex(t => t.text.toLowerCase().includes(q));
        if (idx === -1) return `Couldn't find task "${q}"`;
        const removed = d.todos.splice(idx, 1)[0];
        localStorage.setItem(TK, JSON.stringify(d.todos));
        triggerDashboardUpdate();
        return `Deleted task: "${removed.text}"`;
    }
    if (type === 'add_event') {
        const title = a.title || a.text || a.name;
        const date = a.date;
        if (!title || !date) return null;
        if (d.events.some(e => e.title.toLowerCase() === title.toLowerCase() && e.date === date)) return `Event already exists: "${title}"`;
        localStorage.setItem(EK, JSON.stringify([...d.events, { id: Date.now(), title, date }]));
        triggerDashboardUpdate();
        return `Added event: "${title}" on ${date}`;
    }
    if (type === 'delete_event' || type === 'remove_event') {
        const q = (a.title || a.text || a.name || '').toLowerCase();
        const idx = d.events.findIndex(e => e.title.toLowerCase().includes(q));
        if (idx === -1) return `Couldn't find event "${q}"`;
        const removed = d.events.splice(idx, 1)[0];
        localStorage.setItem(EK, JSON.stringify(d.events));
        triggerDashboardUpdate();
        return `Deleted event: "${removed.title}"`;
    }
    if (type === 'set_timer') {
        const m = parseInt(a.minutes || a.duration);
        if (!m || m < 1) return `Invalid duration.`;
        window.dispatchEvent(new CustomEvent('timer-set', { detail: { minutes: m } }));
        return `Timer set for ${m} minutes.`;
    }
    return null;
}

function parseResponse(text) {
    const actions = [];
    const seen = new Set();
    const addUnique = (obj) => {
        const s = JSON.stringify(obj);
        if (!seen.has(s)) { seen.add(s); actions.push(obj); }
    };

    // First, extract and remove code blocks to avoid double counting
    let displayText = text;
    const blockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
        try {
            addUnique(JSON.parse(match[1]));
            displayText = displayText.replace(match[0], '');
        } catch { }
    }

    // Then scan remaining text for inline JSON
    const inlineRegex = /\{[^{}]*"action"\s*:\s*"[^"]+?"[^{}]*\}/g;
    while ((match = inlineRegex.exec(displayText)) !== null) {
        try {
            addUnique(JSON.parse(match[0]));
            displayText = displayText.replace(match[0], '');
        } catch { }
    }

    return { actions, displayText: displayText.trim() };
}

const SYSTEM = `You are a concise, helpful productivity assistant embedded in a dashboard. You have access to real-time tasks, events, notes, weather, and timer controls.

IMPORTANT RULES:
1. Keep replies brief (1-3 sentences).
2. To perform actions, include a JSON block:
\`\`\`json
{"action": "add_task", "text": "..."}
\`\`\`

Available actions:
- {"action": "add_task", "text": "..."}
- {"action": "complete_task", "text": "partial match"}
- {"action": "delete_task", "text": "partial match"}
- {"action": "add_event", "title": "...", "date": "YYYY-MM-DD"}
- {"action": "delete_event", "title": "partial match"}
- {"action": "set_timer", "minutes": 25}

3. Context: Today is provided. Use it for relative dates.
4. Weather: Use provided weather info if asked.
5. NO DUPLICATES: Do not output the same action twice.`;

async function callOpenAI(history) {
    const d = readDashboard();
    const ctx = `Time: ${d.now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
Today: ${d.now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${d.today})
Tomorrow: ${new Date(d.now.getTime() + 86400000).toISOString().split('T')[0]}
Weather: ${d.weather}
Tasks: ${d.todos.length > 0 ? d.todos.map(t => `${t.done ? '✓' : '○'} ${t.text}`).join(', ') : 'none'}
Events: ${d.events.length > 0 ? d.events.map(e => `${e.title} (${e.date})`).join(', ') : 'none'}
Notes: ${d.notes ? d.notes.substring(0, 200) : 'empty'}`;

    const messages = [
        { role: 'system', content: `${SYSTEM}\n\n---\nDashboard Context:\n${ctx}\n---` },
        ...history.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
    ];

    const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Chat failed (${r.status})`);

    const assistantMessage = data.reply; // { role, content }
    const text = assistantMessage?.content;
    if (!text) throw new Error('Empty response from OpenAI');
    return text;
}

const QUICK = [
    { label: 'Status', q: 'Give me a quick dashboard overview' },
    { label: 'Tasks', q: 'What tasks do I have?' },
    { label: 'Events', q: 'What events are coming up?' },
    { label: 'Plan', q: 'Help me plan my day' },
];

export default function Chatbot() {
    const [msgs, setMsgs] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(MSGS_K));
            if (saved?.length) return saved;
        } catch { }
        return [{
            id: 1, text: 'Hey! I\'m your AI assistant. I can manage your tasks and events or just chat. Try "add a task".',
            sender: 'bot'
        }];
    });
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const msgsRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }, []);

    useEffect(() => { scrollToBottom(); }, [msgs, typing, scrollToBottom]);
    useEffect(() => { localStorage.setItem(MSGS_K, JSON.stringify(msgs.slice(-50))); }, [msgs]);

    const clearChat = () => {
        setMsgs([{ id: Date.now(), text: 'Chat cleared. How can I help?', sender: 'bot' }]);
    };

    const send = async (text) => {
        const q = (text || input).trim();
        if (!q || typing) return;

        const userMsg = { id: Date.now(), text: q, sender: 'user' };
        const updated = [...msgs, userMsg];
        setMsgs(updated);
        setInput('');
        setTyping(true);

        let reply;

        if (useAI) {
            try {
                const raw = await callOpenAI(updated.slice(-14));
                const { actions, displayText } = parseResponse(raw);

                const results = [];
                for (const act of actions) {
                    const r = execAction(act);
                    if (r) results.push(r);
                }

                reply = displayText || results.join('\n') || raw;
            } catch (err) {
                console.error('Chat API error:', err);
                reply = `Sorry, I had trouble connecting to the chat. ${err?.message || 'For local dev, run: vercel dev'}`;
            }
        }

        setMsgs(p => [...p, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
        setTyping(false);
    };

    return (
        <>
            <div className="wh">
                <h2>Assistant</h2>
                {useAI && <span className="wh-badge">GPT-4o</span>}
                <motion.button className="btn-s" onClick={clearChat}
                    style={{ marginLeft: useAI ? 8 : 'auto' }}
                    whileTap={{ scale: 0.9 }}
                >Clear</motion.button>
            </div>

            <div className="cb-chips">
                {QUICK.map((a, i) => (
                    <motion.button key={a.label} className="cb-c" onClick={() => send(a.q)}
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 300 }}
                        whileTap={{ scale: 0.92 }}
                    >{a.label}</motion.button>
                ))}
            </div>

            <div className="cb-msgs" ref={msgsRef}>
                <AnimatePresence initial={false}>
                    {msgs.map(m => (
                        <motion.div key={m.id} className={`cb-b ${m.sender}`}
                            initial={m.sender === 'user' ? { opacity: 0, x: 12 } : { opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                            {m.text.split('\n').map((line, i, a) => <span key={i}>{line}{i < a.length - 1 && <br />}</span>)}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {typing && (
                    <motion.div className="typ-d" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="typ-dot" /><div className="typ-dot" /><div className="typ-dot" />
                    </motion.div>
                )}
            </div>

            <form className="cb-send" onSubmit={e => { e.preventDefault(); send(); }}>
                <input className="inp" placeholder="Ask anything..." value={input}
                    onChange={e => setInput(e.target.value)} />
                <motion.button type="submit" className="btn-primary" whileTap={{ scale: 0.92 }}>Send</motion.button>
            </form>
        </>
    );
}
