import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight;
  const itemHeight = item ? item.offsetHeight : 0;

  const top = item.offsetTop;
  const bottom = top + itemHeight;

  if (top < container.scrollTop) {
    container.scrollTop -= container.scrollTop - top + 5;
  } else if (bottom > containerHeight + container.scrollTop) {
    container.scrollTop += bottom - containerHeight - container.scrollTop + 5;
  }
};

export const getDisplayedDates = (
  month: Date
): {
  first: Date;
  last: Date;
} => {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Find the first day of the visible grid (Sunday of the week containing the 1st of the month)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const firstDayDisplayed = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    firstDayOfMonth.getDate() - firstDayOfWeek
  );

  // Find the last day of the visible grid (Saturday of the week containing the last day of the month)
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const lastDayDisplayed = new Date(
    lastDayOfMonth.getFullYear(),
    lastDayOfMonth.getMonth(),
    lastDayOfMonth.getDate() + (6 - lastDayOfWeek)
  );

  return { first: firstDayDisplayed, last: lastDayDisplayed };
};

export const pluralize = (count: number, singular: string, plural: string) =>
  count === 1 ? singular : plural;

export const percentToNumber = (total: number, percent: number) =>
  Math.round((total * percent) / 100);

export const numberToPercent = (total: number, number: number) =>
  Math.round((number / total) * 100);
