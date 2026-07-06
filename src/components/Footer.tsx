/* eslint-disable */
export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-white/10 py-12 px-6">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex items-center gap-2">
          <img 
            src="/8.png" 
            alt="Productica" 
            className="w-6 h-6 rounded-md object-cover"
          />
          <span className="text-white font-semibold tracking-tight text-sm">Productica</span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-xs uppercase tracking-widest font-mono text-white/40">
          <a href="https://x.com/Productica_in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
          <a href="https://linkedin.com/company/productica-ai/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="https://www.instagram.com/productica.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
          <a href="/TERMS%20AND%20CONDITIONS%20-%20Productica.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy</a>
          <a href="/TERMS%20AND%20CONDITIONS%20-%20Productica.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms</a>
        </div>

        <div className="text-xs text-white/30 font-mono">
          © {new Date().getFullYear()} Productica Inc.
        </div>

      </div>
    </footer>
  );
}
