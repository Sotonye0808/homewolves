import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from './rich-text-editor';

function Harness({ initial }: { initial: string }) {
  const [html, setHtml] = useState(initial);
  return <RichTextEditor value={html} onChange={setHtml} />;
}

describe('RichTextEditor', () => {
  it('renders initial HTML content', () => {
    render(<Harness initial="<p>Hello</p>" />);
    expect(screen.getByTestId('rich-text-editor').innerHTML).toContain('Hello');
  });

  it('calls onChange with editor content on input', () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="" onChange={onChange} />);
    const editor = screen.getByTestId('rich-text-editor');
    fireEvent.input(editor, { target: { innerHTML: '<b>bold</b>' } });
    expect(onChange).toHaveBeenCalledWith('<b>bold</b>');
  });

  it('toggles to HTML source mode and back', async () => {
    const user = userEvent.setup();
    render(<Harness initial="<p>x</p>" />);
    await user.click(screen.getByRole('button', { name: 'HTML' }));
    const textarea = screen.getByLabelText('HTML source');
    await user.clear(textarea);
    await user.type(textarea, '<p>y</p>');
    await user.click(screen.getByRole('button', { name: 'Visual' }));
    expect(screen.getByTestId('rich-text-editor').innerHTML).toContain('<p>y</p>');
  });
});