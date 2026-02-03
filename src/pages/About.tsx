import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Award, Heart } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">About HerdSync</h1>
          <p className="text-muted-foreground mt-1">
            Empowering farmers with modern livestock management solutions
          </p>
        </div>

        {/* Mission Statement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              At HerdSync, our mission is to simplify farm management for livestock farmers across South Africa 
              and beyond. We believe that every farmer, regardless of the size of their operation, deserves 
              access to professional-grade tools that help them manage their herds efficiently, stay compliant 
              with regulations, and ultimately run more profitable farms.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Farmer-First Approach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                We build our platform based on real feedback from farmers. Every feature is designed 
                with practical, on-the-ground use in mind.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-primary" />
                Quality & Reliability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Your data is precious. We ensure our platform is reliable, secure, and always 
                available when you need it most.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-primary" />
                Local Understanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Based in South Africa, we understand local farming practices, regulations, 
                and the unique challenges our farmers face.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What We Offer */}
        <Card>
          <CardHeader>
            <CardTitle>What We Offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground">Livestock Management</h4>
              <p className="text-muted-foreground text-sm">
                Track your entire herd with detailed records for each animal, including health history, 
                breeding records, and movement tracking.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Compliance & Auditing</h4>
              <p className="text-muted-foreground text-sm">
                Stay audit-ready with our comprehensive compliance tools designed for South African 
                regulatory requirements, including labour laws, OHS, and livestock traceability.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Financial Tracking</h4>
              <p className="text-muted-foreground text-sm">
                Monitor expenses, track sales, and generate reports that give you clear insights 
                into your farm's financial health.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Inventory Management</h4>
              <p className="text-muted-foreground text-sm">
                Keep track of feed, supplies, equipment, and chemicals with automated alerts 
                when stock runs low.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ready to modernise your farm management?
              </h3>
              <p className="text-muted-foreground mb-4">
                Get in touch with us to learn more about how HerdSync can help your operation.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
