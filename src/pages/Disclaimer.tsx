import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Disclaimer</h1>
          <p className="text-muted-foreground mt-1">
            Last updated: February 2026
          </p>
        </div>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Please read this disclaimer carefully before using HerdSync. By using our Service, 
                you acknowledge that you have read, understood, and agree to be bound by this disclaimer.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              The information provided by HerdSync ("we," "us," or "our") on our platform is for 
              general informational and farm management purposes only. All information on the platform 
              is provided in good faith; however, we make no representation or warranty of any kind, 
              express or implied, regarding the accuracy, adequacy, validity, reliability, availability, 
              or completeness of any information on the platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>No Professional Advice</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              The platform is designed to assist with farm management record-keeping and does not 
              constitute professional veterinary, legal, financial, or agricultural advice. Always 
              seek the advice of qualified professionals regarding:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Animal health and veterinary matters</li>
              <li>Legal compliance and regulatory requirements</li>
              <li>Financial and tax matters</li>
              <li>Agricultural practices and recommendations</li>
            </ul>
            <p>
              Never disregard professional advice or delay seeking it because of something you have 
              read or recorded on this platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              While we strive to provide accurate tools and calculations, the accuracy of data within 
              HerdSync depends on the information entered by users. We are not responsible for any 
              errors, omissions, or inaccuracies in user-entered data or any decisions made based on 
              such data.
            </p>
            <p>
              Users are solely responsible for verifying the accuracy of their records and ensuring 
              their data is up to date and correct.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Prices</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              Any market prices, commodity prices, or financial data displayed on the platform are 
              provided for informational purposes only and may not reflect current market conditions. 
              We do not guarantee the accuracy, timeliness, or completeness of such information.
            </p>
            <p>
              Do not make buying, selling, or other financial decisions based solely on the market 
              information provided through HerdSync. Always verify current prices through official 
              market sources.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Information</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              The compliance checklists, templates, and guidance provided on HerdSync are for 
              reference purposes only and should not be considered as legal advice. Regulations 
              and requirements may change, and the information provided may not be current or 
              applicable to your specific situation.
            </p>
            <p>
              You are responsible for ensuring your farm operations comply with all applicable laws, 
              regulations, and industry standards. We recommend consulting with legal and compliance 
              professionals for specific guidance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Links</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              The platform may contain links to third-party websites or services that are not owned 
              or controlled by HerdSync. We have no control over, and assume no responsibility for, 
              the content, privacy policies, or practices of any third-party websites or services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              Under no circumstances shall HerdSync be liable for any direct, indirect, incidental, 
              consequential, special, or exemplary damages arising out of or in connection with your 
              use of the platform, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of livestock or animals</li>
              <li>Financial losses from business decisions</li>
              <li>Penalties from regulatory non-compliance</li>
              <li>Data loss or corruption</li>
              <li>Any other damages arising from the use of our Service</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Availability</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              We do not guarantee that the platform will be available at all times or that it will 
              be free from errors or interruptions. We reserve the right to modify, suspend, or 
              discontinue any part of the Service at any time without notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              If you have any questions about this Disclaimer, please contact us at:
            </p>
            <p>
              Email: <a href="mailto:91Stephan@gmail.com" className="text-primary hover:underline">91Stephan@gmail.com</a><br />
              Phone: <a href="tel:+27783186923" className="text-primary hover:underline">+27 78 318 6923</a><br />
              Address: 685 Keet Avenue, Les Marais, Pretoria, Gauteng, South Africa, 0084
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
