import { createLink, LinkComponent } from '@tanstack/react-router';
import * as React from 'react';

import { useApp } from '@colanode/ui/contexts/app';
import { useLayout } from '@colanode/ui/contexts/layout';

const isNewTabClick = (
  event: React.MouseEvent<HTMLAnchorElement>,
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>['target']
) => {
  if (target === '_blank') {
    return true;
  }

  return event.metaKey || event.ctrlKey || event.shiftKey || event.button === 2;
};

const DesktopLinkComponent = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
  const layout = useLayout();
  const { onClick, target, ...rest } = props;

  return (
    <a
      ref={ref}
      {...rest}
      target={target}
      onClick={(e) => {
        if (rest.href && isNewTabClick(e, target)) {
          e.preventDefault();
          e.stopPropagation();
          layout.openInNewTab(rest.href as string);
          return;
        }

        onClick?.(e);
      }}
    />
  );
});

const BasicLinkComponent = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
  const app = useApp();
  if (app.type === 'desktop') {
    return <DesktopLinkComponent ref={ref} {...props} />;
  }

  return <a ref={ref} {...props} />;
});

const CreatedLinkComponent = createLink(BasicLinkComponent);

export const Link: LinkComponent<typeof BasicLinkComponent> = (props) => {
  return <CreatedLinkComponent {...props} />;
};
