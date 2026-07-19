import type { Metadata } from "next";
import { fontBody, fontHeading } from "@/lib/fonts";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Treasure Hunt · GDG Prayagraj",
    template: "%s · Treasure Hunt · GDG Prayagraj",
  },
  description:
    "A multi-college QR-code treasure hunt by GDG Prayagraj. Scan, solve, submit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          fontBody.variable,
          fontHeading.variable,
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
