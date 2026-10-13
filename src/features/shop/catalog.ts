/**
 * Shop items bought with coins (Amir 2026-10-13): board styles and crowns. Board styles keep each region's hue in the
 * same order as REGION_COLOR_NAMES (purple, orange, blue, green, gray, red, yellow, teal, pink, brown, lime), so hint
 * texts like "the purple region" stay true; only the tone, frame and feel change.
 */
import { RegionColors } from '@/constants/theme';

export interface BoardTheme {
  id: string;
  price: number;
  light: readonly string[];
  dark: readonly string[];
  /** Thick region lines and outer frame; null = the app's default. */
  frame: { light: string; dark: string } | null;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'classic', price: 0, light: RegionColors.light, dark: RegionColors.dark, frame: null },
  {
    id: 'sorbet',
    price: 200,
    light: ['#E3D4F7', '#FFD9B3', '#CFE5FB', '#D3EFC6', '#E6E6E6', '#FBCACA', '#FBF0BC', '#C8EFE9', '#F9D3E8', '#E8D2BF', '#E8F5C2'],
    dark: ['#7D68AE', '#B87C42', '#4F80B5', '#5E9A54', '#7A7A7A', '#B5585C', '#B8A540', '#3F9C90', '#B36496', '#8D6A50', '#8FAA43'],
    frame: { light: '#8C7A9E', dark: '#D9CDE8' },
  },
  {
    id: 'vivid',
    price: 300,
    light: ['#B08AE8', '#FFAE5C', '#7DB8F5', '#8FD677', '#BDBDBD', '#FF8080', '#FFE066', '#5FD3C4', '#FF9ED2', '#C99A73', '#C6EB6A'],
    dark: ['#7B4FCF', '#E07B1F', '#2F7FD6', '#3E9E2F', '#5E5E5E', '#D03B42', '#D4B21E', '#13A08F', '#D2479A', '#8F5E36', '#86B82A'],
    frame: null,
  },
  {
    id: 'jewel',
    price: 500,
    light: ['#9C7BC9', '#E39A55', '#6F9FD8', '#7DB66B', '#A9A9A9', '#D9777A', '#E2C661', '#55B3A6', '#D886B6', '#B08A6A', '#AFCF5E'],
    dark: ['#5B3E91', '#9A5420', '#22528F', '#2F6E2A', '#4A4A4A', '#8E2B33', '#8F7A16', '#14695F', '#8C2F67', '#5E3E26', '#5C7A1E'],
    frame: { light: '#3B2A55', dark: '#E8D9A8' },
  },
  {
    id: 'royal',
    price: 800,
    light: ['#C5B0E6', '#F2BE8A', '#A8C6EC', '#B2D7A2', '#D9D4C7', '#EFA9A9', '#F0DC8C', '#9FD5CB', '#EDB9D5', '#D3B79E', '#D3E59A'],
    dark: ['#6A4F9C', '#A2652B', '#3A679C', '#4A8040', '#6E675A', '#9E4448', '#A08A2A', '#2C8478', '#9A4E80', '#7A563C', '#7A9330'],
    frame: { light: '#B8901F', dark: '#E0BD4A' },
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
