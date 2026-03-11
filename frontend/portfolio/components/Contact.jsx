'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Send, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const SOCIALS = [
  {
    name: 'GitHub',
    href: 'https://github.com/krrishvaghani',
    icon: Github,
    handle: '@krrishvaghani',
    hoverClass: 'hover:border-slate-500 hover:bg-slate-500/10 hover:text-slate-200',
  },
  {
    name: 'LinkedIn',
    href: '#',
    icon: Linkedin,
    handle: 'Krrish Vaghani',
    hoverClass: 'hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-300',
  },
  {
    name: 'Email',
    href: 'mailto:krrishvaghani@example.com',
    icon: Mail,
    handle: 'krrishvaghani@example.com',
    hoverClass: 'hover:border-indigo-500/60 hover:bg-indigo-500/10 hover:text-indigo-300',
  },
];

export default function Contact() {
  const [form,   setForm]   = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    /* Replace with real email/API integration (e.g. Resend, Formspree) */
    setTimeout(() => {
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    }, 1400);
  };

  return (
    <section id="contact" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#070710]" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[600px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Section header */}
          <motion.div variants={fadeUp} className="mb-14">
            <p className="text-indigo-400 text-sm font-mono font-medium tracking-[0.2em] uppercase mb-3">
              04 / Contact
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Let&apos;s work together
            </h2>
            <div className="mt-4 h-px w-16 bg-linear-to-r from-indigo-500 to-violet-500" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: blurb + social links */}
            <motion.div variants={fadeUp} className="space-y-7">
              <p className="text-slate-400 text-lg leading-relaxed">
                I&apos;m open to{' '}
                <span className="text-white font-medium">full-time roles</span>,{' '}
                <span className="text-white font-medium">freelance projects</span>, and
                interesting collaborations. Whether you have a product idea, an AI integration
                challenge, or just want to connect — I&apos;d love to hear from you.
              </p>

              <div className="space-y-3">
                {SOCIALS.map(({ name, href, icon: Icon, handle, hoverClass }) => (
                  <motion.a
                    key={name}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border border-slate-800/60 bg-[#0d0d14] transition-all duration-200 group ${hoverClass}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                        {name}
                      </div>
                      <div className="text-slate-300 text-sm font-mono mt-0.5 truncate">
                        {handle}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto text-slate-700 group-hover:text-current flex-shrink-0 transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Right: contact form */}
            <motion.div variants={fadeUp}>
              <form
                onSubmit={handleSubmit}
                className="space-y-4 p-6 sm:p-8 rounded-2xl border border-slate-800/60 bg-[#0d0d14]"
              >
                <div>
                  <label htmlFor="name" className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className="w-full rounded-xl bg-[#111118] border border-slate-700/60 text-white placeholder-slate-600 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/70 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl bg-[#111118] border border-slate-700/60 text-white placeholder-slate-600 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/70 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project or opportunity…"
                    required
                    rows={5}
                    className="w-full rounded-xl bg-[#111118] border border-slate-700/60 text-white placeholder-slate-600 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/70 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status !== 'idle'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-800/30"
                >
                  {status === 'sending' && (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending…
                    </>
                  )}
                  {status === 'sent' && <>✓ Message sent!</>}
                  {status === 'idle' && (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
