import { TopNav } from '@/components/landing/top-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { StatsStrip } from '@/components/landing/stats-strip';
import { CategoryBento } from '@/components/landing/category-bento';
import { FeaturedListings } from '@/components/landing/featured-listings';
import { HowItWorks } from '@/components/landing/how-it-works';
import { AgentCta } from '@/components/landing/agent-cta';
import { BlogSection } from '@/components/landing/blog-section';
import { Footer } from '@/components/landing/footer';
import { MobileBar } from '@/components/landing/mobile-bar';

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      <TopNav />

      <main id="main-content">
        <HeroSection />
        <StatsStrip />
        <CategoryBento />
        <FeaturedListings />
        <HowItWorks />
        <AgentCta />
        <BlogSection />
        <Footer />
      </main>

      <MobileBar />
    </>
  );
}
