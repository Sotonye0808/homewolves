'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLog, fetchEntityAudit, exportAuditCsv, exportAuditPdf } from '@/lib/audit';

export function useAuditLog(params?: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => fetchAuditLog(params),
  });
}

export function useEntityAudit(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['entity-audit', entityType, entityId],
    queryFn: () => fetchEntityAudit(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useExportAuditCsv() {
  return async (params?: Parameters<typeof exportAuditCsv>[0]) => {
    const data = await exportAuditCsv(params);
    const blob = new Blob([data as any], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
}

export function useExportAuditPdf() {
  return async (params?: Parameters<typeof exportAuditPdf>[0]) => {
    const data = await exportAuditPdf(params);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write((data as any).html);
      w.document.close();
      w.print();
    }
  };
}
