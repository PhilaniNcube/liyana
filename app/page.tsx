import { SignUpForm } from "@/components/sign-up-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div>
      <section className="w-full py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit ">
                  Registered Credit Provider |
                  <span className="text-xs">NCRCP18217</span>
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter font-sans sm:text-5xl xl:text-6xl/none">
                  Quick solutions for life's unexpected moments
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  Liyana Finance specialises in providing quick and convenient
                  payday loans to help you navigate life’s unexpected financial
                  challenges.
                </p>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure & confidential</span>
                </div>
              </div>
            </div>

            {/* Sign Up Form */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Get Started Today</CardTitle>
                <CardDescription>
                  Sign up to begin your loan application process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SignUpForm className="w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
