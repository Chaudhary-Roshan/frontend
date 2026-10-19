import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight, ArrowUp } from 'lucide-react';

/**
 * PortalSectionNav
 * Sticky quick-navigation jump bar for large dashboard portals.
 * Keeps full-page scroll while providing instant section jump pills,
 * live count badges, and scroll-spy active state highlighting.
 */
const PortalSectionNav = ({ sections = [], className = '' }) => {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);
  const navButtonsRef = useRef({});

  // 1. Scroll-Spy with IntersectionObserver
  useEffect(() => {
    if (!sections.length) return;

    const observerCallback = (entries) => {
      // Find visible entries
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by position or take the top-most visible section
        const topEntry = visibleEntries.reduce((prev, curr) => {
          return curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev;
        });
        if (topEntry && topEntry.target && topEntry.target.id) {
          setActiveId(topEntry.target.id);
        }
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: [0, 0.2, 0.5]
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  // 2. Keep the active button in view inside the horizontally scrolling nav bar
  useEffect(() => {
    const activeBtn = navButtonsRef.current[activeId];
    if (activeBtn && containerRef.current) {
      const container = containerRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.offsetWidth;
      const containerScroll = container.scrollLeft;

      // Smooth horizontal scroll if button is out of bounds
      if (btnLeft < containerScroll || btnLeft + btnWidth > containerScroll + containerWidth) {
        container.scrollTo({
          left: btnLeft - containerWidth / 2 + btnWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeId]);

  const scrollToSection = (id) => {
    setActiveId(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!sections.length) return null;

  return (
    <div className={`sticky top-14 sm:top-16 z-30 py-2.5 transition-all ${className}`}>
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-1.5 flex items-center gap-1.5">
        {/* Navigation label indicator on wide screens */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 border-r border-slate-200 shrink-0">
          <span>Sections</span>
          <ChevronRight size={12} className="text-slate-300" />
        </div>

        {/* Horizontally scrolling pill buttons */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sections.map((section) => {
            const isActive = activeId === section.id;
            const Icon = section.icon;

            // Color mappings for badges
            let badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
            if (section.badgeColor === 'amber') {
              badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
            } else if (section.badgeColor === 'emerald') {
              badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            } else if (section.badgeColor === 'rose') {
              badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
            } else if (section.badgeColor === 'indigo') {
              badgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';
            } else if (section.badgeColor === 'blue') {
              badgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
            }

            return (
              <button
                key={section.id}
                ref={(el) => (navButtonsRef.current[section.id] = el)}
                onClick={() => scrollToSection(section.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
                title={section.tooltip || section.label}
              >
                {Icon && (
                  <Icon
                    size={14}
                    className={`shrink-0 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                )}
                <span>{section.label}</span>

                {section.badge !== undefined && section.badge !== null && section.badge !== '' && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md border transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : badgeBg
                    }`}
                  >
                    {section.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick jump to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition shrink-0 cursor-pointer border-l border-slate-200 ml-1"
            title="Scroll to Top"
            aria-label="Scroll to top"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PortalSectionNav;
