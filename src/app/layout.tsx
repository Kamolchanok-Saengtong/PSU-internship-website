import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Thai } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareBar } from "@/components/compare-bar";
import { SmoothScroll } from "@/components/smooth-scroll";
import "./globals.css";

const noto = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Internship Board · PSU Phuket Campus",
    template: "%s · PSU Phuket Internship Board",
  },
  description:
    "Find internship places for Prince of Songkla University, Phuket Campus students, ordered by application deadline.",
  icons: { icon: "/psu-emblem.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${noto.variable} ${notoThai.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <SmoothScroll>
          <SiteHeader />
          <main className="flex-1 pb-20">{children}</main>
          <SiteFooter />
          <CompareBar />
        </SmoothScroll>
      </body>
    </html>
  );
}
