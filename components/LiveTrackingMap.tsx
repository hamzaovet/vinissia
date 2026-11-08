"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface LocationPoint {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface CourierLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  lastUpdated?: number;
}

interface LiveTrackingMapProps {
  branch: LocationPoint;
  courierLocation?: CourierLocation | null;
  customerLocation?: LocationPoint | null;
  customerAddress?: string;
  orderStatus: string;
  height?: string;
  className?: string;
  onOpenExternalNavigation?: () => void;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LiveTrackingMap({
  branch,
  courierLocation,
  customerLocation,
  customerAddress,
  orderStatus,
  height = "380px",
  className = "",
  onOpenExternalNavigation,
}: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{
    branch?: any;
    courier?: any;
    customer?: any;
    routeLine?: any;
  }>({});

  const [resolvedCustomerCoords, setResolvedCustomerCoords] = useState<{ lat: number; lng: number } | null>(
    customerLocation?.lat && customerLocation?.lng
      ? { lat: customerLocation.lat, lng: customerLocation.lng }
      : null
  );

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  // 1. Resolve Customer Coordinates via Nominatim if only address text is provided
  useEffect(() => {
    let isCancelled = false;

    if (customerLocation?.lat && customerLocation?.lng) {
      setResolvedCustomerCoords({ lat: customerLocation.lat, lng: customerLocation.lng });
      return;
    }

    const query = (customerAddress || customerLocation?.address || "").trim();
    if (!query) {
      // Realistic default: 1.8km north-east of branch
      setResolvedCustomerCoords({
        lat: branch.lat + 0.012,
        lng: branch.lng + 0.009,
      });
      return;
    }

    const geocode = async () => {
      try {
        const cleanQuery = query.replace(/[#,]/g, " ").slice(0, 50);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          cleanQuery + " القاهرة"
        )}&limit=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "ar" } });
        const data = await res.json();
        if (!isCancelled && data && data.length > 0) {
          setResolvedCustomerCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
          return;
        }
      } catch (err) {
        console.warn("Geocoding fallback:", err);
      }

      // Safe fallback near branch
      if (!isCancelled) {
        setResolvedCustomerCoords({
          lat: branch.lat + 0.011,
          lng: branch.lng + 0.008,
        });
      }
    };

    geocode();

    return () => {
      isCancelled = true;
    };
  }, [customerAddress, customerLocation, branch.lat, branch.lng]);

  // 2. Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return;

    let isMounted = true;

    // Dynamically import Leaflet so it never executes during SSR
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map instance if not created
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [branch.lat, branch.lng],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        // Add Arabic/standard OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          subdomains: ["a", "b", "c"],
        }).addTo(map);

        // Add custom top-left zoom controls
        L.control.zoom({ position: "topleft" }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const { branch: bMarker, courier: cMarker, customer: custMarker, routeLine } = markersRef.current;

      // 🏪 Branch Marker (ألبان فينيسيا)
      const branchIconHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
          <div style="background:#0f172a; color:#f59e0b; border:2px solid #f59e0b; border-radius:12px; padding:4px 8px; font-weight:900; font-size:10px; white-space:nowrap; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-family:sans-serif; margin-bottom:2px;">
            🥛 ${branch.name || "معمل ألبان فينيسيا"}
          </div>
          <div style="background:#0f172a; border:3px solid #f59e0b; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(245,158,11,0.5);">
            <span style="font-size:16px;">🏪</span>
          </div>
        </div>
      `;

      const branchIcon = L.divIcon({
        className: "custom-branch-marker",
        html: branchIconHtml,
        iconSize: [0, 0],
      });

      if (!bMarker) {
        markersRef.current.branch = L.marker([branch.lat, branch.lng], { icon: branchIcon }).addTo(map);
        markersRef.current.branch.bindPopup(`<b>${branch.name || "فرع ألبان فينيسيا"}</b><br/>نقطة انطلاق وتجهيز الطلب`);
      } else {
        bMarker.setLatLng([branch.lat, branch.lng]);
      }

      // 📍 Customer Destination Marker
      const custCoords = resolvedCustomerCoords || { lat: branch.lat + 0.012, lng: branch.lng + 0.009 };
      const customerIconHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
          <div style="background:#047857; color:#ffffff; border:2px solid #34d399; border-radius:12px; padding:3px 8px; font-weight:bold; font-size:10px; white-space:nowrap; box-shadow:0 4px 10px rgba(0,0,0,0.25); font-family:sans-serif; margin-bottom:2px;">
            🏠 عنوان العميل
          </div>
          <div style="background:#059669; border:3px solid #ffffff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(5,150,105,0.4);">
            <span style="font-size:16px;">📍</span>
          </div>
        </div>
      `;

      const customerIcon = L.divIcon({
        className: "custom-customer-marker",
        html: customerIconHtml,
        iconSize: [0, 0],
      });

      if (!custMarker) {
        markersRef.current.customer = L.marker([custCoords.lat, custCoords.lng], { icon: customerIcon }).addTo(map);
        markersRef.current.customer.bindPopup(`<b>عنوان التسليم</b><br/>${customerAddress || "موقع العميل"}`);
      } else {
        custMarker.setLatLng([custCoords.lat, custCoords.lng]);
      }

      // 🛵 Courier Live Scooter Marker
      const effectiveCourierCoords =
        courierLocation && courierLocation.lat && courierLocation.lng
          ? { lat: courierLocation.lat, lng: courierLocation.lng }
          : orderStatus === "OUT_FOR_DELIVERY"
          ? {
              // Mid-way simulation between branch and customer if GPS hasn't updated yet
              lat: (branch.lat * 0.4 + custCoords.lat * 0.6),
              lng: (branch.lng * 0.4 + custCoords.lng * 0.6),
            }
          : null;

      if (effectiveCourierCoords) {
        const speed = courierLocation?.speed || 28;
        const courierIconHtml = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
            <!-- Pulsing Radio Wave -->
            <div style="position:absolute; top:20px; left:50%; transform:translate(-50%, -50%); width:54px; height:54px; border-radius:50%; background:rgba(245, 158, 11, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            
            <!-- Speed Badge -->
            <div style="background:#d97706; color:#ffffff; border:2px solid #ffffff; border-radius:9999px; padding:2px 7px; font-weight:900; font-size:9px; white-space:nowrap; box-shadow:0 4px 10px rgba(0,0,0,0.3); margin-bottom:2px; z-index:2;">
              🛵 في الطريق • ${speed} كم/س
            </div>

            <!-- Scooter Pin -->
            <div style="background:#f59e0b; border:3px solid #0f172a; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(245,158,11,0.6); z-index:2;">
              <span style="font-size:18px;">🛵</span>
            </div>
          </div>
        `;

        const courierIcon = L.divIcon({
          className: "custom-courier-marker",
          html: courierIconHtml,
          iconSize: [0, 0],
        });

        if (!cMarker) {
          markersRef.current.courier = L.marker([effectiveCourierCoords.lat, effectiveCourierCoords.lng], {
            icon: courierIcon,
            zIndexOffset: 1000,
          }).addTo(map);
          markersRef.current.courier.bindPopup("<b>كابتن فينيسيا 🛵</b><br/>جاري التوصيل لايف بالـ GPS");
        } else {
          cMarker.setLatLng([effectiveCourierCoords.lat, effectiveCourierCoords.lng]);
        }

        // Draw Polyline (Route Line)
        const latLngs: [number, number][] = [
          [branch.lat, branch.lng],
          [effectiveCourierCoords.lat, effectiveCourierCoords.lng],
          [custCoords.lat, custCoords.lng],
        ];

        if (!routeLine) {
          markersRef.current.routeLine = L.polyline(latLngs as any, {
            color: "#f59e0b",
            weight: 4,
            opacity: 0.85,
            dashArray: "8, 8",
            lineCap: "round",
          }).addTo(map);
        } else {
          routeLine.setLatLngs(latLngs as any);
        }

        // Calculate Remaining Distance and ETA
        const dist = calculateDistanceKm(
          effectiveCourierCoords.lat,
          effectiveCourierCoords.lng,
          custCoords.lat,
          custCoords.lng
        );
        setDistanceKm(parseFloat(dist.toFixed(1)));
        const minutes = Math.max(3, Math.round((dist / Math.max(speed, 20)) * 60) + 2);
        setEtaMinutes(minutes);

        // Auto-fit bounds smoothly
        const bounds = L.latLngBounds(latLngs as any);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else {
        // If not out for delivery yet, show line between Branch and Customer
        const latLngs: [number, number][] = [
          [branch.lat, branch.lng],
          [custCoords.lat, custCoords.lng],
        ];

        if (!routeLine) {
          markersRef.current.routeLine = L.polyline(latLngs as any, {
            color: "#94a3b8",
            weight: 3,
            opacity: 0.6,
            dashArray: "6, 6",
          }).addTo(map);
        } else {
          routeLine.setLatLngs(latLngs as any);
        }

        const dist = calculateDistanceKm(branch.lat, branch.lng, custCoords.lat, custCoords.lng);
        setDistanceKm(parseFloat(dist.toFixed(1)));
        setEtaMinutes(Math.max(5, Math.round((dist / 25) * 60) + 5));

        const bounds = L.latLngBounds(latLngs as any);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [branch, courierLocation, resolvedCustomerCoords, customerAddress, orderStatus]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center on Courier
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (courierLocation?.lat && courierLocation?.lng) {
      mapInstanceRef.current.setView([courierLocation.lat, courierLocation.lng], 16, { animate: true });
    } else {
      mapInstanceRef.current.setView([branch.lat, branch.lng], 15, { animate: true });
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 1 }} />

      {/* Top Floating Dashboard Over the Map */}
      <div className="absolute top-3 right-3 left-3 z-[400] flex items-center justify-between pointer-events-none">
        {/* Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 py-1.5 px-3 rounded-2xl text-white shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-black text-amber-400 font-sans">
            {orderStatus === "OUT_FOR_DELIVERY"
              ? "تتبع لايف بالـ GPS 📡"
              : orderStatus === "DELIVERED"
              ? "تم التسليم بنجاح ✅"
              : "جاري تجهيز الطلب 🔪"}
          </span>
        </div>

        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="pointer-events-auto py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-1.5"
          title="تمركز على موقع الطيار"
        >
          <span>🎯 تمركز</span>
        </button>
      </div>

      {/* Bottom Floating Stats Bar */}
      <div className="absolute bottom-3 right-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 text-white shadow-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 font-bold">الوقت المتوقع (ETA)</span>
            <span className="font-black text-amber-400 font-mono text-sm">
              {orderStatus === "DELIVERED" ? "تم الوصول" : etaMinutes ? `~ ${etaMinutes} دقيقة` : "دقائق معدودة"}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="text-right">
            <span className="block text-[10px] text-slate-400 font-bold">المسافة المتبقية</span>
            <span className="font-black text-emerald-400 font-mono text-sm">
              {orderStatus === "DELIVERED" ? "0 كم" : distanceKm ? `${distanceKm} كم` : "قريب جداً"}
            </span>
          </div>
        </div>

        {onOpenExternalNavigation && (
          <button
            type="button"
            onClick={onOpenExternalNavigation}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition flex items-center gap-1 shadow-sm"
          >
            <span>🧭 ملاحة صوتية</span>
          </button>
        )}
      </div>
    </div>
  );
}
