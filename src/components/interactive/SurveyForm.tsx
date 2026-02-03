/**
 * Formulário de Questionário para Desbloqueio
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CONTENT_CONFIG } from '@/config/content';
import type { SurveyData } from '@/types';

interface SurveyFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function SurveyForm({ onComplete, onCancel }: SurveyFormProps) {
  const [formData, setFormData] = useState<Partial<SurveyData>>({
    name: '',
    age: undefined,
    gender: undefined,
    region: '',
    interests: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      newErrors.age = 'Idade inválida';
    }
    if (!formData.gender) {
      newErrors.gender = 'Selecione uma opção';
    }
    if (!formData.region) {
      newErrors.region = 'Selecione uma região';
    }
    if (!formData.interests || formData.interests.length === 0) {
      newErrors.interests = 'Selecione pelo menos um interesse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onComplete();
    }
  };

  const toggleInterest = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...(prev.interests || []), interestId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <fieldset>
        <Label htmlFor="survey-name">Nome completo</Label>
        <Input
          id="survey-name"
          type="text"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Seu nome"
          className={errors.name ? 'border-[#c40000]' : ''}
        />
        {errors.name && <p className="text-xs text-[#c40000] mt-1">{errors.name}</p>}
      </fieldset>

      {/* Idade */}
      <fieldset>
        <Label htmlFor="survey-age">Idade</Label>
        <Input
          id="survey-age"
          type="number"
          min={13}
          max={120}
          value={formData.age || ''}
          onChange={e => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
          placeholder="Sua idade"
          className={errors.age ? 'border-[#c40000]' : ''}
        />
        {errors.age && <p className="text-xs text-[#c40000] mt-1">{errors.age}</p>}
      </fieldset>

      {/* Sexo */}
      <fieldset>
        <legend className="text-sm font-medium mb-2">Sexo</legend>
        <section className="flex gap-4">
          {[
            { value: 'M', label: 'Masculino' },
            { value: 'F', label: 'Feminino' },
            { value: 'O', label: 'Outro' },
            { value: 'N', label: 'Prefiro não dizer' },
          ].map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={formData.gender === option.value}
                onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value as SurveyData['gender'] }))}
                className="accent-[#c40000]"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </section>
        {errors.gender && <p className="text-xs text-[#c40000] mt-1">{errors.gender}</p>}
      </fieldset>

      {/* Região */}
      <fieldset>
        <Label htmlFor="survey-region">Região</Label>
        <select
          id="survey-region"
          value={formData.region}
          onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md text-sm ${errors.region ? 'border-[#c40000]' : 'border-[#e5e5e5]'}`}
        >
          <option value="">Selecione sua região</option>
          {CONTENT_CONFIG.regions.map(region => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        {errors.region && <p className="text-xs text-[#c40000] mt-1">{errors.region}</p>}
      </fieldset>

      {/* Interesses */}
      <fieldset>
        <legend className="text-sm font-medium mb-2">Áreas de interesse</legend>
        <section className="grid grid-cols-2 gap-2">
          {CONTENT_CONFIG.interests.map(interest => (
            <label key={interest.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.interests?.includes(interest.id)}
                onCheckedChange={() => toggleInterest(interest.id)}
              />
              <span className="text-sm">{interest.name}</span>
            </label>
          ))}
        </section>
        {errors.interests && <p className="text-xs text-[#c40000] mt-1">{errors.interests}</p>}
      </fieldset>

      {/* Ações */}
      <footer className="flex gap-3 justify-end pt-4 border-t border-[#e5e5e5]">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#c40000] hover:bg-[#a00000]">
          Concluir e Desbloquear
        </Button>
      </footer>
    </form>
  );
}
