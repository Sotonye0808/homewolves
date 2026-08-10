import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HwButton } from './hw-button';

describe('HwButton', () => {
  it('renders children and defaults to primary/md variants', () => {
    render(<HwButton>Save</HwButton>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-accent', 'rounded-full');
  });

  it('applies the outline variant classes', () => {
    render(<HwButton variant="outline">Cancel</HwButton>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button).toHaveClass('border-border');
    expect(button).not.toHaveClass('bg-accent');
  });

  it('applies size classes', () => {
    render(<HwButton size="lg">Large</HwButton>);
    const button = screen.getByRole('button', { name: 'Large' });
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<HwButton onClick={onClick}>Click me</HwButton>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <HwButton disabled onClick={onClick}>
        Disabled
      </HwButton>,
    );
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards extra props and className', () => {
    render(
      <HwButton className="extra-class" aria-label="custom label">
        Submit
      </HwButton>,
    );
    const button = screen.getByRole('button', { name: 'custom label' });
    expect(button).toHaveClass('extra-class');
  });
});
