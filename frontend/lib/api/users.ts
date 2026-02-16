import { get, patch, post } from './client';
import type { Profile, ProfileUpdatePayload, UserAchievement } from '@/types/user';

export async function bootstrapUser(token: string): Promise<Profile> {
  return post<Profile>('/api/users/bootstrap', {}, token);
}

export async function getMyProfile(token: string): Promise<Profile> {
  return get<Profile>('/api/users/me', token);
}

export async function updateMyProfile(
  payload: ProfileUpdatePayload,
  token: string
): Promise<Profile> {
  return patch<Profile>('/api/users/me', payload, token);
}

export async function getMyAchievements(token: string): Promise<UserAchievement[]> {
  return get<UserAchievement[]>('/api/users/achievements', token);
}
