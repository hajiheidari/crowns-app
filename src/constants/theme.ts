/** App colors (spec §8). Region palette order must match REGION_COLOR_NAMES in src/engine. */
export const Colors = {
  light: {
    background: '#FAF7F0',
    surface: '#FFFFFF',
    surfaceMuted: '#F1ECE2',
    border: '#E4DDD0',
    text: '#1F1B16',
    textSecondary: '#6B645A',
    gold: '#C9A227',
    goldText: '#8A6D0B',
    primary: '#1F1B16',
    onPrimary: '#FAF7F0',
    danger: '#C62828',
    gridThick: '#2B2620',
    gridThin: 'rgba(43, 38, 32, 0.18)',
    mark: '#2B2620',
    autoMark: 'rgba(43, 38, 32, 0.28)',
    flame: '#E8590C',
    success: '#2B8A3E',
  },
  dark: {
    background: '#1C1A17',
    surface: '#26231F',
    surfaceMuted: '#302C27',
    border: '#3A352F',
    text: '#F3EEE6',
    textSecondary: '#A69E92',
    gold: '#E0BD4A',
    goldText: '#E0BD4A',
    primary: '#F3EEE6',
    onPrimary: '#1C1A17',
    danger: '#FF6B6B',
    gridThick: '#0E0D0B',
    gridThin: 'rgba(0, 0, 0, 0.35)',
    mark: '#F3EEE6',
    autoMark: 'rgba(243, 238, 230, 0.35)',
    flame: '#FF8A3D',
    success: '#69DB7C',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const RegionColors = {
  light: ['#C9B6E4', '#F6C28B', '#A9CBEF', '#B5DDA4', '#D3D3D3', '#F4A6A6', '#F3E49A', '#9FDCD3', '#F2B8D8', '#D2B49C', '#D7EC9A'],
  dark: ['#6E5A9E', '#A86A2E', '#3F6FA3', '#4F8A45', '#6B6B6B', '#A5484C', '#A89530', '#2F8C80', '#A35486', '#7D5A40', '#7F9A33'],
} as const;
