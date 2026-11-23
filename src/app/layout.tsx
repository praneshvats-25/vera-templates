/**
 * Root layout. Wraps every page.
 * Loads the two fonts from the design: Manrope (text) and JetBrains Mono (code-like examples).
 */
import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vera Templates",
  description: "View, copy and edit clinical note templates.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-grey-100 font-sans text-grey-900">{children}</body>
    </html>
  );
}
