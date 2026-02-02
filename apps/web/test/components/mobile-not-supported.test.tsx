import { describe, expect, it } from 'vitest';

import { MobileNotSupported } from '@colanode/web/components/mobile-not-supported';
import { customRender, screen } from '../test-utils';

describe('components/MobileNotSupported', () => {
  it('renders the main heading', () => {
    customRender(<MobileNotSupported />);

    const heading = screen.getByRole('heading', {
      name: /mobile not supported/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('displays a greeting message', () => {
    customRender(<MobileNotSupported />);

    expect(screen.getByText(/hey there!/i)).toBeInTheDocument();
  });

  it('renders the Smartphone icon', () => {
    const { container } = customRender(<MobileNotSupported />);

    // lucide-react renders SVGs
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
