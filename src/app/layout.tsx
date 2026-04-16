import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "VibeIn' | Discover the Best Events Across India",
  description: "Curated experiences, hidden gems, workshops, gigs and more across your city. Plan your day and vibe with strangers.",
  keywords: ["events", "India", "workshops", "gigs", "networking", "VibeIn"],
  authors: [{ name: "VibeIn Team" }],
 
  openGraph: {
    title: "VibeIn' | Discover Events",
    description: "Curated experiences across India.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>

  );
}