import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Pastikan path import ini sesuai dengan lokasi file di Langkah 1
import { formatCoords } from "../../utils/geo";
import { MapPin, Navigation, Search } from "lucide-react";

// Fix Icon Marker Leaflet yang sering blank di React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  initialPos?: [number, number];
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelected,
  initialPos,
}) => {
  const [position, setPosition] = useState<L.LatLng>(
    initialPos
      ? L.latLng(initialPos[0], initialPos[1])
      : L.latLng(-0.502106, 117.153709), // Default Samarinda
  );
  const [address, setAddress] = useState("Mencari lokasi...");

  const MapEvents = () => {
    useMapEvents({
      click(e: L.LeafletMouseEvent) {
        const { lat, lng } = e.latlng;
        setPosition(e.latlng);
        reverseGeocode(lat, lng);
      },
    });
    return null;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      const addr = data.display_name || formatCoords(lat, lng);
      setAddress(addr);
      onLocationSelected(lat, lng, addr);
    } catch (error) {
      setAddress(formatCoords(lat, lng));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Fitur pencarian alamat bisa dikembangkan di sini
  };

  return (
    <div className="w-full h-full relative font-sans">
      <MapContainer
        center={position}
        zoom={15}
        className="w-full h-full rounded-2xl z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} />
        <MapEvents />
        <ChangeMapView coords={position} />
      </MapContainer>

      {/* Label Alamat Melayang */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white p-4 rounded-2xl shadow-xl border border-slate-200 text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
              Lokasi Terpilih
            </h4>
            <p className="text-[11px] font-bold text-slate-800 line-clamp-2 uppercase leading-tight">
              {address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: Pindahkan kamera peta saat koordinat berubah
const ChangeMapView = ({ coords }: { coords: L.LatLng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
};
