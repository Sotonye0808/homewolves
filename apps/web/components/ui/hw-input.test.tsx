import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HwInput } from './hw-input';

describe('HwInput', () => {
  it('renders an input with the glass styling by default', () => {
    render(<HwInput placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveClass('rounded-full', 'border-glass');
  });

  it('renders a plain input when glass is disabled', () => {
    render(<HwInput placeholder="Name" glass={false} />);
    const input = screen.getByPlaceholderText('Name');
    expect(input).not.toHaveClass('rounded-full');
  });

  it('forwards value and change events', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HwInput aria-label="email" onChange={onChange} />);
    await user.type(screen.getByLabelText('email'), 'abc');
    expect(onChange).toHaveBeenCalled();
  });

  it('merges custom className', () => {
    render(<HwInput placeholder="Name" className="extra" />);
    expect(screen.getByPlaceholderText('Name')).toHaveClass('extra');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<HwInput placeholder="Name" disabled />);
    expect(screen.getByPlaceholderText('Name')).toBeDisabled();
  });
});