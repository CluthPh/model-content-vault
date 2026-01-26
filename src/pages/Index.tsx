import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ContentGrid } from "@/components/ContentGrid";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ContentGrid />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
