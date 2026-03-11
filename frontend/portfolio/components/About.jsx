'use client';

import { motion } from 'framer-motion';
import { MapPin, GraduationCap, Briefcase, Code2, Coffee } from 'lucide-react';

const fadeUp = {
  hidden:   { opacity: 0, y: 32 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1 } },
};

const INFO_ITEMS = [
  { icon: MapPin,        label: 'Location',  value: 'India' },
  { icon: GraduationCap, label: 'Education', value: 'Computer Science' },
  { icon: Briefcase,     label: 'Status',    value: 'Open to Work' },
  { icon: Code2,         label: 'Focus',     value: 'AI & Full-Stack' },
  { icon: Coffee,        label: 'Fuelled by',value: 'Coffee & curiosity' },
];

export default function About() {
  return (
    <section id="about" className="py-28 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-[#050508] via-[#070710] to-[#050508]" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-violet-700/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Section header */}
          <motion.div variants={fadeUp} className="mb-14">
            <p className="text-indigo-400 text-sm font-mono font-medium tracking-[0.2em] uppercase mb-3">
              01 / About
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              A bit about me
            </h2>
            <div className="mt-4 h-px w-16 bg-linear-to-r from-indigo-500 to-violet-500" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Bio */}
            <motion.div variants={fadeUp} className="space-y-5">
              <p className="text-slate-300 text-lg leading-relaxed">
                I&apos;m a full-stack developer with a passion for building{' '}
                <span className="text-white font-medium">AI-powered applications</span> that solve
                real developer problems. I love the intersection of cutting-edge AI research and
                practical software engineering.
              </p>
              <p className="text-slate-400 leading-relaxed">
                My flagship project —{' '}
                <span className="text-indigo-400 font-medium">AI Code Reviewer</span> — is a
                production-ready platform that integrates Google Gemini and OpenAI GPT-4 to deliver
                instant, structured code feedback: bug detection, optimisation suggestions, complexity
                analysis, GitHub repository analysis, and automated PR reviews via webhooks. It ships
                with JWT authentication, per-user SQLite history, and a VS Code extension.
              </p>
              <p className="text-slate-400 leading-relaxed">
                I&apos;m constantly exploring new techniques — from prompt engineering and RAG pipelines
                to backend architecture and modern frontend patterns. I believe in writing clean,
                well-structured code that teams can maintain and scale.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 hover:border-indigo-400/60 hover:bg-indigo-500/15 font-medium text-sm transition-all duration-200"
                >
                  Download Resume
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
                <a
                  href="#projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 hover:text-white font-medium text-sm transition-all duration-200"
                >
                  View Projects
                </a>
              </div>
            </motion.div>

            {/* Profile card */}
            <motion.div variants={fadeUp}>
              <div className="rounded-2xl border border-slate-800/60 bg-[#0d0d14] overflow-hidden">
                {/* Card header — avatar */}
                <div className="bg-linear-to-br from-indigo-900/20 to-violet-900/15 px-8 py-8 flex flex-col items-center text-center border-b border-slate-800/60">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-900/30 mb-4 select-none cursor-default"
                  >
                    KV
                  </motion.div>
                  <h3 className="text-white font-bold text-lg">Krrish Vaghani</h3>
                  <p className="text-indigo-400 text-sm font-mono mt-1">AI & Full-Stack Developer</p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-medium">Available for opportunities</span>
                  </div>
                </div>

                {/* Card body — info rows */}
                <div className="px-6 py-2 divide-y divide-slate-800/60">
                  {INFO_ITEMS.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2.5 text-slate-400 text-sm">
                        <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        {label}
                      </div>
                      <span className="text-slate-300 text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
