/* eslint-disable */
import { useState, useLayoutEffect } from 'react';
import { motion, useScroll } from 'framer-motion';
import Preloader from '../components/Preloader';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TableOfContents from '../components/TableOfContents';
import NoiseOverlay from '../components/NoiseOverlay';

import ScrollStory from '../components/ScrollStory';
import ReactiveTypography from '../components/ReactiveTypography';
import IdeaFlow from '../components/IdeaFlow';
import AgenticPlatform from '../components/AgenticPlatform';

import SocialProof from '../components/SocialProof';

import Pricing from '../components/Pricing';
import Testimony from '../components/Testimony';
import Modules from '../components/Modules';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import EcosystemDifference from '../components/EcosystemDifference';

export default function Home() {
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('preloaderDone'));
  const [videoLoading, setVideoLoading] = useState(true);
  const { scrollYProgress } = useScroll();

  useLayoutEffect(() => {
    // Scroll handling is now fully centralized in App.tsx
  }, []);

  return (
    <main className="relative overflow-clip selection:bg-black selection:text-white">
      {loading && <Preloader isLoading={videoLoading} onComplete={() => {
        setLoading(false);
        sessionStorage.setItem('preloaderDone', 'true');
      }} />}
      {!loading && <Navbar />}
      <TableOfContents />
      
      {/* Dynamic Static PNG Noise Overlay */}
      <NoiseOverlay />

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 h-1 bg-black z-[60] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <Hero onVideoLoad={() => setVideoLoading(false)} />
      

        <div id="about">
          <ScrollStory />
        </div>
        <div id="validate" className="scroll-mt-20">
          <ReactiveTypography />
          <IdeaFlow />
        </div>
        <div id="agents">
          <AgenticPlatform />
        </div>

        <div id="achievements">
          <SocialProof />
        </div>
        <div id="stack">
          <Modules />
        </div>

        <div id="ecosystem">
          <EcosystemDifference />
        </div>
        <Pricing />
        <Testimony />
        <Contact />
        <Footer />

    </main>
  );
}
