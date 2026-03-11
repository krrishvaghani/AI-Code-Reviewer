'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home',     href: '#home' },
  { label: 'About',    href: '#about' },
  { label: 'Skills',   href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact',  href: '#contact' },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [activeSection, setActive] = useState('home');

  /* Scroll → backdrop + active section tracking */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = NAV_LINKS.map((l) => l.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActive(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#050508]/90 backdrop-blur-xl border-b border-slate-800/60 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/30 select-none">
            KV
          </div>
          <span className="font-semibold text-slate-200 group-hover:text-white transition-colors hidden sm:block tracking-wide">
            Krrish Vaghani
          </span>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.slice(1);
            const isActive = activeSection === id;
            return (
              <li key={href}>
                <a
                  href={href}
                  className={`relative px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-white/8"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href="https://github.com/krrishvaghani"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="#contact"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-900/30"
          >
            Contact
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-[#0d0d14] border-b border-slate-800/60"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-800 mt-3 flex gap-3">
                <a
                  href="https://github.com/krrishvaghani"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  <Github className="w-4 h-4" /> GitHub
                </a>
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
