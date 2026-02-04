import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  CreditCard,
  Loader2,
  Construction,
  CalendarClock,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import farmBackground from "@/assets/farm-background.jpg";
import { format } from "date-fns";

const features = [
  {
    icon: PawPrint,
    title: "Livestock Management",
    description: "Track all your animals with detailed health records and breeding history",
  },
  {
    icon: Clock,
    title: "Feeding Schedules",
    description: "Automated feeding reminders and inventory tracking",
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "South African audit-ready documentation for labour, OHS, and chemicals",
  },
  {
    icon: BarChart3,
    title: "Market Insights",
    description: "Real-time commodity prices and market trends",
  },
  {
    icon: MapPin,
    title: "RFID Tracking",
    description: "Track animal locations with RFID scanners",
  },
  {
    icon: Wheat,
    title: "Farm Inventory",
    description: "Monitor stock levels with low-stock alerts",
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

const pricingTiers = [
  {
    name: "Basic",
    price: "R99",
    period: "/month",
    description: "Perfect for small farms just getting started",
    animalLimit: "Up to 80 animals",
    tier: "basic" as const,
    features: [
      "Livestock tracking",
      "Basic health records",
      "Feeding schedules",
      "Feed inventory",
      "Email support",
    ],
  },
  {
    name: "Starter",
    price: "R249",
    period: "/month",
    description: "For growing farms with more animals",
    animalLimit: "Up to 250 animals",
    tier: "starter" as const,
    popular: true,
    features: [
      "Everything in Basic",
      "Advanced health tracking",
      "Breeding records",
      "Compliance documents",
      "Market prices",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "Contact Us",
    period: "",
    description: "Unlimited power for large operations",
    animalLimit: "Unlimited animals",
    tier: "pro" as const,
    underDevelopment: true,
    hidePrice: true,
    features: [
      "Everything in Starter",
      "RFID tracking & mapping",
      "Audit pack builder",
      "Multi-user access",
      "API access",
      "Dedicated support",
    ],
    proOptions: [
      { label: "Web-Based Subscription", price: "R599", period: "/month" },
      { label: "RFID Tracking Package", price: "R599", period: "/month", note: "+ installation & hardware fees" },
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { farm } = useFarm();
  const { subscription, isActive, isTrialing, daysRemaining, adminInfo, refetch: refetchSubscription } = useSubscription();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<"yoco" | null>(null);
  const [showProOptions, setShowProOptions] = useState(false);

  // Check if user is an admin locked to a specific tier
  const isAdminLocked = adminInfo.isAdmin && adminInfo.assignedTier !== null;

  // Handle payment callbacks
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const provider = searchParams.get("provider");
    
    if (paymentStatus === "success") {
      toast({
        title: "Payment Successful!",
        description: `Your subscription is now active. Welcome to HerdSync!`,
      });
      refetchSubscription();
      // Clear URL params
      navigate("/pricing", { replace: true });
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again when ready.",
        variant: "destructive",
      });
      navigate("/pricing", { replace: true });
    } else if (paymentStatus === "failed") {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
      navigate("/pricing", { replace: true });
    }
  }, [searchParams, toast, navigate, refetchSubscription]);

  const handleSelectPlan = (tier: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!farm) {
      toast({
        title: "No Farm Found",
        description: "Please create a farm first before subscribing.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTier(tier);
  };

  const handleYocoPayment = async (tier: string) => {
    if (!user || !farm) return;
    
    setIsProcessing(true);
    setProcessingMethod("yoco");
    
    try {
      const { data, error } = await supabase.functions.invoke("create-yoco-checkout", {
        body: {
          tier,
          farmId: farm.id,
          userId: user.id,
          successUrl: `${window.location.origin}/pricing?payment=success&provider=yoco`,
          cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Redirect to Yoco checkout page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("No redirect URL returned from Yoco");
      }
    } catch (error) {
      console.error("Yoco payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate Yoco payment",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  return (
    <div 
      className="min-h-screen farm-background"
      style={{ '--farm-bg-image': `url(${farmBackground})` } as React.CSSProperties}
    >
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wheat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">HerdSync</h1>
              <p className="text-xs text-muted-foreground">Farm Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => navigate("/")} variant="outline">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Admin Status Banner */}
      {user && isAdminLocked && (
        <div className="bg-accent/20 border-b border-accent/30 py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="font-semibold">Admin Test Account</span> - Locked to{" "}
              <span className="font-bold text-primary capitalize">{adminInfo.assignedTier}</span> tier
              {subscription?.current_period_end && (
                <span className="ml-2">
                  • Renews on{" "}
                  <span className="font-medium">
                    {format(new Date(subscription.current_period_end), "dd MMM yyyy")}
                  </span>
                  {" "}({daysRemaining} days)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Trial Banner */}
      {user && isTrialing && !isAdminLocked && (
        <div className="bg-primary/10 border-b border-primary/20 py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">
              <span className="font-semibold">🎉 Free Trial Active!</span> You have{" "}
              <span className="font-bold text-primary">{daysRemaining} days</span> remaining.
              Choose a plan below to continue after your trial.
            </p>
          </div>
        </div>
      )}

      {/* Active Subscription Banner */}
      {user && isActive && !isTrialing && !isAdminLocked && subscription?.current_period_end && (
        <div className="bg-success/10 border-b border-success/20 py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm flex items-center justify-center gap-2">
              <CalendarClock className="w-4 h-4" />
              <span className="font-semibold capitalize">{subscription.tier} Plan Active</span>
              <span>• Next payment on{" "}
                <span className="font-bold text-success">
                  {format(new Date(subscription.current_period_end), "dd MMM yyyy")}
                </span>
                {" "}({daysRemaining} days)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            🌾 Built for South African Farmers
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold font-display mb-6">
            Manage Your Farm
            <span className="text-primary block">Like a Pro</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            The complete farm management solution with livestock tracking, compliance
            documentation, and real-time market insights. Start your 2-week free trial today.
          </p>
          {!user && (
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-gradient-primary">
              Start 14-Day Free Trial
            </Button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-center mb-12">
            Everything You Need to Run Your Farm
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background/80">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16" id="pricing">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.popular
                    ? "border-primary shadow-lg scale-105"
                    : "bg-background/80"
                } ${tier.underDevelopment ? "overflow-hidden" : ""}`}
              >
                {tier.underDevelopment && !tier.proOptions && (
                  <div className="absolute inset-0 z-10 bg-background/20 flex items-start justify-center pt-4">
                    <div className="bg-background/95 rounded-lg px-3 py-2 text-center shadow-lg border border-border">
                      <div className="flex items-center gap-2">
                        <Construction className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                )}
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-display">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  {!tier.hidePrice ? (
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                  ) : (
                    <div className="pt-4">
                      <span className="text-2xl font-semibold text-primary">See Options Below</span>
                    </div>
                  )}
                  <Badge variant="outline" className="mt-2">
                    {tier.animalLimit}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {/* Admin locked to this tier */}
                  {isAdminLocked && adminInfo.assignedTier === tier.tier ? (
                    <div className="w-full space-y-2">
                      <Button className="w-full" variant="default" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Your Assigned Plan
                      </Button>
                      {subscription?.current_period_end && (
                        <p className="text-xs text-center text-muted-foreground">
                          Renews in {daysRemaining} days
                        </p>
                      )}
                    </div>
                  ) : isAdminLocked ? (
                    // Admin but not their assigned tier - locked out
                    <Button className="w-full" variant="outline" disabled>
                      <Lock className="w-4 h-4 mr-2" />
                      Not Available
                    </Button>
                  ) : tier.underDevelopment && tier.proOptions ? (
                    <div className="w-full space-y-3">
                      {!showProOptions ? (
                        <Button 
                          className="w-full" 
                          variant="outline" 
                          onClick={() => setShowProOptions(true)}
                        >
                          View Pricing Options
                        </Button>
                      ) : (
                        <>
                          {tier.proOptions.map((option, idx) => (
                            <div key={idx} className="p-3 border border-border rounded-lg bg-muted/50">
                              <p className="font-semibold text-sm">{option.label}</p>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-bold">{option.price}</span>
                                <span className="text-muted-foreground text-sm">{option.period}</span>
                              </div>
                              {option.note && (
                                <p className="text-xs text-muted-foreground mt-1">{option.note}</p>
                              )}
                              <Button 
                                className="w-full mt-2" 
                                variant="outline" 
                                size="sm"
                                disabled
                              >
                                Coming Soon
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full" 
                            onClick={() => setShowProOptions(false)}
                          >
                            Hide Options
                          </Button>
                        </>
                      )}
                    </div>
                  ) : tier.underDevelopment ? (
                    <Button className="w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  ) : selectedTier === tier.tier ? (
                    <div className="w-full space-y-2">
                      <Button
                        className="w-full bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => handleYocoPayment(tier.tier)}
                        disabled={isProcessing}
                      >
                        {isProcessing && processingMethod === "yoco" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-2" />
                        )}
                        Pay with Yoco
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setSelectedTier(null)}
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className={`w-full ${tier.popular ? "bg-gradient-primary" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(tier.tier)}
                    >
                      {subscription?.tier === tier.tier && isActive
                        ? "Current Plan"
                        : "Choose Plan"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-center mb-12">
            Trusted by Farmers Across South Africa
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-background/80">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-primary/30 mb-2" />
                  <CardDescription className="text-foreground italic">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.farm}, {testimonial.location}
                    </p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join hundreds of South African farmers already using HerdSync. Start your
            free 14-day trial today—no credit card required.
          </p>
          {!user ? (
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-gradient-primary">
              Start Free Trial
            </Button>
          ) : (
            <Button size="lg" onClick={() => navigate("/")} className="bg-gradient-primary">
              Go to Dashboard
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-card/80">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 HerdSync. Built for South African farmers.</p>
          <p className="mt-2">
            Payments secured by PayPal and Yoco. All prices in South African Rand (ZAR).
          </p>
        </div>
      </footer>
    </div>
  );
}
