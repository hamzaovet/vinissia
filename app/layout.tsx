import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ألبان فينيسيا — خير المزارع الطبيعي على أصوله",
  description:
    "معمل ألبان فينيسيا بحدائق القبة — ألبان طازجة فلاحي، أجبان مصنعة، لحوم مبردة، زبادي بلدي ويوناني، ورز بلبن وقشطة طبيعية.",
  keywords: [
    "ألبان فينيسيا",
    "ألبان حدائق القبة",
    "جبنة رومي بطارخ",
    "رز بلبن فينيسيا",
    "زبادي بلدي",
    "لبن جاموسي طازج",
    "قشطة فلاحي",
    "الوايلي الكبير",
  ],
  authors: [{ name: "ألبان فينيسيا" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1322",
};

// Root layout is BARE — no Navbar/Footer.
// Store pages use app/(store)/layout.tsx which adds Navbar/Footer/Cart.
// Standalone pages (login, admin, pos, driver, track) use app/(standalone)/layout.tsx — no chrome.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
