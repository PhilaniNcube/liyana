import { Navigation } from "@/components/navigation";
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

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
