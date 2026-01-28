// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail, Heart } from "lucide-react";
import LogoNostressia from "../assets/images/Logo-Nostressia.png"; 

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-30 mt-6 border-t border-border/50 bg-surface/70 backdrop-blur-md dark:border-border/60 dark:bg-surface/80 glass-panel">
      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-3 md:pt-8 md:pb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          
          {/* KOLOM 1: Brand & Deskripsi */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <img 
                src={LogoNostressia} 
                alt="Nostressia Logo" 
                className="h-8 w-auto" 
              />
              <span className="text-xl font-extrabold text-text-primary tracking-tight dark:text-text-primary">
                Nostressia
              </span>
            </Link>
            <p className="text-text-secondary leading-relaxed text-xs md:text-sm pr-10 dark:text-text-secondary">
              Your daily companion for mental wellness. We help you track your mood and find motivation.
            </p>
          </div>

          {/* KOLOM 2: Quick Links */}
          <div className="md:col-span-3">
            <h3 className="text-text-primary text-sm font-bold mb-2 dark:text-text-primary">Explore</h3>
            <ul className="space-y-1.5">
              <li><Link to="/dashboard" className="text-text-secondary hover:text-brand-primary transition-colors text-xs font-medium dark:text-text-secondary dark:hover:text-brand-info">Dashboard</Link></li>
              <li><Link to="/tips" className="text-text-secondary hover:text-brand-primary transition-colors text-xs font-medium dark:text-text-secondary dark:hover:text-brand-info">Daily Tips</Link></li>
              <li><Link to="/motivation" className="text-text-secondary hover:text-brand-primary transition-colors text-xs font-medium dark:text-text-secondary dark:hover:text-brand-info">Motivation</Link></li>
              <li><Link to="/diary" className="text-text-secondary hover:text-brand-primary transition-colors text-xs font-medium dark:text-text-secondary dark:hover:text-brand-info">My Diary</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="md:col-span-4">
            <h3 className="text-text-primary text-sm font-bold mb-2 dark:text-text-primary">Contact Us</h3>
            <p className="text-text-secondary text-xs mb-3 dark:text-text-secondary">
              Have questions? Reach out to us directly via email.
            </p>
            
            {/* Clearer "Contact Us" button */}
            <div className="flex flex-col gap-3">
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=nostressia.official@gmail.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-fit px-4 py-2 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-brand-accent hover:border-brand-accent/40 hover:shadow-sm transition-all group dark:bg-surface-muted dark:border-border dark:text-text-secondary dark:hover:text-brand-accent"
              >
                <Mail size={16} className="text-text-muted group-hover:text-brand-accent dark:text-text-secondary" />
                <span className="text-xs font-semibold">Contact Support</span>
              </a>

              {/* Social media icons (optional, kept for additional channels). */}
              <div className="flex items-center gap-3 mt-1">
                <a 
                  href="https://www.instagram.com/nostressia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated border border-border/60 text-text-muted hover:text-brand-accent transition-all dark:bg-surface-muted dark:border-border dark:text-text-secondary dark:hover:text-brand-accent"
                >
                  <Instagram size={16} />
                </a>

                <a 
                  href="https://x.com/nostressia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated border border-border/60 text-text-muted hover:text-brand-info transition-all dark:bg-surface-muted dark:border-border dark:text-text-secondary dark:hover:text-brand-info"
                >
                  <Twitter size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT SECTION */}
        <div className="mt-6 pt-3 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-text-muted font-medium dark:border-border/60 dark:text-text-muted">
          <p>© {currentYear} Nostressia. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart size={10} className="text-brand-accent fill-brand-accent" />
            <span>for better life.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
