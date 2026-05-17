import { useState } from "react";
import { Star, BookmarkCheck, Eye, Heart } from "lucide-react";
import { getImageUrl, formatMediaTitle } from "@/services/tmdb";
import { getMarking } from "@/services/db";
import { useAppStore } from "@/stores/appStore";
import type { Movie, TVShow } from "@/types";

interface Props {
  item: Movie | TVShow;
  size?: "sm" | "md" | "lg";
}

export default function MediaCard({ item, size = "md" }: Props) {
  const setSelected = useAppStore((s) => s.setSelectedMedia);
  const [hovered, setHovered] = useState(false);
  const [marking, setMarking] = useState<any>(null);

  const displayTitle = formatMediaTitle(item);

  const handleMouseEnter = async () => {
    setHovered(true);
    const m = await getMarking(item.id, item.media_type);
    setMarking(m);
  };

  const sizes = {
    sm: { w: "w-[120px]", img: "h-[180px]" },
    md: { w: "w-[160px]", img: "h-[240px]" },
    lg: { w: "w-[200px]", img: "h-[300px]" },
  };

  return (
    <div
      className={`${sizes[size].w} flex-shrink-0 cursor-pointer group glass-card`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setSelected(item)}
    >
      <div className="relative rounded-lg overflow-hidden transition-all duration-200 group-hover:shadow-xl">
        <img
          src={getImageUrl(item.poster_path, "w342") || "/placeholder-poster.svg"}
          alt={displayTitle}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-poster.svg"; }}
          className={`w-full ${sizes[size].img} object-cover bg-muted`}
          loading="lazy"
        />
        {hovered && (
          <div className="absolute inset-0 bg-black/40 flex items-start justify-end p-2 gap-1">
            {marking?.is_watchlist && (
              <div className="p-1 rounded-full bg-primary/80 text-primary-foreground">
                <BookmarkCheck size={12} />
              </div>
            )}
            {marking?.is_watched && (
              <div className="p-1 rounded-full bg-green-600/80 text-white">
                <Eye size={12} />
              </div>
            )}
            {marking?.is_favorite && (
              <div className="p-1 rounded-full bg-red-500/80 text-white">
                <Heart size={12} fill="currentColor" />
              </div>
            )}
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium flex items-center gap-0.5">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          {item.vote_average?.toFixed(1) ?? "N/A"}
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-[11px] font-medium text-foreground leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {displayTitle}
        </h3>
      </div>
    </div>
  );
}
