import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PreviewDashboardSection } from "@/components/landing/PreviewDashboardSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { MembershipPricingCards } from "@/components/premium/MembershipPricingCards";

export default function HomePage() {
  return (
    <>
      <div className="landing-hero-gradient">
        <Navbar variant="public" />
        <HeroSection />
      </div>
      <main id="main-content" className="app-shell-gradient overflow-x-hidden text-center">
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PreviewDashboardSection />
        <ContactSection />
        <section id="pricing" className="scroll-mt-24">
          <MembershipPricingCards
            headingLevel={2}
            subscribeHref="/upgrade/"
            freeCta={{ href: "/signup/", label: "Create a free account" }}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
