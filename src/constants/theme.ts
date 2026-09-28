/** App colors (spec §8). Region palette order must match REGION_COLOR_NAMES in src/engine. */
export const Colors = {
  light: {
    background: '#FAF7F0',
    surface: '#FFFFFF',
    text: '#1F1B16',
    textSecondary: '#6B645A',
    gold: '#C9A227',
  },
  dark: {
    background: '#1C1A17',
    surface: '#26231F',
    text: '#F3EEE6',
    textSecondary: '#A69E92',
    gold: '#E0BD4A',
  },
} as const;

export const RegionColors = {
  light: ['#C9B6E4', '#F6C28B', '#A9CBEF', '#B5DDA4', '#D3D3D3', '#F4A6A6', '#F3E49A', '#9FDCD3', '#F2B8D8', '#D2B49C', '#D7EC9A'],
  dark: ['#6E5A9E', '#A86A2E', '#3F6FA3', '#4F8A45', '#6B6B6B', '#A5484C', '#A89530', '#2F8C80', '#A35486', '#7D5A40', '#7F9A33'],
} as const;
