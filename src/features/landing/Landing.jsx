import React from 'react';
import { MotionConfig } from 'framer-motion';
import LandingNav from './LandingNav';
import LandingHero from './LandingHero';
import LandingStats from './LandingStats';
import LandingHowItWorks from './LandingHowItWorks';
import LandingFeatures from './LandingFeatures';
import LandingForWho from './LandingForWho';
import LandingQuote from './LandingQuote';
import LandingPricing from './LandingPricing';
import LandingFAQ from './LandingFAQ';
import LandingCTA from './LandingCTA';

/**
 * Landing pública de Latido. Cada sección tiene su id para el scroll del navbar.
 * MotionConfig respeta `prefers-reduced-motion` del sistema en todas las animaciones.
 */
export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden">
        <LandingNav />
        <LandingHero />
        <LandingStats />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingForWho />
        <LandingQuote />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
      </div>
    </MotionConfig>
  );
}
