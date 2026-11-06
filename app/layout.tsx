import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { prisma } from "@/lib/prisma";

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

export const dynamic = "force-dynamic";

async function getSettings() {
  try {
    const s = await prisma.systemSettings.findFirst();
    if (s) {
      return {
        storeName: s.storeName,
        tagline: s.tagline,
        address: s.address,
        googleMapsUrl: s.googleMapsUrl,
        phone: s.phone,
        hotline: s.hotline,
        whatsapp: s.whatsapp,
        deliveryZones: s.deliveryZones,
        minDeliveryOrder: s.minDeliveryOrder,
        freeDeliveryAbove: s.freeDeliveryAbove,
        isOpen: s.isOpen,
        workingHours: s.workingHours,
        announcement: s.announcement,
      };
    }
  } catch (e) {
    console.error("Settings load error in layout:", e);
  }
  return {
    storeName: "ألبان فينيسيا",
    tagline: "خير المزارع الطبيعي على أصوله — ألبان طازجة، أجبان معتقة، وحلويات بلدي فاخرة",
    address: "80 المدينة المنورة، الوايلي الكبير شرق، حدائق القبة، محافظة القاهرة",
    googleMapsUrl: "https://share.google/UrPJjxJ0JpFBb4OHt",
    phone: "0224382540",
    hotline: "01018671000",
    whatsapp: "01018671000",
    minDeliveryOrder: 50,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#080e1a] text-slate-100 antialiased min-h-screen flex flex-col selection:bg-amber-500 selection:text-slate-950">
        <CartProvider>
          <Navbar settings={settings} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <CartDrawer settings={settings} />
          <Footer settings={settings} />
          <MobileBottomNav settings={settings} />
        </CartProvider>
      </body>
    </html>
  );
}
