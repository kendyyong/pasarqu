import React from "react";
import { Timer, ImageOff } from "lucide-react";

interface Props {
  images: string[] | string | null;
  activeIndex: number;
  onIndexChange: (i: number) => void;
  isOutOfStock: boolean;
  isPo: boolean;
  poDays: number;
  productName: string;
}

export const ProductGallery: React.FC<Props> = ({
  images,
  activeIndex,
  onIndexChange,
  isOutOfStock,
  isPo,
  poDays,
  productName,
}) => {
  // ✅ Normalisasi data: Pastikan images selalu menjadi array
  const normalizeImages = (): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === "string") return [images];
    return [];
  };

  const imageList = normalizeImages();
  const hasImages = imageList.length > 0;

  return (
    <div className="w-full md:w-[450px] p-0 md:p-4 shrink-0">
      <div className="relative aspect-square overflow-hidden bg-slate-50 border border-slate-100 group">
        {hasImages ? (
          <img
            src={imageList[activeIndex] || imageList[0]}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isOutOfStock ? "grayscale opacity-50" : ""
            }`}
            alt={productName}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/500?text=Gambar+Bermasalah";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <ImageOff size={48} />
            <span className="text-[10px] font-black uppercase mt-2 tracking-widest">
              Foto Tidak Ditemukan
            </span>
          </div>
        )}

        {/* Overlay Stok Habis - Dibuat Kotak */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
            <div className="bg-red-600 text-white px-6 py-2 border-2 border-white shadow-2xl font-black uppercase tracking-[0.2em] text-sm">
              STOK HABIS
            </div>
          </div>
        )}

        {/* Indikator Slide Mobile */}
        {hasImages && imageList.length > 1 && (
          <div className="md:hidden absolute bottom-4 right-4 bg-black/30 text-white text-[10px] px-3 py-1 font-bold backdrop-blur-sm">
            {activeIndex + 1} / {imageList.length}
          </div>
        )}

        {/* Badge PO - Dibuat Kotak */}
        {isPo && (
          <div className="absolute top-4 left-0 bg-orange-500 text-white px-3 py-1 text-[11px] font-bold shadow-lg z-20">
            <div className="flex items-center gap-1.5">
              <Timer size={12} />
              <span className="uppercase tracking-tighter">
                PO {poDays} Hari
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Gallery (Desktop) */}
      {hasImages && imageList.length > 1 && (
        <div className="hidden md:flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {imageList.map((img, i) => (
            <div
              key={i}
              onMouseEnter={() => onIndexChange(i)}
              className={`w-16 h-16 border-2 cursor-pointer transition-all ${
                activeIndex === i
                  ? "border-teal-600"
                  : "border-transparent hover:border-teal-100"
              }`}
            >
              <img
                src={img}
                className="w-full h-full object-cover"
                alt="thumbnail"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/100?text=Error";
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
