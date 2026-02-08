/**
 * Badges de Verificação para Artigos
 * E-E-A-T Signals visuais
 */

import { CheckCircle, Shield, MessageSquare, AlertTriangle, Clock, FileCheck } from 'lucide-react';

export type VerificationStatus = 
  | 'verified' 
  | 'fact-checked' 
  | 'opinion' 
  | 'analysis' 
  | 'breaking' 
  | 'updated';

interface FactCheckBadgeProps {
  status: VerificationStatus;
  className?: string;
  showLabel?: boolean;
}

const BADGE_CONFIG: Record<VerificationStatus, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  label: string;
  description: string;
}> = {
  'verified': {
    color: 'text-[#15803d]',
    bgColor: 'bg-[#dcfce7]',
    borderColor: 'border-[#86efac]',
    icon: CheckCircle,
    label: 'Verificado',
    description: 'Conteúdo verificado pela equipe editorial',
  },
  'fact-checked': {
    color: 'text-[#1d4ed8]',
    bgColor: 'bg-[#dbeafe]',
    borderColor: 'border-[#93c5fd]',
    icon: FileCheck,
    label: 'Checagem de Fatos',
    description: 'Fatos verificados por editor de checagem',
  },
  'opinion': {
    color: 'text-[#a16207]',
    bgColor: 'bg-[#fef9c3]',
    borderColor: 'border-[#fde047]',
    icon: MessageSquare,
    label: 'Opinião',
    description: 'Conteúdo de opinião do autor',
  },
  'analysis': {
    color: 'text-[#7c3aed]',
    bgColor: 'bg-[#ede9fe]',
    borderColor: 'border-[#c4b5fd]',
    icon: Shield,
    label: 'Análise',
    description: 'Análise baseada em dados verificáveis',
  },
  'breaking': {
    color: 'text-[#dc2626]',
    bgColor: 'bg-[#fee2e2]',
    borderColor: 'border-[#fca5a5]',
    icon: AlertTriangle,
    label: 'Em Desenvolvimento',
    description: 'Notícia em desenvolvimento, sujeita a atualizações',
  },
  'updated': {
    color: 'text-[#0d9488]',
    bgColor: 'bg-[#ccfbf1]',
    borderColor: 'border-[#5eead4]',
    icon: Clock,
    label: 'Atualizado',
    description: 'Artigo atualizado com novas informações',
  },
};

export function FactCheckBadge({ 
  status, 
  className = '', 
  showLabel = true 
}: FactCheckBadgeProps) {
  const config = BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 
        px-2.5 py-1 
        ${config.bgColor} ${config.color} 
        border ${config.borderColor}
        rounded-full text-xs font-medium
        ${className}
      `}
      title={config.description}
    >
      <Icon className="w-3.5 h-3.5" />
      {showLabel && config.label}
    </span>
  );
}

// Badge para header de artigo (versão maior)
export function FactCheckBadgeLarge({ 
  status, 
  className = '' 
}: Omit<FactCheckBadgeProps, 'showLabel'>) {
  const config = BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-2 
        px-4 py-2 
        ${config.bgColor} ${config.color} 
        border ${config.borderColor}
        rounded-lg
        ${className}
      `}
    >
      <Icon className="w-5 h-5" />
      <div>
        <span className="block text-sm font-semibold">{config.label}</span>
        <span className="block text-xs opacity-80">{config.description}</span>
      </div>
    </div>
  );
}

// Indicador de revisão por fact-checker
interface ReviewedByBadgeProps {
  reviewerName: string;
  reviewerSlug: string;
  reviewDate?: string;
  className?: string;
}

export function ReviewedByBadge({ 
  reviewerName, 
  reviewerSlug, 
  reviewDate,
  className = '' 
}: ReviewedByBadgeProps) {
  return (
    <a
      href={`/autor/${reviewerSlug}/`}
      className={`
        inline-flex items-center gap-2 
        px-3 py-2 
        bg-[#f0fdf4] text-[#15803d]
        border border-[#86efac]
        rounded-lg text-sm
        hover:bg-[#dcfce7] transition-colors
        ${className}
      `}
      title={`Verificado por ${reviewerName}`}
    >
      <CheckCircle className="w-4 h-4" />
      <span>
        Verificado por <span className="font-medium">{reviewerName}</span>
        {reviewDate && (
          <span className="text-[#22c55e]">
            {' '}em {new Date(reviewDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </span>
    </a>
  );
}

// Lista de múltiplos badges
interface FactCheckBadgeListProps {
  statuses: VerificationStatus[];
  className?: string;
}

export function FactCheckBadgeList({ statuses, className = '' }: FactCheckBadgeListProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statuses.map((status) => (
        <FactCheckBadge key={status} status={status} />
      ))}
    </div>
  );
}
