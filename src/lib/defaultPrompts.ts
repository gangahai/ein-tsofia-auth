// Default prompts configuration for Ein Tsofia system
// Modular structure - each userType imports from separate files

import { UserType, PromptConfig, PromptSection } from '@/types/types';
import { familyPrompt, kindergartenPrompt, caregiverPrompt } from './prompts';

// English Prompts (Superior Reasoning)
export const defaultPromptsEn: Record<Exclude<UserType, null>, PromptConfig> = {
  family: familyPrompt,
  caregiver: caregiverPrompt,
  kindergarten: kindergartenPrompt
};

// Hebrew Prompts (Fallback - not recommended due to reasoning limitations)
export const defaultPromptsHe: Record<Exclude<UserType, null>, PromptConfig> = {
  ...defaultPromptsEn // Use English prompts as fallback
};

// Main export
export const defaultPrompts = defaultPromptsEn;

// Utility to get prompts by user type
export function getDefaultPrompts(userType: UserType): PromptConfig | null {
  if (!userType) return null;
  return defaultPrompts[userType] || null;
}

export const saveCustomPrompts = (userType: string, prompts: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`customPrompts_${userType}`, JSON.stringify(prompts));
};

export const loadCustomPrompts = (userType: string) => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(`customPrompts_${userType}`);
  return saved ? JSON.parse(saved) : null;
};

export const resetToDefaults = (userType: string) => {
  if (typeof window === 'undefined') return null;
  localStorage.removeItem(`customPrompts_${userType}`);
  return getDefaultPrompts(userType as UserType);
};
