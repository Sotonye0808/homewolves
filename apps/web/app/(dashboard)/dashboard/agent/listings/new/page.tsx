'use client';

import { useRouter } from 'next/navigation';
import { ListingForm } from '@/components/listings/ListingForm';

export default function NewListingPage() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm mb-2 transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Create New Listing</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          Fill in the details below to list your property
        </p>
      </div>

      <ListingForm onComplete={() => router.push('/dashboard/agent/listings')} />
    </div>
  );
}
