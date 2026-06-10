'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadDocument,
  fetchTransactionDocuments,
  deleteDocument,
  updateDocumentVisibility,
  getDocumentUploadUrl,
} from '@/lib/documents';

export function useTransactionDocuments(transactionId: string) {
  return useQuery({
    queryKey: ['transaction-documents', transactionId],
    queryFn: () => fetchTransactionDocuments(transactionId),
    enabled: !!transactionId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['transaction-documents', variables.transactionId] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transaction-documents'] });
    },
  });
}

export function useUpdateDocumentVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: string }) =>
      updateDocumentVisibility(id, visibility),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transaction-documents'] });
    },
  });
}

export function useGetDocumentUploadUrl() {
  return useMutation({
    mutationFn: ({ filename, contentType }: { filename: string; contentType: string }) =>
      getDocumentUploadUrl(filename, contentType),
  });
}
