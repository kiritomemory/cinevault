import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/services/tmdb";
import { useAppStore } from "@/stores/appStore";
import type { Movie } from "@/types";

interface Props {
  items: Movie[];
}

export default function ImageCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);
  const setSelected = useAppStore((s) => s.setSelectedMedia);

  const next = useCallback(() => setIndex((i) => (i + 1) % items.length), [items.length]);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (!items.length) return null;
  const item = items[index];

  return (
    <div className="relative w-full h-[280px] overflow-hidden rounded-xl group">
      <img
        src={getImageUrl(item.backdrop_path, "w1280") || getImageUrl(item.poster_path, "w780") || ""}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <h2 className="text-white text-2xl font-bold mb-1">{item.title}</h2>
        <p className="text-white/80 text-sm line-clamp-2 max-w-lg mb-3">{item.overview}</p>
        <button
          onClick={() => setSelected(item)}
          className="w-fit px-4 py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-sm font-medium hover:bg-white/30 transition-colors"
        >
          查看详情
        </button>
      </div>
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      >
        <ChevronRight size={18} />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
