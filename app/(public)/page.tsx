import { SignUpForm } from "@/components/sign-up-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/queries/user";
import Link from "next/link";

import { CheckCircle, Shield } from "lucide-react";

export default async function Home() {
  const currentUser = await getCurrentUser();

  return (
    <div>
      <section className="w-full py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="w-fit text-xl px-6 lg:px-12 rounded-full my-4 font-light lg:my-12"
                >
                  Registered Credit Provider |
                  <span className="font-normal">NCRCP18217</span>
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter font-sans sm:text-5xl xl:text-6xl/none">
                  Complete financial solutions for{" "}
                  <span className="text-[#f8e306]">
                    life's important moments
                  </span>
                </h1>
                <p className="max-w-[600px] mx-auto text-gray-500 md:text-xl">
                  Liyana Finance offers comprehensive financial services
                  including payday loans and funeral policies to protect what
                  matters most.
                </p>
              </div>
            </div>

            {/* Conditional Sign Up Form or Apply Now Button */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full">
                {currentUser ? (
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>
                        Welcome back, {currentUser.full_name}!
                      </CardTitle>
                      <CardDescription>
                        Choose from our range of financial services to get
                        started.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/apply">Apply for Loan</Link>
                      </Button>
                      <Button asChild size="lg" className="w-full">
                        <Link href="/insurance/funeral">
                          Apply for Funeral Cover
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <SignUpForm className="w-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Our Services
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
              We provide comprehensive financial solutions tailored to your
              needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Loans Card */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-[#f8e306]" />
                  <CardTitle>Quick Loans</CardTitle>
                </div>
                <CardDescription>
                  Fast and convenient payday loans for life's unexpected
                  financial challenges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• Quick approval process</li>
                  <li>• Competitive interest rates</li>
                  <li>• Flexible repayment terms</li>
                  <li>• Online application</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/apply">Apply Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Funeral Policy Card */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-blue-500" />
                  <CardTitle>Funeral Policies</CardTitle>
                </div>
                <CardDescription>
                  Ensure dignity in difficult times with our comprehensive
                  funeral policy coverage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• Family coverage options</li>
                  <li>• Immediate cover</li>
                  <li>• No waiting period for <strong>accidental death only</strong></li>
                  <li>• 24/7 support</li>
                </ul>
                <Button asChild className="w-full bg-black">
                  <Link href="/insurance/funeral">Apply Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
