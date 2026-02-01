import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

/**
 * Custom render function that wraps components with common providers.
 */
export function customRender(ui: ReactElement, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    // Add any providers here if needed in the future
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
