import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Wheat,
  PawPrint,
  Shield,
  BarChart3,
  Clock,
  MapPin,
  Star,
  Quote,
  ArrowRight,
  Play,
  Users,
  FileText,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import farmBackground from "@/assets/farm-background.jpg";

// Import animal images
import cowImage from "@/assets/animals/cow.jpg";
import sheepImage from "@/assets/animals/sheep.jpg";
import chickenImage from "@/assets/animals/chicken.jpg";

const features = [
  {
    icon: PawPrint,
    title: "Livestock Management",
    description: "Track all your animals with detailed health records, breeding history, and individual profiles.",
    image: cowImage,
  },
  {
    icon: Clock,
    title: "Feeding Schedules",
    description: "Automated feeding reminders and comprehensive inventory tracking to never miss a meal.",
    image: null,
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "South African audit-ready documentation for labour, OHS, chemicals, and SARS requirements.",
    image: null,
  },
  {
    icon: BarChart3,
    title: "Market Insights",
    description: "Real-time commodity prices and market trends to help you make informed selling decisions.",
    image: null,
  },
  {
    icon: MapPin,
    title: "GPS Tracking",
    description: "Track animal locations with paddock mapping and boundary management.",
    image: null,
  },
  {
    icon: FileText,
    title: "Document Vault",
    description: "Secure storage for all farm documents, certificates, and compliance records.",
    image: null,
  },
];

const testimonials = [
  {
    name: "Johan van der Merwe",
    farm: "Karoo Lamb Farm",
    location: "Northern Cape",
    quote: "HerdSync has transformed how we manage our 500+ sheep. The compliance features saved us hours during our last audit.",
    rating: 5,
  },
  {
    name: "Thandi Nkosi",
    farm: "Green Valley Dairy",
    location: "KwaZulu-Natal",
    quote: "The feeding schedules and health tracking have improved our herd's productivity by 20%. Best investment we've made.",
    rating: 5,
  },
  {
    name: "Pieter du Plessis",
    farm: "Highveld Cattle Ranch",
    location: "Free State",
    quote: "Finally, a farm management app built for South African farmers. The UIF and COIDA document tracking is a game-changer.",
    rating: 5,
  },
];

const stats = [
  { value: "2,500+", label: "Active Farms" },
  { value: "150,000+", label: "Animals Tracked" },
  { value: "98%", label: "Audit Pass Rate" },
  { value: "4.9/5", label: "User Rating" },
];

const pricingHighlights = [
  {
    tier: "Basic",
    price: "R99",
    description: "Up to 80 animals",
    features: ["Livestock tracking", "Health records", "Feeding schedules"],
  },
  {
    tier: "Starter",
    price: "R249",
    description: "Up to 250 animals",
    features: ["Everything in Basic", "Compliance docs", "Market prices"],
    popular: true,
  },
  {
    tier: "Pro",
    price: "R599",
    description: "Unlimited animals",
    features: ["Everything in Starter", "GPS tracking", "AI assistant"],
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div 
      className="min-h-screen farm-background"
      style={{ '--farm-bg-image': `url(${farmBackground})` } as React.CSSProperties}
    >
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wheat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">HerdSync</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Farm Management</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </button>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              🌾 Built for South African Farmers
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-display mb-6 leading-tight">
              Manage Your Farm
              <span className="text-primary block">Like Never Before</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              The complete farm management solution with livestock tracking, SA compliance 
              documentation, real-time market insights, and everything you need to run 
              a successful farming operation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-primary text-lg px-8 py-6 h-auto"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="text-lg px-8 py-6 h-auto"
              >
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary font-display">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
              Everything You Need to Run Your Farm
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From livestock management to compliance documentation, HerdSync has 
              all the tools South African farmers need in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Why HerdSync?</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold font-display mb-6">
                Built by Farmers, for Farmers
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We understand the unique challenges of South African farming. 
                That's why HerdSync includes features specifically designed for 
                local compliance requirements, market conditions, and farming practices.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">SA Compliance Ready</p>
                    <p className="text-sm text-muted-foreground">
                      UIF, COIDA, OHS documentation templates and tracking
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Local Market Prices</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time commodity prices in South African Rands
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Yoco Payment Integration</p>
                    <p className="text-sm text-muted-foreground">
                      Pay with local payment methods you trust
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src={cowImage} 
                  alt="Cattle management" 
                  className="rounded-xl shadow-lg w-full h-48 object-cover"
                />
                <img 
                  src={sheepImage} 
                  alt="Sheep farming" 
                  className="rounded-xl shadow-lg w-full h-48 object-cover mt-8"
                />
                <img 
                  src={chickenImage} 
                  alt="Poultry tracking" 
                  className="rounded-xl shadow-lg w-full h-48 object-cover -mt-4"
                />
                <div className="rounded-xl bg-primary/10 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-10 h-10 text-primary mb-2" />
                  <p className="font-semibold text-lg">AI Assistant</p>
                  <p className="text-sm text-muted-foreground">
                    Ask a Pro for farming advice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
              Trusted by Farmers Across South Africa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what other farmers are saying about HerdSync
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-primary/20 mb-2" />
                  <CardDescription className="text-base text-foreground/80 italic">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.farm}, {testimonial.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-20 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingHighlights.map((plan) => (
              <Card 
                key={plan.tier} 
                className={`bg-card/80 backdrop-blur-sm text-center ${
                  plan.popular ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-display">{plan.tier}</CardTitle>
                  <div className="pt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button 
              size="lg" 
              onClick={() => navigate("/pricing")}
              className="bg-gradient-primary"
            >
              View Full Pricing Details
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-hero text-primary-foreground overflow-hidden">
            <CardContent className="py-16 px-8 text-center relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
                  Ready to Transform Your Farm?
                </h2>
                <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                  Join thousands of South African farmers who are already using 
                  HerdSync to manage their operations more efficiently.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 h-auto"
                >
                  Start Your Free Trial Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Wheat className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display">HerdSync</h3>
                  <p className="text-xs text-muted-foreground">Farm Management</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete farm management solution built for South African farmers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} HerdSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
