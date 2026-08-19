import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogPostForm } from './post-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { role: 'ADMIN', firstName: 'Ada', lastName: 'Okon' } }),
}));

describe('BlogPostForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits title, slug and content', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ id: 'p-1' });
    render(<BlogPostForm submitLabel="Create post" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'My First Post');
    const slugInput = screen.getByLabelText('Slug');
    await user.clear(slugInput);
    await user.type(slugInput, 'my-first-post');
    await user.click(screen.getByRole('button', { name: 'Create post' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My First Post', slug: 'my-first-post', published: false }),
      ),
    );
  });

  it('requires a title before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BlogPostForm submitLabel="Create post" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create post' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders error when submit fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    render(<BlogPostForm submitLabel="Create post" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'X');
    await user.type(screen.getByLabelText('Slug'), 'x');
    await user.click(screen.getByRole('button', { name: 'Create post' }));

    await waitFor(() => expect(screen.getByText('boom')).toBeTruthy());
  });
});