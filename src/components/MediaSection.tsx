import { ChevronRight } from "lucide-react";
import MediaCard from "./MediaCard";
import type { Movie, TVShow } from "@/types";

interface Props {
  title: string;
  items: (Movie | TVShow)[];
  onSeeAll?: () => void;
}

export default function MediaSection({ title, items, onSeeAll }: Props) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            查看全部 <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {items.map((item) => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}
