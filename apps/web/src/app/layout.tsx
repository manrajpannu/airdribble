import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import AppShell from "@/components/app-shell";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "airdribble",
  description: "Rocket League Directional Air Roll Trainer",
  openGraph: {
    title: "airdribble",
    description: "Rocket League Directional Air Roll Trainer",
    siteName: "airdribble",
    images: [
      {
        url: "/icons/icon_square_lg.png",
        width: 512,
        height: 512,
        alt: "airdribble Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "airdribble",
    description: "Rocket League Directional Air Roll Trainer",
    images: ["/icons/icon_square_lg.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.variable}`}>
      <body className="min-h-full bg-background text-foreground font-poppins">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
