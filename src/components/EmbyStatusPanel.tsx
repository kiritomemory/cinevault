import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { getCachedSeries } from '@/services/embyCache';
import { Tv, AlertTriangle } from 'lucide-react';

interface Props { tmdbId: number; }

export default function EmbyStatusPanel({ tmdbId }: Props) {
  const embyConnected = useAppStore((s) => s.embyConnected);
  const [st, setSt] = useState<{ loading: boolean; found: boolean; localEps?: number; missing?: number; unplayed?: number; sl?: string; lib?: string; }>({ loading: true, found: false });

  useEffect(() => {
    if (!embyConnected) { setSt({ loading: false, found: false }); return; }
    (async () => {
      try {
        const c = await getCachedSeries(tmdbId);
        if (c) setSt({ loading: false, found: true, localEps: c.totalEpisodes, missing: c.embyMissingCount, unplayed: c.unplayedCount, sl: c.statusLabel, lib: c.library });
        else setSt({ loading: false, found: false });
      } catch { setSt({ loading: false, found: false }); }
    })();
  }, [tmdbId, embyConnected]);

  if (!embyConnected || (!st.loading && !st.found)) return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold"><Tv size={16} className="text-primary" /> Emby 状态</div>
      {st.found ? (
        <div className="space-y-2 text-sm">
          <div className="flex gap-4 flex-wrap"><span className="text-muted-foreground">📁 {st.lib}</span><span className={'font-medium ' + (st.sl === '更新中' ? 'text-yellow-400' : 'text-green-400')}>{st.sl}</span></div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="bg-background/50 rounded-lg p-2 text-center"><div className="text-lg font-bold">{st.localEps}</div><div className="text-xs text-muted-foreground">总集数</div></div>
            <div className="bg-background/50 rounded-lg p-2 text-center"><div className={'text-lg font-bold ' + ((st.missing||0) > 0 ? 'text-red-400' : 'text-green-400')}>{st.missing || 0}</div><div className="text-xs text-muted-foreground">缺集</div></div>
            <div className="bg-background/50 rounded-lg p-2 text-center"><div className={'text-lg font-bold ' + ((st.unplayed||0) > 0 ? 'text-yellow-400' : 'text-muted-foreground')}>{st.unplayed || 0}</div><div className="text-xs text-muted-foreground">未看</div></div>
          </div>
        </div>
      ) : (<p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle size={12} /> 未在 Emby 中关联</p>)}
    </div>
  );
}
