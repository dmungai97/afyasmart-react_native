import { create } from 'zustand';
import type { SymptomsAnalysisRequest } from '@/src/services/symptoms.service';

export type DiagnosisCondition = {
  name: string;
  probability: number;
  level: 'High' | 'Medium' | 'Low';
  color: string;
};

export type PendingDiagnosis = {
  symptoms: string;
  summary: string;
  urgency: 'High' | 'Medium' | 'Low';
  conditions: DiagnosisCondition[];
  medications: {
    name: string;
    note: string;
  }[];
  preparedAt: string;
};

export type HealthCheckAnswers = {
  age?: string;
  feeling?: string;
  concern?: string;
};

type DiagnosisState = {
  pendingDiagnosis: PendingDiagnosis | null;
  healthCheckAnswers: HealthCheckAnswers | null;
  pendingAnalysisRequest: SymptomsAnalysisRequest | null;
  setPendingDiagnosis: (diagnosis: PendingDiagnosis) => void;
  clearPendingDiagnosis: () => void;
  setHealthCheckAnswers: (answers: HealthCheckAnswers) => void;
  setPendingAnalysisRequest: (request: SymptomsAnalysisRequest) => void;
  clearPendingAnalysisRequest: () => void;
};

export function buildDiagnosisFromSymptoms(symptoms: string): PendingDiagnosis {
  const text = symptoms.toLowerCase();
  const hasFever = text.includes('fever') || text.includes('chills') || text.includes('sweat');
  const hasCough = text.includes('cough') || text.includes('cold') || text.includes('throat');
  const hasStomach = text.includes('stomach') || text.includes('diarrhea') || text.includes('vomit') || text.includes('nausea');
  const hasChest = text.includes('chest') || text.includes('breath');

  const urgency: PendingDiagnosis['urgency'] = hasChest ? 'High' : hasFever || hasStomach ? 'Medium' : 'Low';
  const conditions: DiagnosisCondition[] = hasStomach
    ? [
        { name: 'Gastroenteritis or food poisoning', probability: 72, level: 'High', color: '#DC2626' },
        { name: 'Acid reflux or gastritis', probability: 48, level: 'Medium', color: '#D97706' },
        { name: 'Typhoid or other infection', probability: 31, level: 'Low', color: '#0B6E6E' },
      ]
    : hasCough
      ? [
          { name: 'Flu or upper respiratory infection', probability: 76, level: 'High', color: '#DC2626' },
          { name: 'Allergic irritation', probability: 42, level: 'Medium', color: '#D97706' },
          { name: 'Bronchitis', probability: 28, level: 'Low', color: '#0B6E6E' },
        ]
      : hasFever
        ? [
            { name: 'Malaria or viral fever', probability: 68, level: 'High', color: '#DC2626' },
            { name: 'Flu-like illness', probability: 47, level: 'Medium', color: '#D97706' },
            { name: 'Bacterial infection', probability: 24, level: 'Low', color: '#0B6E6E' },
          ]
        : [
            { name: 'General viral illness', probability: 61, level: 'High', color: '#DC2626' },
            { name: 'Fatigue or dehydration', probability: 39, level: 'Medium', color: '#D97706' },
            { name: 'Stress-related symptoms', probability: 22, level: 'Low', color: '#0B6E6E' },
          ];

  return {
    symptoms,
    urgency,
    conditions,
    preparedAt: new Date().toISOString(),
    summary: 'Your symptoms have been analysed against common patterns. This is not a final medical diagnosis, but it helps you decide what to do next.',
    medications: [
      { name: 'Paracetamol 500mg', note: 'For fever or pain. Follow label directions and avoid overdose.' },
      { name: 'Oral rehydration salts', note: 'Useful if you have vomiting, diarrhea, fever, or signs of dehydration.' },
      { name: 'Doctor review', note: urgency === 'High' ? 'Recommended urgently because of your symptom pattern.' : 'Recommended if symptoms persist or worsen.' },
    ],
  };
}

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  pendingDiagnosis: null,
  healthCheckAnswers: null,
  pendingAnalysisRequest: null,
  setPendingDiagnosis: (diagnosis) => set({ pendingDiagnosis: diagnosis }),
  clearPendingDiagnosis: () => set({ pendingDiagnosis: null }),
  setHealthCheckAnswers: (answers) => set({ healthCheckAnswers: answers }),
  setPendingAnalysisRequest: (request) => set({ pendingAnalysisRequest: request }),
  clearPendingAnalysisRequest: () => set({ pendingAnalysisRequest: null }),
}));
