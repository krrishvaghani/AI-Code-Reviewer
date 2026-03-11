'use client';

import { motion } from 'framer-motion';
import { Github, ExternalLink } from 'lucide-react';

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  'AI review with bug detection & optimisation suggestions',
  'Algorithmic complexity analysis (time & space)',
  'GitHub repository analysis via public API',
  'Automated PR reviews via GitHub webhook',
  'Conversational "chat with code" AI assistant',
  'File upload with auto language detection',
  'JWT authentication + per-user SQLite history',
  'VS Code extension for in-editor reviews',
];

const STACK = [
  'FastAPI', 'Python', 'React', 'Vite', 'Tailwind CSS',
  'Google Gemini', 'OpenAI GPT-4o', 'SQLAlchemy',
  'SQLite', 'JWT', 'Next.js', 'VS Code API',
];

const OTHER_PROJECTS = [
  {
    title: 'Developer Portfolio',
    emoji: '🗂',
    description:
      'This portfolio — built with Next.js 16, Tailwind CSS v4, and Framer Motion. Fully responsive with smooth scroll animations, typewriter effects, and a clean dark-mode design.',
    stack: ['Next.js', 'Tailwind CSS v4', 'Framer Motion', 'React 19'],
    github: 'https://github.com/krrishvaghani',
    demo: '#',
    status: 'live',
  },
  {
    title: 'More in Progress',
    emoji: '🔬',
    description:
      'Always building something new. Currently exploring RAG pipelines, multi-agent LLM systems, real-time collaboration tools, and AI-powered development workflows.',
    stack: ['Python', 'LangChain', 'React', 'FastAPI'],
    github: null,
    demo: null,
    status: 'wip',
  },
];

export default function Projects() {
  return (
    <section id="projects" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#050508] via-[#07070f] to-[#050508]" />
      <div className="absolute left-1/2 -translate-x-1/2 top-1/4 w-[600px] h-[600px] bg-indigo-600/6 rounded-full blur-[140px] pointer-events-none" />

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
              03 / Projects
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              What I&apos;ve built
            </h2>
            <div className="mt-4 h-px w-16 bg-linear-to-r from-indigo-500 to-violet-500" />
          </motion.div>

          {/* ── Featured project: AI Code Reviewer ── */}
          <motion.div
            variants={fadeUp}
            whileHover={{ scale: 1.003, transition: { duration: 0.25 } }}
            className="mb-8 relative rounded-2xl border border-indigo-500/20 bg-linear-to-br from-[#0e0e1a] to-[#0d0d14] overflow-hidden group hover:border-indigo-400/40 transition-all duration-300"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/4 to-violet-600/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="p-7 sm:p-10 relative">
              {/* Top row: identity + links */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-900/30 select-none flex-shrink-0">
                    🤖
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-xl sm:text-2xl font-bold text-white">AI Code Reviewer</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Featured
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm font-mono">
                      Full-Stack Generative AI Platform
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href="https://github.com/krrishvaghani/AI-Code-Reviewer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-white/5 text-sm font-medium transition-all"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-900/20"
                  >
                    <ExternalLink className="w-4 h-4" /> Live Demo
                  </a>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-400 leading-relaxed mb-6 max-w-3xl">
                A production-ready AI code review platform powered by Google Gemini 2.0 and OpenAI
                GPT-4o. It delivers structured, actionable feedback on source code with bug detection,
                optimisation suggestions, and complexity analysis — all behind a modern React dashboard
                with JWT authentication and a persistent review history.
              </p>

              {/* Feature bullets — two column */}
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-2 mb-8">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-indigo-400 flex-shrink-0 mt-0.5 font-bold">▹</span>
                    {f}
                  </div>
                ))}
              </div>

              {/* Tech stack badges */}
              <div className="flex flex-wrap gap-2">
                {STACK.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-indigo-300 text-xs font-medium font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Other project cards ── */}
          <div className="grid sm:grid-cols-2 gap-5">
            {OTHER_PROJECTS.map((project) => (
              <motion.div
                key={project.title}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-[#0d0d14] p-6 group hover:border-slate-700 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{project.emoji}</span>
                    <div>
                      <h3 className="text-white font-semibold text-base">{project.title}</h3>
                      {project.status === 'live' && (
                        <span className="text-xs text-emerald-400 font-mono">● Live</span>
                      )}
                      {project.status === 'wip' && (
                        <span className="text-xs text-amber-400 font-mono">● In Progress</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-slate-300 transition-colors p-1"
                        aria-label="GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {project.demo && project.demo !== '#' && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-slate-300 transition-colors p-1"
                        aria-label="Live demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed flex-1">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 rounded-md bg-white/4 border border-white/6 text-slate-400 text-xs font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
