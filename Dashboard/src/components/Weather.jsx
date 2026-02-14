import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOC_KEY = 'dashboard-wx-loc';
const WEATHER_CODES = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
    56: 'Freezing Drizzle', 57: 'Freezing Drizzle', 61: 'Light Rain', 63: 'Rain',
    65: 'Heavy Rain', 66: 'Freezing Rain', 67: 'Freezing Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Sleet',
    80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Snow Showers', 86: 'Heavy Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + Hail', 99: 'Thunderstorm + Hail',
};

function cToF(c) { return Math.round(c * 9 / 5 + 32); }
function kToMph(k) { return Math.round(k * 0.621371); }

export default function Weather() {
    const [wx, setWx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(false);
    const [locName, setLocName] = useState('');
    const [locInput, setLocInput] = useState(() => localStorage.getItem(LOC_KEY) || '');
    const [editLoc, setEditLoc] = useState(false);

    const fetchByCoords = async (lat, lon, name) => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&temperature_unit=celsius&wind_speed_unit=kmh`;
            const r = await fetch(url);
            if (!r.ok) throw new Error('Weather API error');
            const d = await r.json();
            const c = d.current;
            setWx({
                temp: cToF(c.temperature_2m),
                cond: WEATHER_CODES[c.weather_code] || 'Unknown',
                humidity: Math.round(c.relative_humidity_2m),
                wind: kToMph(c.wind_speed_10m),
                feels: cToF(c.apparent_temperature),
                uv: Math.round(c.uv_index),
            });
            const wStr = `${cToF(c.temperature_2m)}°F, ${WEATHER_CODES[c.weather_code] || 'Unknown'} in ${name || 'current location'}`;
            localStorage.setItem('dashboard-weather-state', wStr);
            setLocName(name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
            setErr(false);
        } catch {
            setErr(true);
            setWx({ temp: '--', cond: 'Unavailable', humidity: '--', wind: '--', feels: '--', uv: '--' });
            localStorage.setItem('dashboard-weather-state', 'Unavailable');
            setLocName('Weather unavailable');
        }
    };

    const geocodeAndFetch = async (query) => {
        try {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`;
            const gr = await fetch(geoUrl);
            const gd = await gr.json();
            if (!gd.results?.length) throw new Error('Location not found');
            const loc = gd.results[0];
            const name = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}`;
            await fetchByCoords(loc.latitude, loc.longitude, name);
        } catch {
            setErr(true);
            setWx({ temp: '--', cond: 'Unavailable', humidity: '--', wind: '--', feels: '--', uv: '--' });
            setLocName('Location not found');
        }
    };

    const load = async () => {
        setLoading(true);
        const saved = localStorage.getItem(LOC_KEY);
        if (saved) {
            await geocodeAndFetch(saved);
        } else if (navigator.geolocation) {
            try {
                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            // reverse geocode to get city name
                            try {
                                const revUrl = `https://geocoding-api.open-meteo.com/v1/search?name=&count=1&language=en`;
                                await fetchByCoords(pos.coords.latitude, pos.coords.longitude, 'Current Location');
                            } catch {
                                await fetchByCoords(pos.coords.latitude, pos.coords.longitude, 'Current Location');
                            }
                            resolve();
                        },
                        async () => {
                            // Fallback: use a default location
                            await geocodeAndFetch('New York');
                            reject();
                        },
                        { timeout: 5000, maximumAge: 300000 }
                    );
                });
            } catch {
                // already handled
            }
        } else {
            await geocodeAndFetch('New York');
        }
        setLoading(false);
    };

    const setLocation = () => {
        const v = locInput.trim();
        if (v) {
            localStorage.setItem(LOC_KEY, v);
            setEditLoc(false);
            load();
        }
    };

    const clearLocation = () => {
        setLocInput('');
        localStorage.removeItem(LOC_KEY);
        setEditLoc(false);
        load();
    };

    useEffect(() => { load(); }, []);

    return (
        <>
            <div className="wh">
                <h2>Weather</h2>
                <motion.button className="btn-s" onClick={() => setEditLoc(!editLoc)} style={{ marginLeft: 'auto' }}
                    whileTap={{ scale: 0.92 }}
                >{editLoc ? 'Cancel' : 'Location'}</motion.button>
                <motion.button className="btn-s" onClick={load}
                    whileTap={{ scale: 0.92, rotate: 180 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 12 }}
                >Refresh</motion.button>
            </div>

            <AnimatePresence>
                {editLoc && (
                    <motion.div className="wx-locbar" style={{ marginBottom: 14 }}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                    >
                        <input className="inp-sm" placeholder="City name (e.g. Tokyo, London, New York)..."
                            value={locInput} onChange={e => setLocInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && setLocation()} />
                        <motion.button className="btn-s" onClick={setLocation} whileTap={{ scale: 0.92 }}>Set</motion.button>
                        {locInput && <motion.button className="btn-s" onClick={clearLocation} whileTap={{ scale: 0.92 }}>Auto</motion.button>}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="shim" style={{ height: 56, marginBottom: 14 }} />
                        <div className="shim" style={{ height: 48, width: '70%' }} />
                    </motion.div>
                ) : (
                    <motion.div key="d" className="wx-body"
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="wx-hero">
                            <div>
                                <motion.div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.12, type: 'spring', stiffness: 300 }}
                                >
                                    <span className="wx-temp">{wx.temp}</span>
                                    <span className="wx-unit">°F</span>
                                </motion.div>
                                <div className="wx-cond">{wx.cond}</div>
                            </div>
                        </div>
                        <div className="wx-row">
                            {[
                                { l: 'Humidity', v: `${wx.humidity}%` },
                                { l: 'Wind', v: `${wx.wind} mph` },
                                { l: 'Feels Like', v: `${wx.feels}°F` },
                                { l: 'UV Index', v: wx.uv },
                            ].map((s, i) => (
                                <motion.div key={s.l} className="wx-box"
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.05, duration: 0.35 }}
                                >
                                    <div className="wl">{s.l}</div>
                                    <div className="wv">{s.v}</div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div className="wx-loc"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        >
                            {locName}
                            {err && <span style={{ color: 'var(--amber)', marginLeft: 5 }}>(error)</span>}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
