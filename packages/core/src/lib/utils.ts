export const compareString = (a?: string | null, b?: string | null): number => {
  if (a === b) {
    return 0;
  }

  if (a === undefined || a === null) {
    return -1;
  }

  if (b === undefined || b === null) {
    return 1;
  }

  if (a > b) {
    return 1;
  }

  return -1;
};

export const compareDate = (
  a?: Date | string | null,
  b?: Date | string | null
): number => {
  const aIsNull = a == null || a === undefined;
  const bIsNull = b == null || b === undefined;

  if (aIsNull && bIsNull) {
    return 0;
  }

  if (aIsNull) {
    return -1;
  }

  if (bIsNull) {
    return 1;
  }

  const aDate = typeof a === 'string' ? new Date(a) : a;
  const bDate = typeof b === 'string' ? new Date(b) : b;

  return aDate.getTime() - bDate.getTime();
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const emailRegex =
  /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
export const isValidEmail = (email: string) => {
  if (!email) return false;

  const emailParts = email.split('@');

  if (emailParts.length !== 2) return false;

  const account = emailParts[0];
  const address = emailParts[1];

  if (!account || !address) return false;

  if (account.length > 64) return false;

  if (address.length > 255) return false;

  const domainParts = address.split('.');

  if (domainParts.some((part) => part.length > 63)) return false;

  return emailRegex.test(email);
};

export const isSameDay = (
  date1: Date | string | null,
  date2: Date | string | null
) => {
  if (date1 == null) {
    return false;
  }

  if (date2 == null) {
    return false;
  }

  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
};

export const toUTCDate = (dateParam: Date | string): Date => {
  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
};

export const isStringArray = (
  value: unknown | null | undefined
): value is string[] => {
  if (value == null) {
    return false;
  }

  if (value === undefined) {
    return false;
  }

  if (value === null) {
    return false;
  }

  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
};

export const formatDate = (dateParam: Date | string | undefined): string => {
  if (dateParam == null) {
    return 'N/A';
  }

  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${monthNames[monthIndex]} ${day}, ${year} at ${hour}:${minute}`;
};

export const timeAgo = (dateParam: Date | string) => {
  if (dateParam == null) {
    return 'N/A';
  }

  let date = dateParam;
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const diff = Number(new Date()) - date.getTime();
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;
  switch (true) {
    case diff < minute: {
      const seconds = Math.round(diff / 1000);
      return seconds < 5 ? 'Now' : `${seconds} seconds ago`;
    }
    case diff < hour: {
      const minutes = Math.round(diff / minute);
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    case diff < day: {
      const hours = Math.round(diff / hour);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    case diff < month: {
      const days = Math.round(diff / day);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    case diff < year: {
      const months = Math.round(diff / month);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    case diff > year: {
      const years = Math.round(diff / year);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
    default:
      return '';
  }
};

export const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
