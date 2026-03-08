export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceAccent: string;
  surfaceAccentDeep: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;

  // Primary / accent
  primary: string;
  primaryLight: string;
  primaryText: string;

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
  badgeBackground: string;
  badgeText: string;
  ownBubble: string;
  otherBubble: string;
  replyAccent: string;
  inputBackground: string;
  sendButton: string;
  sendButtonDisabled: string;
}

export const darkColors: ThemeColors = {
  background: '#0a0a0a',
  surface: '#111111',
  surfaceHover: '#1a1a1a',
  surfaceActive: '#1a1a1a',
  surfaceAccent: '#1a2a3a',
  surfaceAccentDeep: '#1a3a5c',

  border: '#222222',
  borderSubtle: '#333333',

  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  textPlaceholder: '#666666',

  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryText: '#ffffff',

  error: '#ef4444',
  errorBackground: '#2a1a1a',
  success: '#34d399',
  warning: '#fbbf24',
  warningDark: '#b45309',

  overlay: 'rgba(0, 0, 0, 0.5)',
  sheetHandle: '#444444',

  tabBarBackground: '#111111',
  tabBarBorder: '#222222',
  tabBarActive: '#ffffff',
  tabBarInactive: '#666666',
  badgeBackground: '#ef4444',
  badgeText: '#ffffff',
  ownBubble: '#1a3a5c',
  otherBubble: '#1a1a1a',
  replyAccent: '#60a5fa',
  inputBackground: '#1a1a1a',
  sendButton: '#3b82f6',
  sendButtonDisabled: '#333333',
};

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceHover: '#ebebeb',
  surfaceActive: '#e0e0e0',
  surfaceAccent: '#e8f0fe',
  surfaceAccentDeep: '#d0e1fd',

  border: '#e0e0e0',
  borderSubtle: '#cccccc',

  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#888888',
  textPlaceholder: '#999999',

  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryText: '#ffffff',

  error: '#dc2626',
  errorBackground: '#fef2f2',
  success: '#16a34a',
  warning: '#d97706',
  warningDark: '#92400e',

  overlay: 'rgba(0, 0, 0, 0.3)',
  sheetHandle: '#cccccc',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#e0e0e0',
  tabBarActive: '#111111',
  tabBarInactive: '#999999',
  badgeBackground: '#dc2626',
  badgeText: '#ffffff',
  ownBubble: '#d0e1fd',
  otherBubble: '#f0f0f0',
  replyAccent: '#2563eb',
  inputBackground: '#f0f0f0',
  sendButton: '#2563eb',
  sendButtonDisabled: '#cccccc',
};
