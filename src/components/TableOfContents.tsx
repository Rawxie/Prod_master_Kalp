/* eslint-disable */
import { useEffect, useState } from 'react';

const sections = [
  { id: 'reality', label: '01. Reality' },
  { id: 'validate', label: '02. Validate' },
  { id: 'agents', label: '03. Agents' },
  { id: 'achievements', label: '04. Achievements' },
  { id: 'stack', label: '05. Stack' },
  { id: 'ecosystem', label: '06. Ecosystem' },
  { id: 'spis', label: '07. SPIS' },
  { id: 'pricing-section', label: '08. Pricing' },
  { id: 'contact', label: '09. Contact' },
];

export default function TableOfContents() {
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    const handleScroll = () => {
      // Look at roughly 1/3 down the screen for the active section
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      let currentSection = '';
      
      for (const { id } of sections) {
        const element = document.getElementById(id);
        if (element) {
          // Add a small buffer to the top so it activates right as it comes into focus
          if (element.offsetTop - window.innerHeight / 4 <= scrollPosition) {
            currentSection = id;
          }
        }
      }
      
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    // Throttle the scroll listener slightly for performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initial check (give DOM a second to parse lazy components)
    setTimeout(handleScroll, 300);
    setTimeout(handleScroll, 1000);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-[90] flex-col justify-between h-[340px] pointer-events-auto mix-blend-difference text-white">
      {/* Subtle vertical track */}
      <div className="absolute top-0 right-0 h-full w-[1px] bg-white/20 pointer-events-none" />
      
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="group relative flex items-center justify-end w-32 h-4"
          aria-label={label}
        >
          {/* Label (Always visible when active, fades in on hover otherwise) */}
          <span 
            className={`absolute right-10 text-[9px] font-mono uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap pointer-events-none ${
              activeSection === id 
                ? 'opacity-100 text-white' 
                : 'opacity-0 text-white/40 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2'
            }`}
          >
            {label}
          </span>
          
          {/* Right line indicator instead of dot */}
          <div 
            className={`absolute right-0 h-[1px] transition-all duration-500 ease-out origin-right flex ${
              activeSection === id 
                ? 'bg-white w-6' 
                : 'bg-white/30 w-2 group-hover:w-4 group-hover:bg-white/70'
            }`} 
          />
        </a>
      ))}
    </div>
  );
}
