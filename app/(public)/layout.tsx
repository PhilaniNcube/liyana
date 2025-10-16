import { Navigation } from "@/components/navigation";
import { ConsentBanner } from "@/components/consent-banner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liyana Finance",
  description: "Fast and secure financial services",
  icons: {
    icon: "/square.jpg",
    shortcut: "/square.jpg",
    apple: "/square.jpg",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      {children}
      <ConsentBanner />
    </>
  );
}
