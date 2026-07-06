import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "Productica completely shifted how we validate ideas. The AI agents act like a seasoned board of advisors that catch every blind spot.",
    author: "Sarah J.",
    role: "Founder & CEO"
  },
  {
    quote: "Instead of spending months building the wrong features, the Virtual Product Strategist helped us hone in on what our early adopters actually wanted.",
    author: "Michael T.",
    role: "Technical Co-Founder"
  },
  {
    quote: "The Investor readiness matrices stress-tested our pitch before we even talked to a VC. We walked into meetings significantly more confident.",
    author: "Elena R.",
    role: "Startup Founder"
  }
];

export default function Testimony() {
  return (
    <section className="relative w-full py-32 bg-black text-white overflow-hidden">
      {/* Decorative grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-full mb-4">
            <Quote className="w-5 h-5 text-zinc-400" />
          </div>
          <h2 className="text-4xl font-light tracking-tight">
            Loved by <span className="font-semibold italic">Founders.</span>
          </h2>
          <p className="text-zinc-400 font-light">
            Hear from the builders who use Productica to eliminate guesswork and accelerate their growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="p-8 bg-zinc-950/40 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col justify-between gap-8 transition-colors"
            >
              <p className="text-lg text-white/80 font-light leading-relaxed">
                "{t.quote}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-white border border-white/10">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.author}</div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
