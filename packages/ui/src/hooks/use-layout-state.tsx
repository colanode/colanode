import { useCallback, useState } from 'react';

import {
  ContainerMetadata,
  SidebarMenuType,
  SidebarMetadata,
} from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useWindowSize } from '@colanode/ui/hooks/use-window-size';
import { percentToNumber } from '@colanode/ui/lib/utils';

export const useLayoutState = () => {
  const workspace = useWorkspace();
  const windowSize = useWindowSize();

  const [activeContainer, setActiveContainer] = useState<'left' | 'right'>(
    'left'
  );

  const [sidebarMetadata, setSidebarMetadata] = useState<SidebarMetadata>(
    workspace.getMetadata('sidebar')?.value ?? {
      menu: 'spaces',
      width: 300,
    }
  );

  const [leftContainerMetadata, setLeftContainerMetadata] =
    useState<ContainerMetadata>(
      workspace.getMetadata('container.left')?.value ?? {
        tabs: [],
      }
    );

  const replaceLeftContainerMetadata = useCallback(
    (metadata: ContainerMetadata) => {
      setLeftContainerMetadata(metadata);
      workspace.setMetadata('container.left', {
        ...metadata,
      });
    },
    [workspace, setLeftContainerMetadata]
  );

  const [rightContainerMetadata, setRightContainerMetadata] =
    useState<ContainerMetadata>(
      workspace.getMetadata('container.right')?.value ?? {
        tabs: [],
        width: percentToNumber(windowSize.width, 40),
      }
    );

  const replaceRightContainerMetadata = useCallback(
    (metadata: ContainerMetadata) => {
      setRightContainerMetadata(metadata);
      workspace.setMetadata('container.right', {
        ...metadata,
      });
    },
    [workspace, setRightContainerMetadata]
  );

  const handleSidebarResize = useCallback(
    (width: number) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        width,
      });

      workspace.setMetadata('sidebar', {
        ...sidebarMetadata,
        width,
      });
    },
    [workspace, sidebarMetadata]
  );

  const handleMenuChange = useCallback(
    (menu: SidebarMenuType) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        menu,
      });

      workspace.setMetadata('sidebar', {
        ...sidebarMetadata,
        menu,
      });
    },
    [workspace, sidebarMetadata]
  );

  const handleRightContainerResize = useCallback(
    (width: number) => {
      setRightContainerMetadata({
        ...rightContainerMetadata,
        width,
      });

      workspace.setMetadata('container.right', {
        ...rightContainerMetadata,
        width,
      });
    },
    [workspace, rightContainerMetadata]
  );

  const handleOpenLeft = useCallback(
    (path: string) => {
      const existingTab = leftContainerMetadata.tabs.find(
        (t) => t.path === path
      );

      if (existingTab) {
        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: leftContainerMetadata.tabs.map((t) => ({
            ...t,
            active: t.path === path ? true : undefined,
            preview: t.path === path ? undefined : t.preview,
          })),
        });
      } else {
        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: [
            ...leftContainerMetadata.tabs
              .filter((t) => t.path !== path)
              .map((t) => ({
                ...t,
                active: undefined,
              })),
            { path, active: true },
          ],
        });
      }
    },
    [leftContainerMetadata]
  );

  const handleOpenRight = useCallback(
    (path: string) => {
      const existingTab = rightContainerMetadata.tabs.find(
        (t) => t.path === path
      );

      if (existingTab) {
        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: rightContainerMetadata.tabs.map((t) => ({
            ...t,
            active: t.path === path ? true : undefined,
            preview: t.path === path ? undefined : t.preview,
          })),
        });
      } else {
        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: [
            ...rightContainerMetadata.tabs
              .filter((t) => t.path !== path)
              .map((t) => ({
                ...t,
                active: undefined,
              })),
            { path, active: true },
          ],
        });
      }
    },
    [rightContainerMetadata]
  );

  const handleOpen = useCallback(
    (path: string) => {
      if (activeContainer === 'left') {
        handleOpenLeft(path);
      } else {
        handleOpenRight(path);
      }
    },
    [activeContainer, handleOpenLeft, handleOpenRight]
  );

  const handleCloseLeft = useCallback(
    (path: string) => {
      const existingTabIndex = leftContainerMetadata.tabs.findIndex(
        (t) => t.path === path
      );

      if (existingTabIndex === -1) {
        return;
      }

      const newTabs = leftContainerMetadata.tabs.filter((t) => t.path !== path);

      // Make the closest tab active, preferring the previous tab
      if (newTabs.length > 0 && !newTabs.some((t) => t.active)) {
        const nextActiveTab =
          newTabs[existingTabIndex - 1] ||
          newTabs[existingTabIndex] ||
          newTabs[0];

        newTabs.forEach((t) => {
          t.active = t.path === nextActiveTab?.path;
        });
      }

      replaceLeftContainerMetadata({
        ...leftContainerMetadata,
        tabs: newTabs,
      });

      // if the left container is empty, but the right container has tabs,
      // move all tabs from the right container to the left container
      if (newTabs.length === 0 && rightContainerMetadata.tabs.length > 0) {
        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: rightContainerMetadata.tabs,
        });

        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: [],
        });

        setActiveContainer('left');
      }
    },
    [leftContainerMetadata, rightContainerMetadata, activeContainer]
  );

  const handleCloseRight = useCallback(
    (path: string) => {
      const existingTabIndex = rightContainerMetadata.tabs.findIndex(
        (t) => t.path === path
      );

      if (existingTabIndex === -1) {
        return;
      }

      const newTabs = rightContainerMetadata.tabs.filter(
        (t) => t.path !== path
      );

      // Make the closest tab active, preferring the previous tab
      if (newTabs.length > 0 && !newTabs.some((t) => t.active)) {
        const nextActiveTab =
          newTabs[existingTabIndex - 1] ||
          newTabs[existingTabIndex] ||
          newTabs[0];

        newTabs.forEach((t) => {
          t.active = t.path === nextActiveTab?.path;
        });
      }

      replaceRightContainerMetadata({
        ...rightContainerMetadata,
        tabs: newTabs,
      });

      if (newTabs.length === 0) {
        setActiveContainer('left');
      }
    },
    [rightContainerMetadata]
  );

  const handleClose = useCallback(
    (path: string) => {
      handleCloseLeft(path);
      handleCloseRight(path);
    },
    [handleCloseLeft, handleCloseRight]
  );

  const handlePreviewLeft = useCallback(
    (path: string, keepCurrent: boolean = false) => {
      const existingTab = leftContainerMetadata.tabs.find(
        (t) => t.path === path
      );
      if (existingTab) {
        if (!existingTab.active) {
          replaceLeftContainerMetadata({
            ...leftContainerMetadata,
            tabs: leftContainerMetadata.tabs.map((t) => ({
              ...t,
              active: t.path === path ? true : undefined,
            })),
          });
        }

        return;
      }

      replaceLeftContainerMetadata({
        ...leftContainerMetadata,
        tabs: [
          ...leftContainerMetadata.tabs
            .filter((t) => keepCurrent || !t.preview)
            .map((t) => ({
              ...t,
              active: undefined,
              preview: undefined,
            })),
          { path, active: true, preview: true },
        ],
      });
    },
    [leftContainerMetadata]
  );

  const handlePreviewRight = useCallback(
    (path: string, keepCurrent: boolean = false) => {
      const existingTab = rightContainerMetadata.tabs.find(
        (t) => t.path === path
      );

      if (existingTab) {
        if (!existingTab.active) {
          replaceRightContainerMetadata({
            ...rightContainerMetadata,
            tabs: rightContainerMetadata.tabs.map((t) => ({
              ...t,
              active: t.path === path ? true : undefined,
            })),
          });
        }

        return;
      }

      replaceRightContainerMetadata({
        ...rightContainerMetadata,
        tabs: [
          ...rightContainerMetadata.tabs
            .filter((t) => keepCurrent || !t.preview)
            .map((t) => ({
              ...t,
              active: undefined,
              preview: true,
            })),
          { path, active: true, preview: true },
        ],
      });
    },
    [rightContainerMetadata]
  );

  const handlePreview = useCallback(
    (path: string, keepCurrent: boolean = false) => {
      if (activeContainer === 'left') {
        handlePreviewLeft(path, keepCurrent);
      } else {
        handlePreviewRight(path, keepCurrent);
      }
    },
    [activeContainer, handlePreviewLeft, handlePreviewRight]
  );

  const handleActivateLeft = useCallback(
    (path: string) => {
      if (!leftContainerMetadata.tabs.some((t) => t.path === path)) {
        return;
      }

      replaceLeftContainerMetadata({
        ...leftContainerMetadata,
        tabs: leftContainerMetadata.tabs.map((t) => ({
          ...t,
          active: t.path === path ? true : undefined,
        })),
      });
    },
    [leftContainerMetadata]
  );

  const handleActivateRight = useCallback(
    (path: string) => {
      if (!rightContainerMetadata.tabs.some((t) => t.path === path)) {
        return;
      }

      replaceRightContainerMetadata({
        ...rightContainerMetadata,
        tabs: rightContainerMetadata.tabs.map((t) => ({
          ...t,
          active: t.path === path ? true : undefined,
        })),
      });
    },
    [rightContainerMetadata]
  );

  const handleActivate = useCallback(
    (path: string) => {
      if (activeContainer === 'left') {
        handleActivateLeft(path);
      } else {
        handleActivateRight(path);
      }
    },
    [activeContainer, handleActivateLeft, handleActivateRight]
  );

  const handleMoveLeft = useCallback(
    (path: string, before: string | null) => {
      const tabIndex = leftContainerMetadata.tabs.findIndex(
        (t) => t.path === path
      );

      if (tabIndex === -1) {
        return;
      }

      const tab = leftContainerMetadata.tabs[tabIndex];
      if (!tab) {
        return;
      }

      if (before === null) {
        const newTabs = [...leftContainerMetadata.tabs];
        newTabs.splice(tabIndex, 1);
        newTabs.push(tab);

        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: newTabs,
        });
      } else {
        const beforeIndex = leftContainerMetadata.tabs.findIndex(
          (t) => t.path === before
        );

        if (beforeIndex === -1 || tabIndex === beforeIndex - 1) {
          return;
        }

        const newTabs = [...leftContainerMetadata.tabs];
        newTabs.splice(tabIndex, 1);

        const newIndex = newTabs.findIndex((t) => t.path === before);
        newTabs.splice(newIndex, 0, tab);

        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: newTabs,
        });
      }
    },
    [leftContainerMetadata]
  );

  const handleMoveRight = useCallback(
    (path: string, before: string | null) => {
      const tabIndex = rightContainerMetadata.tabs.findIndex(
        (t) => t.path === path
      );

      if (tabIndex === -1) {
        return;
      }

      const tab = rightContainerMetadata.tabs[tabIndex];
      if (!tab) {
        return;
      }

      if (before === null) {
        const newTabs = [...rightContainerMetadata.tabs];
        newTabs.splice(tabIndex, 1);
        newTabs.push(tab);

        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: newTabs,
        });
      } else {
        const beforeIndex = rightContainerMetadata.tabs.findIndex(
          (t) => t.path === before
        );

        if (beforeIndex === -1 || tabIndex === beforeIndex - 1) {
          return;
        }

        const newTabs = [...rightContainerMetadata.tabs];
        newTabs.splice(tabIndex, 1);

        const newIndex = newTabs.findIndex((t) => t.path === before);
        newTabs.splice(newIndex, 0, tab);

        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: newTabs,
        });
      }
    },
    [rightContainerMetadata]
  );

  const handleFocus = useCallback((side: 'left' | 'right') => {
    setActiveContainer(side);
  }, []);

  return {
    activeContainer,
    sidebarMetadata,
    leftContainerMetadata,
    rightContainerMetadata,
    handleFocus,
    handleOpen,
    handleOpenLeft,
    handleOpenRight,
    handleClose,
    handleCloseLeft,
    handleCloseRight,
    handlePreview,
    handlePreviewLeft,
    handlePreviewRight,
    handleSidebarResize,
    handleMenuChange,
    handleRightContainerResize,
    handleActivate,
    handleActivateLeft,
    handleActivateRight,
    handleMoveLeft,
    handleMoveRight,
  };
};
