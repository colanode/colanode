import { Icon,IconData } from '@/shared/types/icons';

export const getIconUrl = (id: string): string => {
  return `asset://icons/${id}.svg`;
};

export const searchIcons = (query: string, icons: IconData): Icon[] => {
  const lowercaseQuery = query.toLowerCase().trim();
  if (lowercaseQuery.length === 0) {
    return [];
  }

  const results: Icon[] = [];
  for (const icon of Object.values(icons.icons)) {
    if (
      icon.code.includes(lowercaseQuery) ||
      icon.tags?.some((tag) => tag.includes(lowercaseQuery))
    ) {
      results.push(icon);
      if (results.length >= 50) {
        return results;
      }
    }
  }

  return results;
};
