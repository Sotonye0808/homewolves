import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HwCard } from './hw-card';

describe('HwCard', () => {
  it('renders children', () => {
    render(<HwCard>Card content</HwCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies the default elevated variant classes', () => {
    render(<HwCard>Default</HwCard>);
    const card = screen.getByText('Default');
    expect(card).toHaveClass('rounded-lg', 'overflow-hidden', 'bg-elevated', 'shadow-card');
  });

  it('applies the glass variant', () => {
    render(<HwCard variant="glass">Glass</HwCard>);
    expect(screen.getByText('Glass')).toHaveClass('glass-surface');
  });

  it('merges custom className', () => {
    render(<HwCard className="custom-class">Merged</HwCard>);
    expect(screen.getByText('Merged')).toHaveClass('custom-class');
  });
});