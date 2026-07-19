import { Roboto, Roboto_Slab } from "next/font/google";

// Body copy — Roboto, one regular/medium pairing.
export const fontBody = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

// Headings — heavier weight of the same family feel.
export const fontHeading = Roboto_Slab({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});
