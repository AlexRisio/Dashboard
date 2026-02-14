import { motion } from 'framer-motion';
import { FaGithub, FaYoutube, FaReddit, FaLinkedin, FaSpotify } from 'react-icons/fa';
import { SiGmail, SiNotion, SiOpenai } from 'react-icons/si';

const LINKS = [
    { name: 'GitHub', url: 'https://github.com', icon: <FaGithub /> },
    { name: 'YouTube', url: 'https://youtube.com', icon: <FaYoutube /> },
    { name: 'Gmail', url: 'https://mail.google.com', icon: <SiGmail /> },
    { name: 'Reddit', url: 'https://reddit.com', icon: <FaReddit /> },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: <FaLinkedin /> },
    { name: 'ChatGPT', url: 'https://chat.openai.com', icon: <SiOpenai /> },
    { name: 'Notion', url: 'https://notion.so', icon: <SiNotion /> },
    { name: 'Spotify', url: 'https://open.spotify.com', icon: <FaSpotify /> },
];

export default function QuickLinks() {
    return (
        <>
            <div className="wh"><h2>Quick Links</h2></div>
            <div className="ql-g">
                {LINKS.map((l, i) => (
                    <motion.a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="ql-a"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    >
                        <span className="qi">{l.icon}</span>
                        <span className="qn">{l.name}</span>
                    </motion.a>
                ))}
            </div>
        </>
    );
}
