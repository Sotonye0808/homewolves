'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSignatureRequest,
  fetchTransactionSignatures,
  fetchSignature,
  getSignatureEmbedUrl,
} from '@/lib/signatures';

export function useTransactionSignatures(transactionId: string) {
  return useQuery({
    queryKey: ['transaction-signatures', transactionId],
    queryFn: () => fetchTransactionSignatures(transactionId),
    enabled: !!transactionId,
  });
}

export function useSignature(id: string) {
  return useQuery({
    queryKey: ['signature', id],
    queryFn: () => fetchSignature(id),
    enabled: !!id,
  });
}

export function useCreateSignatureRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSignatureRequest,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['transaction-signatures', variables.transactionId] });
    },
  });
}

export function useSignatureEmbedUrl(id: string) {
  return useQuery({
    queryKey: ['signature-embed', id],
    queryFn: () => getSignatureEmbedUrl(id),
    enabled: !!id,
  });
}
