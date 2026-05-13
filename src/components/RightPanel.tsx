import { Star, Calendar, Clock, Globe, Heart, BookmarkCheck, Eye, Plus } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { getImageUrl, formatDate, formatRuntime, formatVote } from "@/services/tmdb";
import { getMarking, setMarking, addToList, getLists } from "@/services/db";
import { useEffect, useState } from "react";
import type { Movie, TVShow } from "@/types";

export default function RightPanel() {
  const media = useAppStore((s) => s.selectedMedia);
  const [marking, setMarkingState] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [showListMenu, setShowListMenu] = useState(false);

  useEffect(() => {
    if (media) {
      getMarking(media.id, media.media_type).then(setMarkingState);
      getLists().then(setLists);
    }
  }, [media]);

  const toggleMark = async (field: "is_watched" | "is_watchlist" | "is_favorite") => {
    if (!media) return;
    const current = marking?.[field] ? true : false;
    await setMarking(media.id, media.media_type, { [field]: !current });
    const updated = await getMarking(media.id, media.media_type);
    setMarkingState(updated);
  };

  const handleAddToList = async (listId: number) => {
    if (!media) return;
    await addToList(listId, media.id, media.media_type);
    setShowListMenu(false);
  };

  const handleViewDetail = () => {
    window.location.hash = `/${media?.media_type}/${media?.id}`;
  };

  const isMovie = media && "title" in media;
  const title = isMovie ? (media as Movie).title : (media as TVShow)?.name;
  const date = isMovie ? (media as Movie).release_date : (media as TVShow)?.first_air_date;
  const year = (date || "").split("-")[0];
  const runtime = isMovie ? (media as Movie).runtime : ((media as TVShow)?.episode_run_time?.[0]);
  const displayTitle = title + (year ? `.${year}` : "") + `.[tmdb=${media?.id}]`;

  return (
    <aside className="glass-panel w-[360px] flex-shrink-0 border-l border-white/10 flex flex-col overflow-y-auto">
      {!media ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
          选择一部影视作品<br />查看详情
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <img
              src={getImageUrl(media.poster_path, "w500") || ""}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-white font-bold text-lg leading-tight mb-1">{displayTitle}</h2>
              <p className="text-white/70 text-xs">{formatDate(date)}</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => toggleMark("is_watchlist")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${marking?.is_watchlist ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
              >
                <BookmarkCheck size={14} />
                {marking?.is_watchlist ? "已想看" : "想看"}
              </button>
              <button
                onClick={() => toggleMark("is_watched")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${marking?.is_watched ? "bg-green-600 text-white" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
              >
                <Eye size={14} />
                {marking?.is_watched ? "已看" : "标记已看"}
              </button>
              <button
                onClick={() => toggleMark("is_favorite")}
                className={`p-1.5 rounded-full transition-colors ${marking?.is_favorite ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500"}`}
              >
                <Heart size={16} fill={marking?.is_favorite ? "currentColor" : "none"} />
              </button>
              <div className="relative">
                <button onClick={() => setShowListMenu(!showListMenu)} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                  <Plus size={16} />
                </button>
                {showListMenu && (
                  <div className="glass-popover absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg py-1 z-20">
                    {lists.filter((l) => !l.is_system).map((list) => (
                      <button key={list.id} onClick={() => handleAddToList(list.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                        {list.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {media.overview && (
              <div>
                <p className="text-sm text-muted-foreground line-clamp-3">{media.overview}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Star size={12} className="text-yellow-500" />
                {formatVote(media.vote_average, media.vote_count)}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={12} />
                {formatRuntime(runtime)}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar size={12} />
                {formatDate(date)}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe size={12} />
                {(media as Movie).original_language?.toUpperCase() || "未知"}
              </div>
            </div>

            <button
              onClick={handleViewDetail}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              查看完整档案
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
