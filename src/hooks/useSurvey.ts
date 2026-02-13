/**
 * Hook para gerenciamento do questionário de desbloqueio
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/config/storage';
import type { SurveyData } from '@/types';

interface UseSurveyReturn {
  isCompleted: boolean;
  surveyData: SurveyData | null;
  submitSurvey: (data: Omit<SurveyData, 'completedAt'>) => void;
  resetSurvey: () => void;
}

export function useSurvey(): UseSurveyReturn {
  const [isCompleted, setIsCompleted] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);

  // Verificar status ao montar
  useEffect(() => {
    const completed = storage.hasCompletedSurvey();
    const data = storage.getSurveyData();
    queueMicrotask(() => {
      setIsCompleted(completed);
      setSurveyData(data);
    });
  }, []);

  const submitSurvey = useCallback((data: Omit<SurveyData, 'completedAt'>) => {
    const completeData: SurveyData = {
      ...data,
      completedAt: new Date().toISOString(),
    };
    
    storage.setSurveyData(completeData);
    setSurveyData(completeData);
    setIsCompleted(true);
  }, []);

  const resetSurvey = useCallback(() => {
    storage.remove('cin_survey_completed');
    storage.remove('cin_survey_data');
    setIsCompleted(false);
    setSurveyData(null);
  }, []);

  return {
    isCompleted,
    surveyData,
    submitSurvey,
    resetSurvey,
  };
}
