'use client';

import { motion } from 'framer-motion';

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const CATEGORIES = [
  {
    icon: '🎨',
    title: 'Frontend & UI',
    accent: 'border-blue-500/20',
    glow: 'bg-blue-500/5',
    iconBg: 'bg-blue-500/15 text-blue-200',
    skills: [
      'React 18 / 19', 'Next.js 14+', 'Tailwind CSS', 'Framer Motion',
      'Vite', 'TypeScript', 'HTML5 / CSS3', 'React Router v6',
    ],
  },
  {
    icon: '⚙️',
    title: 'Backend & APIs',
    accent: 'border-emerald-500/20',
    glow: 'bg-emerald-500/5',
    iconBg: 'bg-emerald-500/15 text-emerald-200',
    skills: [
      'FastAPI', 'Python 3.11+', 'Node.js', 'REST APIs',
      'Uvicorn / ASGI', 'Pydantic v2', 'SQLAlchemy 2.0', 'SQLite',
    ],
  },
  {
    icon: '🧠',
    title: 'AI & Machine Learning',
    accent: 'border-violet-500/20',
    glow: 'bg-violet-500/5',
    iconBg: 'bg-violet-500/15 text-violet-200',
    skills: [
      'Google Gemini 2.0', 'OpenAI GPT-4o', 'Prompt Engineering', 'LLM Integration',
      'RAG Pipelines', 'GitHub APIs', 'Webhook Automation', 'Token Optimisation',
    ],
  },
  {
    icon: '🛠',
    title: 'Tools & DevOps',
    accent: 'border-orange-500/20',
    glow: 'bg-orange-500/5',
    iconBg: 'bg-orange-500/15 text-orange-200',
    skills: [
      'Git / GitHub', 'JWT Auth', 'bcrypt / passlib', 'VS Code Ext. API',
      'Render Deploy', 'GitHub Actions', 'Docker (basics)', 'npm / pip',
    ],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#070710]" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

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
              02 / Skills
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Tech stack &amp; expertise
            </h2>
            <div className="mt-4 h-px w-16 bg-linear-to-r from-indigo-500 to-violet-500" />
          </motion.div>

          {/* Category cards */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.title}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border ${cat.accent} ${cat.glow} bg-[#0d0d14] p-5 overflow-hidden group transition-all duration-300`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-br from-white/[0.02] to-transparent transition-opacity duration-300 rounded-2xl pointer-events-none" />

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${cat.iconBg} mb-4`}>
                  {cat.icon}
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-base mb-4">{cat.title}</h3>

                {/* Skill badges */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/[0.07] text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors cursor-default"
                    >
                      {skill}
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
