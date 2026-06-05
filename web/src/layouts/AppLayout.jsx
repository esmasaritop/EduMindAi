import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Timer, Target, Bell, ChevronLeft, ChevronRight, LogOut, HelpCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotificationSummary } from '../api/notifications';

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',          Icon: LayoutDashboard },
  { path: '/subjects',        label: 'Derslerim',          Icon: BookOpen },
  { path: '/timer',           label: 'Zamanlayıcı',        Icon: Clock },
  { path: '/study-sessions',  label: 'Çalışma Seansları',  Icon: Timer },
  { path: '/goals',           label: 'Hedefler',           Icon: Target },
  { path: '/questions',       label: 'Sorularım',          Icon: HelpCircle },
  { path: '/notifications',   label: 'Bildirimler',        Icon: Bell },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = () => {
      getNotificationSummary()
        .then((res) => setUnreadCount(res.data.data?.unread_count ?? 0))
        .catch(() => setUnreadCount(0));
    };

    loadUnread();

    const handleUpdate = (event) => {
      if (typeof event.detail?.unreadCount === 'number') {
        setUnreadCount(event.detail.unreadCount);
      } else {
        loadUnread();
      }
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, [location.pathname]);

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 68 }}>
        <div style={styles.logo}>
          {sidebarOpen ? (
            <div style={styles.logoRow}>
              <img src="/logo.png" alt="EduMind AI" style={styles.logoImg} />
              <span style={styles.logoText}>
                EduMind <span style={styles.logoAi}>AI</span>
              </span>
            </div>
          ) : (
            <img src="/logo.png" alt="EduMind AI" style={styles.logoImgSmall} />
          )}
        </div>

        <nav style={styles.nav}>
          {navItems.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            const showBadge = path === '/notifications' && unreadCount > 0;
            return (
              <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                <div style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                  <div style={styles.navIconWrap}>
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                    {showBadge && !sidebarOpen && <span style={styles.navDot} />}
                  </div>
                  {sidebarOpen && (
                    <span style={styles.navLabelRow}>
                      <span style={styles.navLabel}>{label}</span>
                      {showBadge && <span style={styles.navBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
          {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </aside>

      {/* Main */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <div style={styles.topbarTitle}>
            {navItems.find((n) => n.path === location.pathname)?.label ?? 'EduMind AI'}
          </div>
          <div style={styles.topbarRight}>
            <div style={styles.userChip}>
              <span style={styles.userAvatar}>{user?.name?.[0]?.toUpperCase()}</span>
              <span style={styles.userName}>{user?.name}</span>
            </div>
            <button onClick={logout} style={styles.logoutBtn}>
              <LogOut size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Çıkış
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    background: '#f1f5f9',
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
  },
  sidebar: {
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s',
    borderRight: '1px solid #e2e8f0',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
  },
  logo: {
    padding: '14px 16px',
    borderBottom: '1px solid #e2e8f0',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 38,
    height: 38,
    objectFit: 'contain',
    flexShrink: 0,
  },
  logoImgSmall: {
    width: 36,
    height: 36,
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
  },
  logoText: {
    fontSize: 17,
    fontWeight: 800,
    color: '#0f172a',
    whiteSpace: 'nowrap',
  },
  logoAi: {
    color: '#6366f1',
  },
  nav: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: '#eef2ff',
    color: '#4f46e5',
    fontWeight: 600,
  },
  navIcon: { fontSize: 17, flexShrink: 0 },
  navIconWrap: { position: 'relative', display: 'flex', flexShrink: 0 },
  navDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' },
  navLabelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: 8 },
  navLabel: { fontSize: 14 },
  navBadge: { background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center' },
  toggleBtn: {
    margin: '10px',
    padding: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    background: '#ffffff',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#0f172a',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: '5px 12px 5px 6px',
  },
  userAvatar: {
    width: 26,
    height: 26,
    background: '#6366f1',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: '26px',
    textAlign: 'center',
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 500,
  },
  logoutBtn: {
    padding: '6px 14px',
    background: '#fff',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 24,
    background: '#f1f5f9',
  },
};
