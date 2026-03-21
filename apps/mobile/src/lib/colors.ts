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
  background: '#111111',
  surface: '#1a1a1a',
  surfaceHover: '#222222',
  surfaceActive: '#2a2a2a',
  surfaceAccent: '#142b2b',
  surfaceAccentDeep: '#1a3535',
  surfaceGrouped: '#161616',

  border: '#262626',
  borderSubtle: '#2e2e2e',

  text: 'rgba(255,255,255,0.9)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.48)',
  textMuted: 'rgba(255,255,255,0.42)',
  textPlaceholder: 'rgba(255,255,255,0.35)',

  primary: '#3ECFAA',
  primaryLight: '#5DDABA',
  primaryText: '#ffffff',
  primaryMuted: 'rgba(62, 207, 170, 0.12)',

  error: '#E5534B',
  errorBackground: '#2d2020',
  success: '#6BC5A0',
  warning: '#D4A046',
  warningDark: '#b45309',

  overlay: 'rgba(0, 0, 0, 0.5)',
  sheetHandle: '#555555',

  tabBarBackground: '#141414',
  tabBarBorder: '#1e1e1e',
  tabBarActive: 'rgba(255,255,255,0.9)',
  tabBarInactive: 'rgba(255,255,255,0.35)',
  cardBackground: 'rgba(255,255,255,0.06)',
  cardSeparator: 'rgba(255,255,255,0.08)',
  iconPillBackground: 'rgba(255,255,255,0.07)',
  badgeBackground: '#3ECFAA',
  badgeText: '#111111',
  ownBubble: '#1a3030',
  otherBubble: '#1a1a1a',
  replyAccent: '#5DDABA',
  inputBackground: '#1a1a1a',
  sendButton: '#3ECFAA',
  sendButtonDisabled: '#333333',
  listSeparator: 'rgba(255,255,255,0.08)',
};

export const lightColors: ThemeColors = {
  background: '#f8f8f8',
  surface: '#efefef',
  surfaceHover: '#e5e5e5',
  surfaceActive: '#dbdbdb',
  surfaceAccent: '#e0f5ee',
  surfaceAccentDeep: '#c0ece0',
  surfaceGrouped: '#f2f2f2',

  border: '#d4d4d4',
  borderSubtle: '#c0c0c0',

  text: '#1a1a1a',
  textSecondary: '#5a5a5a',
  textTertiary: '#6a6a6a',
  textMuted: '#777777',
  textPlaceholder: '#8a8a8a',

  primary: '#2DB88A',
  primaryLight: '#3ECFAA',
  primaryText: '#ffffff',
  primaryMuted: 'rgba(45, 184, 138, 0.10)',

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
  badgeBackground: '#2DB88A',
  badgeText: '#ffffff',
  ownBubble: '#d0f0e4',
  otherBubble: '#e8e8e8',
  replyAccent: '#2DB88A',
  inputBackground: '#efefef',
  sendButton: '#2DB88A',
  sendButtonDisabled: '#c0c0c0',
  listSeparator: 'rgba(0,0,0,0.08)',
};
