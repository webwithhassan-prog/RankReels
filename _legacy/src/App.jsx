import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CatalogueMarquee from './components/CatalogueMarquee';
import Statement from './components/Statement';
import HowItWorks from './components/HowItWorks';
import ScaleProof from './components/ScaleProof';
import SkillApiSection from './components/SkillApiSection';
import Benefits from './components/Benefits';
import TierComparison from './components/TierComparison';
import FaqSection from './components/FaqSection';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import StudioModal from './components/StudioModal';
import ApiGuideModal from './components/ApiGuideModal';
import { PRESET_REELS } from './data/mockData';

export default function App() {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isApiGuideOpen, setIsApiGuideOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState(PRESET_REELS[0]);

  const handleOpenStudio = (reel = null) => {
    if (reel && reel.title) {
      setSelectedReel(reel);
    }
    setIsStudioOpen(true);
  };

  const handleSelectReelFromCatalogue = (catalogueItem) => {
    // Find matching preset or generate matching reel object
    const match = PRESET_REELS.find((r) => r.niche.toLowerCase().includes(catalogueItem.tag.toLowerCase().split('/')[0].trim()));
    if (match) {
      setSelectedReel({
        ...match,
        title: catalogueItem.title,
      });
    } else {
      setSelectedReel({
        ...PRESET_REELS[0],
        title: catalogueItem.title,
      });
    }
    setIsStudioOpen(true);
  };

  return (
    <div className="rankreel-app" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Sticky Top Navbar */}
      <Navbar
        onOpenStudio={() => handleOpenStudio()}
        onOpenApiGuide={() => setIsApiGuideOpen(true)}
      />

      <main>
        {/* Hero with interactive 3D deck and live video player */}
        <Hero onOpenStudio={() => handleOpenStudio()} />

        {/* Creator Catalogue dual-track infinite marquee */}
        <CatalogueMarquee onSelectReel={handleSelectReelFromCatalogue} />

        {/* Problem statement sequential text */}
        <Statement />

        {/* 3-Step Production Pipeline */}
        <HowItWorks onOpenStudio={() => handleOpenStudio()} />

        {/* Scale Proof: Checklist + 4-Reel IO Showcase */}
        <ScaleProof onOpenStudio={() => handleOpenStudio()} />

        {/* Agent Skill & Developer API */}
        <SkillApiSection onOpenStudio={() => handleOpenStudio()} />

        {/* Benefits Grid */}
        <Benefits />

        {/* Tier Comparison Matrix (S to D Tier) */}
        <TierComparison />

        {/* Interactive FAQ Accordion */}
        <FaqSection />

        {/* Final CTA Glowing Container */}
        <FinalCta onOpenStudio={() => handleOpenStudio()} />
      </main>

      {/* Footer */}
      <Footer
        onOpenStudio={() => handleOpenStudio()}
        onOpenApiGuide={() => setIsApiGuideOpen(true)}
      />

      {/* In-Browser Reel Creator Studio Modal */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialReel={selectedReel}
      />

      {/* Agent Skill & API Guide Modal */}
      <ApiGuideModal
        isOpen={isApiGuideOpen}
        onClose={() => setIsApiGuideOpen(false)}
      />
    </div>
  );
}
