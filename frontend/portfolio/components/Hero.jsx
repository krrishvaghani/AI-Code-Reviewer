'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, ArrowDown } from 'lucide-react';

const ROLES = [
  'Full-Stack Developer',
  'AI Engineer',
  'LLM Integrator',
  'Open Source Builder',
];

function useTypewriter(words, typeSpeed = 75, deleteSpeed = 38, pause = 2100) {
  const [text,    setText]    = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [phase,   setPhase]   = useState('typing');

  useEffect(() => {
    const current = words[wordIdx % words.length];
    let t;
    if (phase === 'typing') {
      if (text.length < current.length) {
        t = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed);
      } else {
        t = setTimeout(() => setPhase('deleting'), pause);
      }
    } else {
      if (text.length > 0) {
        t = setTimeout(() => setText((s) => s.slice(0, -1)), deleteSpeed);
      } else {
        setWordIdx((i) => (i + 1) % words.length);
        setPhase('typing');
      }
    }
    return () => clearTimeout(t);
  }, [text, phase, wordIdx, words, typeSpeed, deleteSpeed, pause]);

  return text;
}

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.13 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const STATS = [
  { value: '5+', label: 'Projects built' },
  { value: '2',  label: 'LLM providers' },
  { value: '6+', label: 'Languages reviewed' },
  { value: '1',  label: 'VS Code extension' },
];

export default function Hero() {
  const role = useTypewriter(ROLES);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(148,163,184,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-700/6 rounded-full blur-[130px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Availability badge */}
          <motion.div variants={item} className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-sm font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available for opportunities
            </span>
          </motion.div>

          {/* Name */}
          <motion.div variants={item} className="space-y-2">
            <p className="text-slate-500 text-lg tracking-wide">Hi, I&apos;m</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="bg-linear-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Krrish Vaghani
              </span>
            </h1>
          </motion.div>

          {/* Typewriter role */}
          <motion.div variants={item} className="h-10 flex items-center justify-center">
            <p className="text-xl sm:text-2xl font-mono text-indigo-400 font-medium">
              {role}
              <span className="ml-0.5 inline-block w-[2px] h-[1.1em] bg-indigo-400 align-middle animate-pulse" />
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={item}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            I build{' '}
            <span className="text-slate-200 font-medium">AI-powered developer tools</span> and
            production-ready full-stack applications — specialising in{' '}
            <span className="text-slate-200 font-medium">LLM integration</span>,{' '}
            <span className="text-slate-200 font-medium">FastAPI</span>, and{' '}
            <span className="text-slate-200 font-medium">React</span>.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-indigo-900/30 hover:shadow-indigo-700/40 hover:-translate-y-0.5"
            >
              View Projects
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="https://github.com/krrishvaghani"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 hover:text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={item}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 mt-2 border-t border-slate-800/60"
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center group">
                <div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
