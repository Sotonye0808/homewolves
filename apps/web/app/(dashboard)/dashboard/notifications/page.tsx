'use client';

import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useState } from 'react';

const TYPE_ICONS: Record<string, string> = {
  MESSAGE_RECEIVED: '💬',
  INSPECTION_SCHEDULED: '📅',
  TRANSACTION_CREATED: '📄',
  TRANSACTION_ADVANCED: '➡️',
  TRANSACTION_APPROVED: '✅',
  TRANSACTION_REJECTED: '❌',
  LISTING_CREATED: '🏠',
  LISTING_APPROVED: '✅',
  LISTING_REJECTED: '❌',
  WISHLIST_INTEREST: '⭐',
  PRICE_DROP: '💰',
  NEW_MATCHING_LISTING: '🔔',
  REFERRAL_SIGNUP: '👤',
  COMMISSION_EARNED: '💵',
};

export default function NotificationsPage() {
  const { user, accessToken } = useAuth();
  const { notifications, total, unreadCount, markRead, markAllRead } = useNotifications(user?.id, accessToken ?? undefined);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread'
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  const handleMarkRead = (ids: string[]) => {
    markRead(ids);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            Notifications
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {unreadCount} unread · {total} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="px-4 py-2 text-sm font-medium rounded-full transition-colors"
            style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', color: 'var(--color-brand-accent)' }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-sm font-medium rounded-full transition-colors capitalize"
            style={{
              background: filter === f ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
              color: filter === f ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              border: filter === f ? 'none' : '1px solid var(--color-border-glass)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filtered.map((n: any) => (
            <div
              key={n.id}
              className="flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer"
              style={{
                background: n.read ? 'var(--color-bg-elevated)' : 'var(--color-bg-glass)',
                border: '1px solid var(--color-border-glass)',
              }}
              onClick={() => {
                if (!n.read) handleMarkRead([n.id]);
              }}
            >
              <div className="text-xl mt-0.5">
                {TYPE_ICONS[n.type] ?? '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {n.title}
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ background: 'var(--color-brand-accent)' }} />
                    )}
                  </p>
                  <span className="text-[10px] whitespace-nowrap shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {n.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
