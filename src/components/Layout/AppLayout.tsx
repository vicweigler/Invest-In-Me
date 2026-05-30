import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Briefcase, Clock, TrendingUp,
  TrendingDown, Activity, Settings, LogOut
} from 'lucide-react';
import { useMarketStore, ftse100IndexLevel } from '../../store/marketStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatPerf, perfColor } from '../../data/generator';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', label: 'My Portfolio', icon: Briefcase },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/market', label: 'FTSE 100', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = time.getHours();
  const m = time.getMinutes();
  const isOpen = (h > 8 || (h === 8 && m >= 0)) && (h < 16 || (h === 16 && m < 30));
  return (
    <div className="flex items-center gap-3">
      <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        isOpen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'
      )}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500')} />
        {isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
        <Clock size={13} />
        <span className="font-mono">{time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuthStore();
  if (!user) return null;

  const initial = user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?';
  const name = user.displayName ?? user.email ?? 'Account';

  return (
    <div className="flex items-center gap-2 ml-3 min-w-0">
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full pl-1 pr-2 sm:pr-3 py-1 min-w-0">
        {user.photoURL ? (
          <img src={user.photoURL} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{initial}</div>
        )}
        <span className="hidden sm:block text-slate-300 text-xs font-medium max-w-[120px] truncate">{name}</span>
      </div>
      <button
        onClick={signOut}
        title="Sign out"
        className="hidden sm:block p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-lg transition-all"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const { stocks, isLoaded, loadMarket, lastUpdated } = useMarketStore();
  const { signOut } = useAuthStore();
  const { lightMode } = useSettingsStore();
  const indexLevel = ftse100IndexLevel(stocks);

  // Ensure market data is loaded regardless of which page the user lands on
  useEffect(() => { if (!isLoaded) loadMarket(); }, [isLoaded, loadMarket]);

  useEffect(() => {
    const color = lightMode ? '#FFFFFF' : '#0D1424';
    const scheme = lightMode ? 'light' : 'dark';

    document.documentElement.classList.toggle('light-mode', lightMode);
    // Keep color-scheme in sync on the element itself (fastest signal to Android)
    document.documentElement.style.colorScheme = scheme;

    // Update every meta signal that Android / Samsung Internet reads for the nav bar
    const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = color;

    const metaScheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (metaScheme) metaScheme.content = scheme;

    return () => { document.documentElement.classList.remove('light-mode'); };
  }, [lightMode]);

  const avgDayPerf = stocks.length
    ? stocks.reduce((s, st) => s + st.dayPerf, 0) / stocks.length
    : 0;

  const isPositive = avgDayPerf >= 0;

  return (
    <div className="h-screen bg-[#0A0F1E] flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── TOP HEADER ─────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.06] bg-[#0D1424] flex items-center px-4 gap-3 shrink-0 z-50">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">Invest<span className="text-indigo-400">-In-It</span></span>
        </Link>

        {/* FTSE 100 ticker — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-3 ml-2">
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-slate-500" />
            <span className="text-slate-400 text-xs font-medium">FTSE 100</span>
          </div>
          <span className="text-white font-mono font-semibold text-sm">{indexLevel.toLocaleString('en-GB')}</span>
          <div className={clsx('flex items-center gap-1 text-xs font-semibold', perfColor(avgDayPerf))}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatPerf(avgDayPerf)}
          </div>
        </div>

        {/* FTSE summary on mobile — compact */}
        <div className="flex sm:hidden items-center gap-1.5 ml-1">
          <span className="text-slate-500 text-xs">FTSE</span>
          <span className="text-white font-mono text-xs font-semibold">{indexLevel.toLocaleString('en-GB')}</span>
          <span className={clsx('text-xs font-semibold', perfColor(avgDayPerf))}>{formatPerf(avgDayPerf)}</span>
        </div>

        <div className="flex-1" />

        {/* Clock — hidden on mobile */}
        <div className="hidden sm:block">
          <LiveClock />
        </div>

        <UserMenu />
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── SIDEBAR — desktop only ──────────────────────────────────────── */}
        <aside className="hidden md:flex w-56 border-r border-white/[0.06] bg-[#0D1424] flex-col shrink-0">
          <nav className="flex flex-col gap-1 p-3 pt-4">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  )}
                >
                  <Icon size={16} className={active ? 'text-indigo-400' : ''} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-white/[0.06]">
            <p className="text-slate-600 text-[10px] leading-relaxed">
              Data is simulated for educational purposes only. Not financial advice.
            </p>
            {lastUpdated && (
              <p className="text-slate-700 text-[10px] mt-1">
                Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden md:pb-0 min-w-0" style={{paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))'}}>          
          <Outlet />
        </main>
      </div>

      {/* ── BOTTOM NAV — mobile only ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D1424] border-t border-white/[0.06] flex flex-col z-50">
        <div className="flex items-center h-16">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all',
                  active ? 'text-indigo-400' : 'text-slate-500'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          {/* Sign out — rightmost */}
          <button
            onClick={signOut}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-slate-500 transition-all"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-medium">Sign Out</span>
          </button>
        </div>
        <div style={{height: 'env(safe-area-inset-bottom)'}} className="bg-[#0D1424]" />
      </nav>
    </div>
  );
}
