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

import { CheckCircle } from "lucide-react";

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
                  Quick solutions for{" "}
                  <span className="text-[#f8e306]">
                    life's unexpected moments
                  </span>
                </h1>
                <p className="max-w-[600px] mx-auto text-gray-500 md:text-xl">
                  Liyana Finance specialises in providing quick and convenient
                  payday loans to help you navigate life’s unexpected financial
                  challenges.
                </p>
              </div>
            </div>

            {/* Conditional Sign Up Form or Apply Now Button */}
            <div className="w-full">
              <div className="">
                {currentUser ? (
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>
                        Welcome back, {currentUser.full_name}!
                      </CardTitle>
                      <CardDescription>
                        Ready to apply for a loan? Start your application
                        process now.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild size="lg" className="w-full">
                        <Link href="/apply">Apply Now</Link>
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
    </div>
  );
}
