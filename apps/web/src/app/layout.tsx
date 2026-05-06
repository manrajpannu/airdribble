import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "airdribble",
  description: "Rocket League Aim Trainer Platform ",
  openGraph: {
    title: "airdribble",
    description: "Rocket League Aim Trainer Platform ",
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
    description: "Rocket League Aim Trainer Platform ",
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
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
