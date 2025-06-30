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
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="w-fit text-xl px-4 rounded-full"
                >
                  Registered Credit Provider |
                  <span className="font-extralight">NCRCP18217</span>
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

            {/* Sign Up Form */}
            <div className="w-full">
              <div className="">
                <SignUpForm className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
