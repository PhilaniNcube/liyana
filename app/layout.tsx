import type { Metadata } from "next";
import { Geist_Mono, DM_Sans } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "@/components/providers";
import { RouteChangeTracker } from "@/components/route-change-tracker";
import { Toaster } from "sonner";

const GTM_ID = "GTM-MQMJTTXR";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liyana Finance",
  description: "Fast and secure financial services",
  icons: {
    icon: "/square.jpg",
    shortcut: "/square.jpg",
    apple: "/square.jpg",
  },
};

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleTagManager gtmId={GTM_ID} />
        <Providers>
          <NuqsAdapter>
            {children}
            <RouteChangeTracker />
          </NuqsAdapter>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
