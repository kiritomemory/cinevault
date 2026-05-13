import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Calendar } from "lucide-react";
import { getPersonDetails, getImageUrl, formatDate } from "@/services/tmdb";
import { savePerson } from "@/services/db";
import type { Person } from "@/types";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "tv">("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getPersonDetails(Number(id));
        setPerson(data);
        await savePerson(data);
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("API Key 未配置")) {
          setError("API Key 未配置，请在设置中填写 TMDB API Key");
        } else if (msg.includes("401") || msg.includes("403")) {
          setError("API Key 无效，请检查设置中的 API Key 是否正确");
        } else if (msg.includes("404")) {
          setError("未找到该人物信息");
        } else {
          setError(`加载失败：${msg}`);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-sm mb-2">{error}</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm hover:underline">返回首页</button>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <p>未找到人物信息</p>
        <button onClick={() => navigate("/")} className="mt-2 text-primary text-sm hover:underline">返回首页</button>
      </div>
    );
  }

  const credits = (person as any).combined_credits || {};
  const cast = (credits.cast || []).map((c: any) => ({ ...c, department: "Acting" }));
  const crew = (credits.crew || []);
  const allWorks = [...cast, ...crew];

  const departments = Array.from(new Set(allWorks.map((w: any) => w.department))).filter(Boolean);

  let filtered = allWorks;
  if (deptFilter.length > 0) filtered = filtered.filter((w: any) => deptFilter.includes(w.department));
  if (typeFilter !== "all") filtered = filtered.filter((w: any) => w.media_type === typeFilter);

  filtered = [...filtered].sort((a: any, b: any) => {
    if (sortBy === "date") {
      const da = a.release_date || a.first_air_date || "";
      const db = b.release_date || b.first_air_date || "";
      return db.localeCompare(da);
    }
    return (b.vote_average || 0) - (a.vote_average || 0);
  });

  // Deduplicate by id+media_type
  const seen = new Set<string>();
  const deduped = filtered.filter((w: any) => {
    const key = `${w.media_type}-${w.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const toggleDept = (dept: string) => {
    setDeptFilter((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative">
        <div className="absolute inset-0 h-[280px] overflow-hidden">
          <img src={getImageUrl(person.profile_path, "w1280") || ""} alt={person.name} className="w-full h-full object-cover blur-sm scale-105 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative px-6 pt-6 pb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft size={16} /> 返回
          </button>
          <div className="flex gap-6">
            <img src={getImageUrl(person.profile_path, "w500") || ""} alt={person.name} className="w-[160px] h-[240px] rounded-xl shadow-2xl object-cover bg-muted flex-shrink-0" />
            <div className="flex-1 pt-2">
              <h1 className="text-3xl font-bold text-foreground mb-1">{person.name}</h1>
              <p className="text-sm text-muted-foreground mb-3">{person.known_for_department}</p>
              {person.birthday && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                  <Calendar size={14} /> {formatDate(person.birthday)}
                  {person.place_of_birth && ` · ${person.place_of_birth}`}
                </div>
              )}
              {person.biography && (
                <p className="text-sm text-muted-foreground line-clamp-3 mt-3">{person.biography}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-xs font-medium text-muted-foreground">部门:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => toggleDept(dept)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors
                ${deptFilter.includes(dept) ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
            >
              {dept}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">类型:</span>
          {(["all", "movie", "tv"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors
                ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
            >
              {t === "all" ? "全部" : t === "movie" ? "电影" : "剧集"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">排序:</span>
            <button onClick={() => setSortBy("date")} className={`text-xs ${sortBy === "date" ? "text-primary font-medium" : "text-muted-foreground"}`}>日期</button>
            <button onClick={() => setSortBy("rating")} className={`text-xs ${sortBy === "rating" ? "text-primary font-medium" : "text-muted-foreground"}`}>评分</button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold mb-3">作品年表 ({deduped.length})</h3>
        <div className="space-y-1">
          {deduped.map((work: any) => {
            const year = (work.release_date || work.first_air_date || "").split("-")[0];
            const isMovie = work.media_type === "movie";
            return (
              <div key={`${work.media_type}-${work.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/${work.media_type}/${work.id}`)}>
                <span className="w-10 text-xs text-muted-foreground text-right flex-shrink-0">{year || "—"}</span>
                <img src={getImageUrl(work.poster_path, "w92") || ""} alt="" className="w-8 h-12 rounded object-cover bg-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{isMovie ? work.title : work.name}</p>
                  {work.character && <p className="text-xs text-muted-foreground">饰演: {work.character}</p>}
                  {work.job && <p className="text-xs text-muted-foreground">{work.job}</p>}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  {work.vote_average?.toFixed(1) || "N/A"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
