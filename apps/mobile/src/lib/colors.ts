export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceAccent: string;
  surfaceAccentDeep: string;
  surfaceGrouped: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textPlaceholder: string;

  // Primary / accent
  primary: string;
  primaryLight: string;
  primaryText: string;
  primaryMuted: string;

  // Semantic
  error: string;
  errorBackground: string;
  success: string;
  warning: string;
  warningDark: string;

  // Overlays
  overlay: string;
  sheetHandle: string;

  // Components
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  cardBackground: string;
  cardSeparator: string;
  iconPillBackground: string;
  badgeBackground: string;
  badgeText: string;
  ownBubble: string;
  otherBubble: string;
  replyAccent: string;
  inputBackground: string;
  sendButton: string;
  sendButtonDisabled: string;
  listSeparator: string;
}

export const darkColors: ThemeColors = {
  background: '#131313',
  surface: '#1e1e1e',
  surfaceHover: '#242424',
  surfaceActive: '#242424',
  surfaceAccent: '#1a2a3a',
  surfaceAccentDeep: '#203450',
  surfaceGrouped: '#191919',

  border: '#2a2a2a',
  borderSubtle: '#333333',

  text: 'rgba(255,255,255,0.9)',
  textSecondary: 'rgba(255,255,255,0.5)',
  textTertiary: 'rgba(255,255,255,0.42)',
  textMuted: 'rgba(255,255,255,0.35)',
  textPlaceholder: 'rgba(255,255,255,0.3)',

  primary: '#4B7BE5',
  primaryLight: '#6B9AEF',
  primaryText: '#ffffff',
  primaryMuted: 'rgba(75, 123, 229, 0.12)',

  error: '#E5534B',
  errorBackground: '#2d2020',
  success: '#6BC5A0',
  warning: '#D4A046',
  warningDark: '#b45309',

  overlay: 'rgba(0, 0, 0, 0.5)',
  sheetHandle: '#555555',

  tabBarBackground: '#1a1a1a',
  tabBarBorder: '#242424',
  tabBarActive: 'rgba(255,255,255,0.9)',
  tabBarInactive: 'rgba(255,255,255,0.35)',
  cardBackground: 'rgba(255,255,255,0.04)',
  cardSeparator: 'rgba(255,255,255,0.06)',
  iconPillBackground: 'rgba(255,255,255,0.07)',
  badgeBackground: '#4B7BE5',
  badgeText: '#ffffff',
  ownBubble: '#203450',
  otherBubble: '#1e1e1e',
  replyAccent: '#6B9AEF',
  inputBackground: '#1e1e1e',
  sendButton: '#4B7BE5',
  sendButtonDisabled: '#333333',
  listSeparator: 'rgba(255,255,255,0.06)',
};

export const lightColors: ThemeColors = {
  background: '#f8f8f8',
  surface: '#efefef',
  surfaceHover: '#e5e5e5',
  surfaceActive: '#dbdbdb',
  surfaceAccent: '#e0eafa',
  surfaceAccentDeep: '#c8d9f5',
  surfaceGrouped: '#f2f2f2',

  border: '#d4d4d4',
  borderSubtle: '#c0c0c0',

  text: '#1a1a1a',
  textSecondary: '#5a5a5a',
  textTertiary: '#6a6a6a',
  textMuted: '#888888',
  textPlaceholder: '#999999',

  primary: '#4B7BE5',
  primaryLight: '#6B9AEF',
  primaryText: '#ffffff',
  primaryMuted: 'rgba(75, 123, 229, 0.10)',

  error: '#D1453B',
  errorBackground: '#fef2f2',
  success: '#16a34a',
  warning: '#d97706',
  warningDark: '#92400e',

  overlay: 'rgba(0, 0, 0, 0.3)',
  sheetHandle: '#bbbbbb',

  tabBarBackground: '#f8f8f8',
  tabBarBorder: '#e0e0e0',
  tabBarActive: '#1a1a1a',
  tabBarInactive: '#888888',
  cardBackground: 'rgba(0,0,0,0.04)',
  cardSeparator: 'rgba(0,0,0,0.08)',
  iconPillBackground: 'rgba(0,0,0,0.06)',
  badgeBackground: '#4B7BE5',
  badgeText: '#ffffff',
  ownBubble: '#c8d9f5',
  otherBubble: '#e8e8e8',
  replyAccent: '#4B7BE5',
  inputBackground: '#efefef',
  sendButton: '#4B7BE5',
  sendButtonDisabled: '#c0c0c0',
  listSeparator: 'rgba(0,0,0,0.08)',
};
