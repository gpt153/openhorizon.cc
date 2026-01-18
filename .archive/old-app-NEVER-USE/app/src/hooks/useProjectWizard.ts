import { create } from 'zustand'
import type { UserIdeaInputs } from '@/lib/types/project'

type WizardState = {
  currentStep: number
  formData: Partial<UserIdeaInputs>
  setCurrentStep: (step: number) => void
  updateFormData: (data: Partial<UserIdeaInputs>) => void
  reset: () => void
  goNext: () => void
  goBack: () => void
}

const initialFormData: Partial<UserIdeaInputs> = {
  theme: '',
  description: '',
  age_group: undefined,
  participant_count: 30,
  target_profile: undefined,
  specific_needs_description: '',
  duration_days: 10,
  activity_intensity: undefined,
  green_ambition: undefined,
  partner_status: undefined,
  partner_experience: undefined,
  preferred_countries: '',
  primary_languages: '',
  translation_support: false,
  interpretation_needed: false,
  digital_comfort: undefined,
  budget_flexibility: undefined,
  additional_notes: '',
}

export const useProjectWizard = create<WizardState>((set) => ({
  currentStep: 0,
  formData: initialFormData,

  setCurrentStep: (step) => set({ currentStep: step }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  reset: () =>
    set({
      currentStep: 0,
      formData: initialFormData,
    }),

  goNext: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4), // 0-4 (5 steps)
    })),

  goBack: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),
}))
