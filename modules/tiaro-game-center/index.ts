/**
 * Game Center (iPhone/iPad only; see ios/TiaroGameCenterModule.swift). Null on Android, on the web and in builds made
 * before the module existed, so callers just skip Game Center then.
 */
import { requireOptionalNativeModule } from 'expo';

export interface TiaroGameCenter {
  isAuthenticated(): boolean;
  authenticate(): Promise<boolean>;
  submitScore(score: number, leaderboardId: string): Promise<boolean>;
  reportAchievement(achievementId: string, percent: number): Promise<boolean>;
  showDashboard(): Promise<boolean>;
}

export default requireOptionalNativeModule<TiaroGameCenter>('TiaroGameCenter');
