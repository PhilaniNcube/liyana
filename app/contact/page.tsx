import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            We're here to help. Reach out to us with any questions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Business Hours</h3>
                <p className="text-muted-foreground">
                  Mon to Fri: 09:00 - 17:00
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Email</h3>
                <a
                  href="mailto:info@liyanafinance.co.za"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@liyanafinance.co.za
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Phone</h3>
                <a
                  href="tel:+27120040889"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  (012) 004 0889
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
