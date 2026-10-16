import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const Footer = () => (
  <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-md mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand & Platform statement */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <Link to="/" className="text-xl font-black tracking-tight text-slate-900">
            DSMS<span className="text-indigo-600">.</span>
          </Link>
          <span className="text-slate-300 hidden md:inline">|</span>
          <p className="text-xs text-slate-500 font-medium">
            Departmental Society Management System
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link to="/societies" className="hover:text-indigo-600 transition">Societies</Link>
          <Link to="/events" className="hover:text-indigo-600 transition">Events</Link>
          <Link to="/calendar" className="hover:text-indigo-600 transition">Calendar</Link>
          <Link to="/verify" className="hover:text-indigo-600 transition">Verify Certificate</Link>
          <Link to="/news" className="hover:text-indigo-600 transition">Announcements</Link>
        </div>

        {/* Social Connect Icons */}
        <div className="flex items-center gap-2">
          <a
            href="mailto:cssc.dice@gmail.com"
            title="Email cssc.dice@gmail.com"
            aria-label="Email"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition"
          >
            <Mail size={15} />
          </a>
          <a
            href="https://instagram.com/cssc.dice"
            target="_blank"
            rel="noreferrer"
            title="Instagram"
            aria-label="Instagram"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-pink-50 hover:border-pink-300 text-slate-500 hover:text-pink-600 flex items-center justify-center transition"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://linkedin.com/in/muhammad-roshan-ashraf"
            target="_blank"
            rel="noreferrer"
            title="LinkedIn"
            aria-label="LinkedIn"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-500 hover:text-blue-600 flex items-center justify-center transition"
          >
            <LinkedinIcon />
          </a>
          <a
            href="https://github.com/Chaudhary-Roshan"
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            aria-label="GitHub"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
          >
            <GithubIcon />
          </a>
        </div>
      </div>

      {/* Developer Credit Line */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>© {new Date().getFullYear()} University DSMS · All rights reserved.</span>
        <span className="text-center sm:text-right font-medium">
          Developed by <strong className="text-slate-800 font-bold">Muhammad Roshan Ashraf (S23BINCE1M04014)</strong> President of Cyber Security Student Club
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
