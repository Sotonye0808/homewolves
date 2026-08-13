import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsStrip } from './stats-strip';
import { HeroSection } from './hero-section';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

describe('StatsStrip', () => {
  it('renders the platform statistics', () => {
    render(<StatsStrip />);
    expect(screen.getByRole('region', { name: 'Platform statistics' })).toBeInTheDocument();
    expect(screen.getByText('12,000+')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('1,500+')).toBeInTheDocument();
    expect(screen.getByText('₦85B+')).toBeInTheDocument();
  });
});

describe('HeroSection', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the hero headline and search box', () => {
    render(<HeroSection />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Discover Your Next Home in Africa')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('navigates to /properties on an empty search submit', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);
    await user.click(screen.getByRole('button', { name: /Search/ }));
    expect(push).toHaveBeenCalledWith('/properties');
  });

  it('navigates to a filtered search when a query is entered', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);
    await user.type(screen.getByLabelText('Search properties'), 'Lagos');
    await user.click(screen.getByRole('button', { name: /Search/ }));
    expect(push).toHaveBeenCalledWith('/properties?search=Lagos');
  });

  it('navigates on Enter key press', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);
    const input = screen.getByLabelText('Search properties');
    await user.type(input, 'Ikeja{enter}');
    expect(push).toHaveBeenCalledWith('/properties?search=Ikeja');
  });
});
