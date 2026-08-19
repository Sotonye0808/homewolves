'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchEmailTemplates,
  saveEmailTemplate,
  previewEmailTemplate,
  seedEmailTemplates,
  type EmailTemplateDto,
} from '@/lib/email-templates';

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchEmailTemplates,
  });
}

export function useSaveEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveEmailTemplate,
    onSuccess: (saved) => {
      qc.setQueryData<EmailTemplateDto[]>(['email-templates'], (rows) => {
        if (!rows) return [saved];
        const idx = rows.findIndex((r) => r.key === saved.key);
        if (idx >= 0) {
          const next = [...rows];
          next[idx] = saved;
          return next;
        }
        return [...rows, saved];
      });
    },
  });
}

export function usePreviewEmailTemplate() {
  return useMutation({ mutationFn: previewEmailTemplate });
}

export function useSeedEmailTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedEmailTemplates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-templates'] }),
  });
}