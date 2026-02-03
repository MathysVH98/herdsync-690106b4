import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">
            Last updated: February 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              By accessing and using HerdSync ("the Service"), you accept and agree to be bound by the 
              terms and provisions of this agreement. If you do not agree to abide by these terms, 
              please do not use this Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              HerdSync provides a web-based farm management platform that enables users to manage 
              livestock records, track inventory, monitor compliance, and generate reports. The Service 
              is provided "as is" and "as available."
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              To access certain features of the Service, you must create an account. You are responsible 
              for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account.
            </p>
            <p>
              You agree to provide accurate, current, and complete information during registration and 
              to update such information to keep it accurate, current, and complete.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to any part of the Service</li>
              <li>Not use the Service to transmit harmful or malicious code</li>
              <li>Maintain accurate records and data within the platform</li>
              <li>Comply with all applicable local, national, and international laws</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Data and Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              Your privacy is important to us. All data you enter into HerdSync remains your property. 
              We collect and process data as described in our Privacy Policy. By using the Service, 
              you consent to such collection and processing.
            </p>
            <p>
              We implement reasonable security measures to protect your data, but cannot guarantee 
              absolute security. You are responsible for maintaining backups of critical data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Subscription and Payments</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              Certain features of the Service require a paid subscription. Subscription fees are billed 
              in advance on a monthly or annual basis. All fees are non-refundable unless otherwise 
              stated.
            </p>
            <p>
              We reserve the right to modify pricing with reasonable notice. Continued use of the 
              Service after price changes constitutes acceptance of the new pricing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              The Service and its original content, features, and functionality are owned by HerdSync 
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              To the maximum extent permitted by law, HerdSync shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including loss of profits, data, 
              or other intangible losses resulting from your use of the Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any 
              material changes via email or through the Service. Your continued use of the Service 
              after such modifications constitutes acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              These terms shall be governed by and construed in accordance with the laws of the 
              Republic of South Africa. Any disputes arising from these terms shall be subject to 
              the exclusive jurisdiction of the courts of South Africa.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              If you have any questions about these Terms of Service, please contact us at:
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
