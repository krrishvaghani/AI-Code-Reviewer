import { Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-[#050508]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo + credit */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs select-none">
            KV
          </div>
          <div>
            <div className="text-slate-300 font-semibold text-sm">Krrish Vaghani</div>
            <div className="text-slate-600 text-xs mt-0.5">
              Built with Next.js · Tailwind CSS v4 · Framer Motion &nbsp;·&nbsp; © {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/krrishvaghani"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="p-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="#"
            aria-label="LinkedIn"
            className="p-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href="mailto:krrishvaghani@example.com"
            aria-label="Email"
            className="p-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
