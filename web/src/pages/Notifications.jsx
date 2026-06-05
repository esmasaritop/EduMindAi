import { useEffect, useState } from 'react';
import { BellOff, CheckCheck, Target, BookOpen, BarChart3 } from 'lucide-react';
import { getNotifications, markAllRead, markRead } from '../api/notifications';
import { NOTIFICATION_FILTERS, getNotificationMeta } from '../utils/notifications';

const READ_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'unread', label: 'Okunmamış' },
  { id: 'read', label: 'Okunmuş' },
];

function notifyUnreadCount(count) {
  window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { unreadCount: count } }));
}

function FilterTabs({ active, onChange, counts }) {
  return (
    <div style={styles.filters}>
      {NOTIFICATION_FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          style={{
            ...styles.filterBtn,
            ...(active === filter.id ? styles.filterBtnActive : {}),
          }}
        >
          {filter.label}
          {counts[filter.id] > 0 && (
            <span style={styles.filterCount}>{counts[filter.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function ReadFilterTabs({ active, onChange, unreadCount, readCount }) {
  const counts = { all: unreadCount + readCount, unread: unreadCount, read: readCount };

  return (
    <div style={styles.readFilters}>
      {READ_FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          style={{
            ...styles.readFilterBtn,
            ...(active === filter.id ? styles.readFilterBtnActive : {}),
          }}
        >
          {filter.label} ({counts[filter.id]})
        </button>
      ))}
    </div>
  );
}

function NotificationItem({ notification, onRead }) {
  const meta = getNotificationMeta(notification.type);

  const handleClick = async () => {
    if (!notification.is_read) {
      await markRead(notification.id);
      onRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        ...styles.item,
        ...(notification.is_read ? styles.itemRead : styles.itemUnread),
        cursor: notification.is_read ? 'default' : 'pointer',
      }}
    >
      <div style={styles.itemLeft}>
        <div style={{
          ...styles.typeBadge,
          background: meta.bg,
          color: meta.color,
          opacity: notification.is_read ? 0.75 : 1,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.itemTopRow}>
            <span style={{ ...styles.typeLabel, color: meta.color }}>{meta.label}</span>
            {notification.is_read
              ? <span style={styles.readBadge}>Okundu</span>
              : <span style={styles.newDot}>Yeni</span>}
          </div>
          <div style={{ ...styles.itemTitle, color: notification.is_read ? '#64748b' : '#0f172a' }}>
            {notification.title}
          </div>
          <div style={styles.itemMessage}>{notification.message}</div>
        </div>
      </div>
      <div style={styles.itemDate}>
        {new Date(notification.created_at).toLocaleString('tr-TR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </div>
    </div>
  );
}

function NotificationSection({ title, items, onRead }) {
  if (!items.length) return null;

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.list}>
        {items.map((n) => (
          <NotificationItem key={n.id} notification={n} onRead={onRead} />
        ))}
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');

  const fetchNotifications = (type = typeFilter, silent = false) => {
    if (!silent) setInitialLoading(true);
    getNotifications(type)
      .then((res) => {
        const items = res.data.data ?? [];
        setNotifications(items);
        notifyUnreadCount(items.filter((n) => !n.is_read).length);
      })
      .catch(() => setNotifications([]))
      .finally(() => setInitialLoading(false));
  };

  useEffect(() => { fetchNotifications(typeFilter); }, [typeFilter]);

  const handleMarkAll = async () => {
    setMarking(true);
    await markAllRead();
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      notifyUnreadCount(0);
      return updated;
    });
    setMarking(false);
  };

  const handleRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      notifyUnreadCount(updated.filter((n) => !n.is_read).length);
      return updated;
    });
  };

  const unreadItems = notifications.filter((n) => !n.is_read);
  const readItems = notifications.filter((n) => n.is_read);

  const visibleNotifications = notifications.filter((n) => {
    if (readFilter === 'unread') return !n.is_read;
    if (readFilter === 'read') return n.is_read;
    return true;
  });

  const visibleUnread = visibleNotifications.filter((n) => !n.is_read);
  const visibleRead = visibleNotifications.filter((n) => n.is_read);

  const counts = notifications.reduce((acc, n) => {
    acc.all = (acc.all ?? 0) + 1;
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, { all: 0 });

  const goalCount = notifications.filter((n) => n.type?.startsWith('goal_')).length;
  const topicCount = notifications.filter((n) => n.type?.startsWith('topic_')).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Bildirimler</h2>
          <p style={styles.subtitle}>
            Okunan bildirimler silinmez, geçmişinizde kalır.
          </p>
        </div>
        {unreadItems.length > 0 && (
          <button onClick={handleMarkAll} disabled={marking} style={styles.markBtn}>
            <CheckCheck size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {marking ? 'İşaretleniyor...' : 'Tümünü Okundu İşaretle'}
          </button>
        )}
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <Target size={18} color="#4f46e5" />
          <div>
            <div style={styles.summaryValue}>{goalCount}</div>
            <div style={styles.summaryLabel}>Hedef bildirimi</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <BookOpen size={18} color="#0891b2" />
          <div>
            <div style={styles.summaryValue}>{topicCount}</div>
            <div style={styles.summaryLabel}>Konu bildirimi</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <BarChart3 size={18} color="#7c3aed" />
          <div>
            <div style={styles.summaryValue}>{unreadItems.length}</div>
            <div style={styles.summaryLabel}>Okunmamış</div>
          </div>
        </div>
      </div>

      <ReadFilterTabs
        active={readFilter}
        onChange={setReadFilter}
        unreadCount={unreadItems.length}
        readCount={readItems.length}
      />

      <FilterTabs active={typeFilter} onChange={setTypeFilter} counts={counts} />

      {initialLoading ? (
        <div style={styles.center}>Yükleniyor...</div>
      ) : visibleNotifications.length === 0 ? (
        <div style={styles.empty}>
          <BellOff size={44} color="#cbd5e1" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {readFilter === 'unread' ? 'Okunmamış bildirim yok' : readFilter === 'read' ? 'Okunmuş bildirim yok' : 'Henüz bildirim yok'}
          </div>
          <div style={{ fontSize: 13 }}>
            {readFilter === 'read'
              ? 'Okuduğunuz bildirimler burada listelenir.'
              : 'Hedef belirleyip konularınızda çalışmaya başladığınızda bildirimler burada görünecek.'}
          </div>
        </div>
      ) : readFilter === 'all' ? (
        <div style={styles.sectionsWrap}>
          <NotificationSection title={`Okunmamış (${visibleUnread.length})`} items={visibleUnread} onRead={handleRead} />
          <NotificationSection title={`Okunmuş (${visibleRead.length})`} items={visibleRead} onRead={handleRead} />
        </div>
      ) : (
        <div style={styles.list}>
          {visibleNotifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  markBtn: { padding: '8px 16px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#4f46e5', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  summaryCard: { background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 },
  summaryValue: { fontSize: 20, fontWeight: 700, color: '#0f172a' },
  summaryLabel: { fontSize: 12, color: '#94a3b8' },
  readFilters: { display: 'flex', gap: 8 },
  readFilterBtn: { padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 500 },
  readFilterBtnActive: { background: '#0f172a', borderColor: '#0f172a', color: '#fff', fontWeight: 600 },
  filters: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  filterBtn: { padding: '7px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 },
  filterBtnActive: { background: '#eef2ff', borderColor: '#a5b4fc', color: '#4f46e5', fontWeight: 600 },
  filterCount: { background: '#4f46e5', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, fontWeight: 700 },
  sectionsWrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    background: '#ffffff', borderRadius: 10, padding: '14px 18px',
    border: '1px solid #e2e8f0', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  itemUnread: { border: '1px solid #a5b4fc', background: '#fafafe' },
  itemRead: { background: '#f8fafc', border: '1px solid #e2e8f0' },
  itemLeft: { display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 },
  typeBadge: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  itemTopRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' },
  newDot: { fontSize: 10, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '1px 7px', borderRadius: 99 },
  readBadge: { fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '1px 7px', borderRadius: 99 },
  itemTitle: { fontSize: 14, fontWeight: 600, marginBottom: 3 },
  itemMessage: { fontSize: 13, color: '#64748b', lineHeight: 1.5 },
  itemDate: { fontSize: 12, color: '#94a3b8', flexShrink: 0, textAlign: 'right' },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' },
};
