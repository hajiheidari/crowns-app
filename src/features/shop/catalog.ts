/**
 * Shop items bought with coins (Amir 2026-10-13): board styles and crowns. Board styles keep each region's hue in the
 * same order as REGION_COLOR_NAMES (purple, orange, blue, green, gray, red, yellow, teal, pink, brown, lime), so hint
 * texts like "the purple region" stay true; only the tone, frame and feel change.
 */
import { RegionColors } from '@/constants/theme';

import type { TextureId } from './textures';

export interface BoardTheme {
  id: string;
  price: number;
  light: readonly string[];
  dark: readonly string[];
  /** Thick region lines and outer frame; null = the app's default. */
  frame: { light: string; dark: string } | null;
  /** Drawn over the region colors (features/shop/textures.tsx). */
  texture?: TextureId;
  /** Crosses and plain crowns on dark textures. */
  mark?: string;
}

const same = (colors: string[]) => ({ light: colors, dark: colors });

/** Order = REGION_COLOR_NAMES: purple, orange, blue, green, gray, red, yellow, teal, pink, brown, lime. */
export const BOARD_THEMES: BoardTheme[] = [
  { id: 'classic', price: 0, light: RegionColors.light, dark: RegionColors.dark, frame: null },
  {
    id: 'toy',
    price: 300,
    ...same(['#8E5BD6', '#FF8A1F', '#2F7DE1', '#2EAA4A', '#A0A0A0', '#E53935', '#FFD21F', '#16B3A3', '#FF6FB1', '#9A5B2E', '#9BD22C']),
    frame: { light: '#333333', dark: '#E0E0E0' },
    texture: 'toy',
  },
  {
    id: 'football',
    price: 400,
    ...same(['#7E57C2', '#FB8C00', '#1E88E5', '#43A047', '#9E9E9E', '#E53935', '#FDD835', '#00ACC1', '#EC407A', '#8D6E63', '#C0CA33']),
    frame: { light: '#1B5E20', dark: '#A5D6A7' },
    texture: 'football',
  },
  {
    id: 'metal',
    price: 450,
    ...same(['#9C7BD0', '#E8964A', '#5E9BE0', '#5DBB7A', '#A8AEB5', '#E06A6A', '#E8C64A', '#4FC2B5', '#E68AB8', '#B08060', '#B8D85A']),
    frame: { light: '#5F6B73', dark: '#C9D1D6' },
    texture: 'metal',
  },
  {
    id: 'marble',
    price: 550,
    ...same(['#B8A6CC', '#E5B48E', '#9EB8D6', '#A8C9A4', '#C9C6C0', '#D99A96', '#E6D59A', '#98CCC4', '#E2B0C6', '#C2A48A', '#C9DA9C']),
    frame: { light: '#8C8478', dark: '#D8D2C6' },
    texture: 'marble',
  },
  {
    id: 'galaxy',
    price: 700,
    ...same(['#3B1F6E', '#7A3418', '#12305E', '#134A3A', '#2C2C3A', '#5E1630', '#6B5A12', '#0F4A55', '#5C1F55', '#3E2616', '#2F4D12']),
    frame: { light: '#8E7CC3', dark: '#B9A8F0' },
    texture: 'galaxy',
    mark: '#FFFFFF',
  },
  {
    id: 'khatam',
    price: 800,
    ...same(['#6A3D8F', '#C8742B', '#1F5FA8', '#2E7D4F', '#7A7066', '#A8323A', '#D4A62A', '#1B8A82', '#C2557F', '#7B4A2A', '#8FB33A']),
    frame: { light: '#B8901F', dark: '#E0BD4A' },
    texture: 'khatam',
    mark: '#FFFFFF',
  },
];

export interface CrownStyle {
  id: string;
  price: number;
  /** Crown fill: one color for both themes, or null = the board's mark color (classic ink). */
  fill: string | null;
  /** Small gem in the middle of the crown (null = none). */
  gem: string | null;
}

export const CROWN_STYLES: CrownStyle[] = [
  { id: 'classic', price: 0, fill: null, gem: null },
  { id: 'gold', price: 200, fill: '#D4A017', gem: null },
  { id: 'ruby', price: 400, fill: '#D4A017', gem: '#C2185B' },
  { id: 'sapphire', price: 500, fill: '#2E5AAC', gem: '#F2D16B' },
  { id: 'emerald', price: 600, fill: '#1E7B4E', gem: '#F2D16B' },
  { id: 'diamond', price: 800, fill: '#7FB8E6', gem: '#FFFFFF' },
];

export const boardTheme = (id: string) => BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
export const crownStyle = (id: string) => CROWN_STYLES.find((t) => t.id === id) ?? CROWN_STYLES[0];

/** Hint packs: a few hints at once, a little cheaper than one by one (30 each). */
export const HINT_PACKS = [
  { id: 'hints-3', hints: 3, price: 80 },
  { id: 'hints-10', hints: 10, price: 250 },
];
