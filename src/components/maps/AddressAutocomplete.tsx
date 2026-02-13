import React, { useState, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { MapPin, Search, X, Loader2 } from "lucide-react";

interface Props {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  defaultValue?: string;
}

const libraries: "places"[] = ["places"];

export const AddressAutocomplete: React.FC<Props> = ({
  onAddressSelect,
  placeholder = "Ketik alamat pengantaran...",
  defaultValue = "",
}) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [inputValue, setInputValue] = useState(defaultValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    // Membatasi pencarian hanya di Indonesia agar lebih akurat
    autocomplete.setComponentRestrictions({ country: "id" });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();

      const address = place.formatted_address || "";
      const lat = place.geometry?.location?.lat() || 0;
      const lng = place.geometry?.location?.lng() || 0;

      setInputValue(address);
      onAddressSelect(address, lat, lng);
    }
  };

  if (!isLoaded)
    return (
      <div className="w-full h-14 bg-slate-50 rounded-2xl animate-pulse flex items-center px-4">
        <Loader2 className="animate-spin text-slate-300" size={20} />
      </div>
    );

  return (
    <div className="relative w-full group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors z-10">
        <MapPin size={20} />
      </div>

      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-14 pr-12 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm transition-all text-sm"
        />
      </Autocomplete>

      {inputValue && (
        <button
          onClick={() => setInputValue("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors z-10"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
