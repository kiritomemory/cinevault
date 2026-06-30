import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { testConnection } from '@/services/emby';
import { Tv, AlertTriangle, Clock, Activity, Wifi } from 'lucide-react';

export default function EmbyDashboardPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, embyConnected, embyServerName, embySeriesCount, setEmbyConnected } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [authMode, setAuthMode] = useState<'key' | 'password'>('key');
  const [embyUser, setEmbyUser] = useState('');
  const [embyPw, setEmbyPw] = useState('');

  const handleConnect = async () => {
    setLoading(true); setError('');
    const r = await testConnection(
      settings.embyServer,
      settings.embyApiKey,
      authMode === 'password' ? embyUser : undefined,
      authMode === 'password' ? embyPw : undefined,
    );
    if (r.success) {
      if (authMode === 'password' && r.token) {
        updateSettings({ embyApiKey: r.token, embyConnected: true });
      }
      setEmbyConnected(true, r.serverName, r.seriesCount);
    } else {
      setError(r.error ?? '连接失败');
      setEmbyConnected(false);
    }
    setLoading(false);
  };

  if (!embyConnected && !settings.embyApiKey) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
          <Tv size={48} className="mx-auto text-primary" />
          <h2 className="text-xl font-semibold">连接 Emby 服务器</h2>
          <p className="text-muted-foreground text-sm">配置 Emby 信息以查看追更看板</p>
          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs text-muted-foreground">服务器地址</label>
              <input className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                placeholder="https://kiritomemoryemby.kooldns.cn"
                value={settings.embyServer ?? ''}
                onChange={e => updateSettings({ embyServer: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAuthMode('key')}
                className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (authMode === 'key' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>API Key</button>
              <button onClick={() => setAuthMode('password')}
                className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (authMode === 'password' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>密码登录</button>
            </div>
            {authMode === 'key' ? (
            <div>
              <label className="text-xs text-muted-foreground">API Key</label>
              <input className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                type="password" placeholder="输入 API Key"
                value={settings.embyApiKey ?? ''}
                onChange={e => updateSettings({ embyApiKey: e.target.value })} />
            </div>
            ) : (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">用户名</label>
                <input className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                  placeholder="root"
                  value={embyUser}
                  onChange={e => setEmbyUser(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">密码</label>
                <input className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                  type="password" placeholder="输入密码"
                  value={embyPw}
                  onChange={e => setEmbyPw(e.target.value)} />
              </div>
            </div>
            )}
            {error && <p className="text-red-500 text-sm flex items-center gap-1"><Wifi size={14} />{error}</p>}
            <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
              onClick={handleConnect} disabled={loading || !settings.embyServer || !settings.embyApiKey}>
              {loading ? '连接中...' : '连接'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Tv size={24} className="text-primary" /> Emby 追更看板
        </h1>
        <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full">
          {embyServerName || settings.embyServer || 'Emby'} {embySeriesCount ? '· ' + embySeriesCount + ' 部' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总剧集', value: embySeriesCount || '?', icon: Tv, color: 'text-blue-400' },
          { label: '更新中', value: '?', icon: Clock, color: 'text-yellow-400' },
          { label: '已完结', value: '?', icon: Tv, color: 'text-green-400' },
          { label: '缺集', value: '?', icon: AlertTriangle, color: 'text-red-400' },
        ].map((card, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <card.icon size={28} className={card.color} />
            <div><div className="text-2xl font-bold">{card.value}</div><div className="text-xs text-muted-foreground">{card.label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '缺失剧集', desc: '查看所有缺集', path: '/emby/missing', icon: AlertTriangle },
          { label: '最近添加', desc: '新入库的剧集', path: '/emby/recent', icon: Activity },
          { label: '继续观看', desc: '播放进度', path: '/emby/resume', icon: Clock },
          { label: 'Emby 设置', desc: '重新连接', path: '/settings', icon: Tv },
        ].map((card, i) => (
          <button key={i} onClick={() => navigate(card.path)}
            className="glass-card p-4 text-left hover:bg-accent/50 transition-colors text-sm space-y-1">
            <card.icon size={18} className="text-primary" />
            <div className="font-medium">{card.label}</div>
            <div className="text-xs text-muted-foreground">{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
