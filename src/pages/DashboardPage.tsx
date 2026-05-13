import { useEffect, useState } from "react";
import { Film, Heart, Clock, Download, Eye } from "lucide-react";
import { getAllMarkings, getMovieByTmdbId, getTvShowByTmdbId } from "@/services/db";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#e11d48", "#db2777", "#c026d3", "#9333ea", "#7c3aed"];

export default function DashboardPage() {
  const [markings, setMarkings] = useState<any[]>([]);
  const [stats, setStats] = useState({ watched: 0, watchlist: 0, favorite: 0, totalHours: 0, genreCount: 0 });
  const [genreData, setGenreData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const marks = await getAllMarkings();
        setMarkings(marks);
        const watchedList = marks.filter((m) => m.is_watched);
        const watched = watchedList.length;
        const watchlist = marks.filter((m) => m.is_watchlist).length;
        const favorite = marks.filter((m) => m.is_favorite).length;

        // 近半年每月观影数
        const months: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
        }
        marks.forEach((m) => {
          if (m.watch_date && months[m.watch_date.slice(0, 7)] !== undefined) {
            months[m.watch_date.slice(0, 7)]++;
          }
        });
        setMonthlyData(Object.entries(months).map(([name, value]) => ({ name, value })));

        // 动态统计类型分布 + 总时长
        const genreCount: Record<string, number> = {};
        let totalMinutes = 0;
        for (const m of watchedList) {
          const detail =
            m.media_type === "movie"
              ? await getMovieByTmdbId(m.tmdb_id)
              : await getTvShowByTmdbId(m.tmdb_id);
          if (detail) {
            const gens: any[] = detail.genres || [];
            gens.forEach((g: any) => {
              genreCount[g.name] = (genreCount[g.name] || 0) + 1;
            });
            const rt =
              (detail.runtime as number) ||
              (detail.episode_run_time && (detail.episode_run_time as number[])[0]) ||
              0;
            totalMinutes += rt;
          }
        }
        const sorted = Object.entries(genreCount)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value: value as number }));
        setGenreData(sorted);
        const totalHours = Math.round(totalMinutes / 60);
        setStats({ watched, watchlist, favorite, totalHours, genreCount: sorted.length });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const exportData = () => {
    const data = JSON.stringify(markings, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cinevault-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">数据看板</h2>
        <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors">
          <Download size={16} /> 导出数据
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Eye size={16} /> <span className="text-xs font-medium">已看</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.watched}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Film size={16} /> <span className="text-xs font-medium">想看</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.watchlist}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Heart size={16} /> <span className="text-xs font-medium">收藏</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.favorite}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock size={16} /> <span className="text-xs font-medium">总时长(小时)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalHours}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold mb-4">近半年每月观影数</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold mb-4">最喜欢的类型 Top 5</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {genreData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
