import { useAppStore } from '@/stores/appStore';
import type { EmbyConnectResult, EmbyRecentItem, EmbyResumeItem, EmbyActivity } from '@/types/emby';

async function embyFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  const s = useAppStore.getState().settings;
  if (!s.embyServer || !s.embyApiKey) return null;
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  try {
    const r = await fetch(s.embyServer + '/emby' + path + q, {
      headers: { 'X-Emby-Token': s.embyApiKey, Accept: 'application/json' },
    });
    return r.ok ? (r.json() as Promise<T>) : null;
  } catch { return null; }
}

export async function testConnection(): Promise<EmbyConnectResult> {
  const info = await embyFetch<any>('/System/Info');
  if (!info) return { success: false, error: '无法连接 Emby 服务器' };
  const users = await embyFetch<any[]>('/Users');
  if (!users?.length) return { success: false, error: '无法获取用户信息' };
  const uid = users.find((u: any) => u.Name === 'root')?.Id ?? users[0].Id;
  const views = await embyFetch<any>('/Users/' + uid + '/Views');
  const tvLibs: any[] = views?.Items?.filter((v: any) => v.CollectionType === 'tvshows') ?? [];
  return {
    success: true, userId: uid,
    serverName: info.ServerName ?? '', version: info.Version ?? '',
    seriesCount: 0, libraryCount: tvLibs.length,
  };
}

export async function getRecentItems(): Promise<EmbyRecentItem[]> {
  const users = await embyFetch<any[]>('/Users');
  if (!users?.length) return [];
  const uid = users.find((u: any) => u.Name === 'root')?.Id ?? users[0].Id;
  const data = await embyFetch<any>('/Users/' + uid + '/Items', {
    IncludeItemTypes: 'Episode', Recursive: 'true',
    SortBy: 'DateCreated', SortOrder: 'Descending', Limit: '30',
    Fields: 'DateCreated,SeriesName,ParentIndexNumber,IndexNumber,SeriesId,RunTimeTicks',
  });
  if (!data?.Items) return [];
  return data.Items.map((ep: any) => ({
    name: ep.Name ?? '', series: ep.SeriesName ?? '', seriesId: ep.SeriesId ?? '',
    season: ep.ParentIndexNumber ?? 0, episode: ep.IndexNumber ?? 0,
    created: ep.DateCreated ? ep.DateCreated.slice(0, 16).replace('T', ' ') : '',
    runtime: Math.round((ep.RunTimeTicks ?? 0) / 600000000),
  }));
}

export async function getResumeItems(): Promise<EmbyResumeItem[]> {
  const users = await embyFetch<any[]>('/Users');
  if (!users?.length) return [];
  const uid = users.find((u: any) => u.Name === 'root')?.Id ?? users[0].Id;
  const data = await embyFetch<any>('/Users/' + uid + '/Items/Resume', {
    Limit: '20', IncludeItemTypes: 'Episode',
    Fields: 'SeriesName,ParentIndexNumber,IndexNumber,UserData',
  });
  if (!data?.Items) return [];
  return data.Items.map((ep: any) => ({
    name: ep.Name ?? '', series: ep.SeriesName ?? '',
    season: ep.ParentIndexNumber ?? 0, episode: ep.IndexNumber ?? 0,
    percentage: Math.round(ep.UserData?.PlayedPercentage ?? 0),
  }));
}

export async function getActivityLog(): Promise<EmbyActivity[]> {
  const data = await embyFetch<any>('/System/ActivityLog/Entries', { Limit: '20' });
  if (!data?.Items) return [];
  return data.Items.map((e: any) => ({
    date: (e.Date ?? '').slice(0, 16).replace('T', ' ') ?? '', name: e.Name ?? '',
    type: e.Type ?? '', user: e.UserId ?? '', severity: e.Severity ?? '',
  }));
}
