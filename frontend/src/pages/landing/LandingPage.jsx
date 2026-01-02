import Header from "./components/Header"
import HeroSection from "./components/HeroSection"
import FeaturesSection from "./components/FeaturesSection"
import ProductSection from "./components/ProductSection"
import WhyHyperCollab from "./components/WhyHyperCollab"
import TechStackSection from "./components/TechStackSection"
import FinalCTA from "./components/FinalCTA"
import Footer from "./components/Footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ProductSection />
      <WhyHyperCollab />
      <TechStackSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
