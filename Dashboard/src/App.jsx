import { motion } from 'framer-motion';
import GlassCard from './components/GlassCard';
import Clock from './components/Clock';
import TodoList from './components/TodoList';
import Weather from './components/Weather';
import Calendar from './components/Calendar';
import Quote from './components/Quote';
import QuickLinks from './components/QuickLinks';
import Notes from './components/Notes';
import Chatbot from './components/Chatbot';
import Pomodoro from './components/Pomodoro';

export default function App() {
  return (
    <div className="dashboard">
      <div className="grid">
        <GlassCard className="g-clock" delay={1}><Clock /></GlassCard>
        <GlassCard className="g-weather" delay={2}><Weather /></GlassCard>
        <GlassCard className="g-quote" delay={3}><Quote /></GlassCard>
        <GlassCard className="g-todo" delay={4}><TodoList /></GlassCard>
        <GlassCard className="g-calendar" delay={5}><Calendar /></GlassCard>
        <GlassCard className="g-pomo" delay={6}><Pomodoro /></GlassCard>
        <GlassCard className="g-chat" delay={7}><Chatbot /></GlassCard>
        <GlassCard className="g-links" delay={8}><QuickLinks /></GlassCard>
        <GlassCard className="g-notes" delay={9}><Notes /></GlassCard>
      </div>
    </div>
  );
}
