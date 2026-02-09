import { describe, expect, it } from 'vitest';

import { BrowserNotSupported } from '@colanode/web/components/browser-not-supported';
import { customRender, screen } from '../test-utils';

describe('components/BrowserNotSupported', () => {
  it('renders the main heading', () => {
    customRender(<BrowserNotSupported />);

    const heading = screen.getByRole('heading', {
      name: /browser not supported/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('displays a link to download the desktop app', () => {
    customRender(<BrowserNotSupported />);

    const desktopLink = screen.getByRole('link', {
      name: /desktop app/i,
    });
    expect(desktopLink).toBeInTheDocument();
    expect(desktopLink).toHaveAttribute(
      'href',
      'https://colanode.com/downloads'
    );
    expect(desktopLink).toHaveAttribute('target', '_blank');
    expect(desktopLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays a link to GitHub', () => {
    customRender(<BrowserNotSupported />);

    const githubLink = screen.getByRole('link', {
      name: /github/i,
    });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/colanode/colanode'
    );
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('renders the MonitorOff icon', () => {
    const { container } = customRender(<BrowserNotSupported />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
