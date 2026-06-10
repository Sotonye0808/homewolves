'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAgentTransactions, useCreateTransaction } from '@/hooks/use-transactions';
import { useListings } from '@/hooks/use-listings';
import { HwButton, HwInput, HwBadge, HwCard } from '@/components/ui';

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Purchase',
  RENTAL: 'Rental',
  SHORTLET: 'Shortlet',
};

export default function AgentTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useAgentTransactions(statusFilter ? { status: statusFilter } : undefined);
  const createTx = useCreateTransaction();
  const { data: listingsData } = useListings({ ownerId: 'self' });

  const transactions = data?.transactions ?? [];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createTx.mutateAsync({
      listingId: fd.get('listingId') as string,
      buyerId: fd.get('buyerId') as string,
      type: fd.get('type') as 'PURCHASE' | 'RENTAL' | 'SHORTLET',
    });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Transactions</h1>
          <p className="text-sm text-white/50 mt-1">Manage deal lifecycles</p>
        </div>
        <HwButton onClick={() => setShowCreate(true)} variant="primary">
          New Transaction
        </HwButton>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'INITIATED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === s
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/50 hover:text-white/80 border border-transparent'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <HwCard className="p-12 text-center">
          <p className="text-white/50">No transactions yet</p>
          <p className="text-sm text-white/30 mt-1">Create your first transaction to start the deal workflow</p>
        </HwCard>
      ) : (
        <div className="grid gap-4">
          {transactions.map((tx: any) => (
            <Link key={tx.id} href={`/dashboard/agent/transactions/${tx.id}`}>
              <HwCard className="p-4 hover:bg-white/[0.08] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {tx.listing?.media?.[0]?.url ? (
                      <img
                        src={tx.listing.media[0].url}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-white/30 text-xs">
                        No img
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {tx.listing?.title ?? 'Unknown Listing'}
                      </p>
                      <p className="text-sm text-white/50">
                        Buyer: {tx.buyer?.firstName} {tx.buyer?.lastName}
                      </p>
                      <p className="text-xs text-white/30">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-white/40">
                      Step {tx.currentStep}/{(tx.stepsJson as any[])?.length ?? 5}
                    </span>
                    <HwBadge className={STATUS_COLORS[tx.status] ?? ''}>{tx.status}</HwBadge>
                  </div>
                </div>
              </HwCard>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <HwCard className="w-full max-w-lg p-6 space-y-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">New Transaction</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">Listing</label>
                <select
                  name="listingId"
                  required
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                >
                  <option value="">Select listing</option>
                  {(listingsData?.listings ?? []).map((l: any) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">Buyer ID</label>
                <HwInput name="buyerId" required placeholder="Buyer user ID" />
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">Type</label>
                <select
                  name="type"
                  required
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                >
                  <option value="PURCHASE">Purchase</option>
                  <option value="RENTAL">Rental</option>
                  <option value="SHORTLET">Shortlet</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <HwButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</HwButton>
                <HwButton type="submit" variant="primary" disabled={createTx.isPending}>
                  {createTx.isPending ? 'Creating...' : 'Create Transaction'}
                </HwButton>
              </div>
            </form>
          </HwCard>
        </div>
      )}
    </div>
  );
}
