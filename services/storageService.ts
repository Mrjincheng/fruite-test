
import { ScoreEntry, LeaderboardData } from '../types';
import { RESET_INTERVAL_MS } from '../constants';

const STORAGE_KEY = 'fruit_slasher_leaderboard';

export const getLeaderboard = (): LeaderboardData => {
  const data = localStorage.getItem(STORAGE_KEY);
  const now = Date.now();
  
  if (!data) {
    const newData: LeaderboardData = { entries: [], nextReset: now + RESET_INTERVAL_MS };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  }

  const parsed: LeaderboardData = JSON.parse(data);
  if (now > parsed.nextReset) {
    const newData: LeaderboardData = { 
      entries: [], 
      nextReset: now + RESET_INTERVAL_MS 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  }

  return parsed;
};

export const saveScore = (entry: ScoreEntry) => {
  const current = getLeaderboard();
  const newEntries = [...current.entries, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...current,
    entries: newEntries
  }));
};
