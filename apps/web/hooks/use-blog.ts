'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBlogPosts,
  fetchBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/lib/blog';

export function useBlogPosts(params?: { page?: number; limit?: number; published?: string }) {
  return useQuery({
    queryKey: ['blog-posts', params?.page ?? 1],
    queryFn: () =>
      fetchBlogPosts({
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        published: params?.published,
      }),
  });
}

export function useBlogPost(id: string) {
  return useQuery({
    queryKey: ['blog-post', id],
    queryFn: () => fetchBlogPost(id),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBlogPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateBlogPost(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}