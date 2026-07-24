import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleMapsPickerProps {
  address: string;
  onAddressChange: (newAddress: string, coords?: { lat: number; lng: number; city?: string; state?: string }) => void;
  label?: string;
  placeholder?: string;
  autoPromptOnMount?: boolean;
}

export const GoogleMapsPicker: React.FC<GoogleMapsPickerProps> = ({
  address,
  onAddressChange,
  label = "Delivery Address (Google Maps GPS Auto-Fill)",
  placeholder = "Enter street address or click Auto-Detect GPS...",
  autoPromptOnMount = true,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 19.0596, lng: 72.8295 }); // Default Bandra West

  const googleApiKey = (typeof process !== "undefined" && process.env.VITE_GOOGLE_MAPS_API_KEY) || (typeof window !== "undefined" && (window as any).GOOGLE_MAPS_API_KEY);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    toast.info("📍 Requesting browser location permission & GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          // If Google Maps API Key is provided in Render env
          if (googleApiKey) {
            const googleRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`);
            if (googleRes.ok) {
              const gData = await googleRes.json();
              if (gData.results?.[0]) {
                const fullAddr = gData.results[0].formatted_address;
                onAddressChange(fullAddr, { lat, lng });
                toast.success("📍 Address Auto-Filled via Official Google Maps API!");
                setDetecting(false);
                return;
              }
            }
          }

          // Fallback Reverse Geocoding
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          if (res.ok) {
            const data = await res.json();
            const fullAddr = data.display_name || `${data.address?.road || "Street"}, ${data.address?.suburb || data.address?.city || "City"}, ${data.address?.postcode || ""}`;
            const city = data.address?.city || data.address?.town || data.address?.suburb || "Mumbai";
            const state = data.address?.state || "Maharashtra";

            onAddressChange(fullAddr, { lat, lng, city, state });
            toast.success("📍 Browser GPS Address Auto-Filled!");
          } else {
            const fallbackAddr = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Bandra West, Mumbai 400050`;
            onAddressChange(fallbackAddr, { lat, lng });
            toast.success("📍 GPS Location Detected!");
          }
        } catch (err) {
          const fallbackAddr = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Mumbai 400050`;
          onAddressChange(fallbackAddr, { lat, lng });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        console.warn("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission was denied. Click '📍 Auto-Detect GPS' to retry or type address manually.");
        } else {
          toast.error("Could not fetch GPS position. Please type your address manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (autoPromptOnMount && (!address || address.includes("Bandra West"))) {
      handleDetectGPS();
    }
  }, [autoPromptOnMount]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-amber-500" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md transition-all"
        >
          {detecting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Requesting GPS...
            </>
          ) : (
            <>
              <Navigation className="h-3 w-3" /> 📍 Auto-Detect GPS Location
            </>
          )}
        </button>
      </div>

      <input
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-inner"
      />

      {/* Embedded Google Maps Live iFrame Preview */}
      <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 h-36 bg-slate-100 dark:bg-slate-800 shadow-sm">
        <iframe
          title="Google Maps Location Preview"
          width="100%"
          height="100%"
          loading="lazy"
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
        />
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-mono flex items-center gap-1">
          <MapPin className="h-3 w-3 text-amber-400" /> GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};
