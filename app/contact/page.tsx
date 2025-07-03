import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge
              variant="outline"
              className="w-fit text-lg px-6 rounded-full mb-6 font-light"
            >
              Registered Credit Provider |
              <span className="font-normal">NCRCP18217</span>
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">
              Contact <span className="text-[#f8e306]">Liyana Finance</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get in touch with our team for any questions about our payday loan
              services or assistance with your application.
            </p>
          </div>

          {/* Contact Information Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {/* Business Hours */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-medium">Mon to Fri: 09:00 - 17:00</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Closed on weekends and public holidays
                </p>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Email</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a
                  href="mailto:info@liyanafinance.co.za"
                  className="text-lg font-medium text-primary hover:underline"
                >
                  info@liyanafinance.co.za
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  We typically respond within 24 hours
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Phone</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a
                  href="tel:+27120040889"
                  className="text-lg font-medium text-primary hover:underline"
                >
                  (012) 004 0889
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  Call us during business hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                How We Can Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">General Inquiries</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions about our services, loan terms, or application
                    process
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Application Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Need help with your loan application or document submission
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Assistance with your existing loan or repayment options
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Technical Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Issues with our website or online application system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to apply for a payday loan?
            </p>
            <div className="space-x-4">
              <a
                href="/auth/sign-up"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Get Started
              </a>
              <a
                href="/apply"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
