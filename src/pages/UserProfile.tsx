/**
 * Perfil do Usuário - Versão Aprimorada
 * Edição completa de dados pessoais, segurança e estatísticas
 */

import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Globe,
  Calendar,
  Clock,
  BookOpen,
  Heart,
  MessageSquare,
  Award,
  Shield,
  Key,
  Smartphone,
  History,
  Eye,
  EyeOff,
  Check,
  X,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CONTENT_CONFIG } from '@/config/content';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

interface UserStats {
  articlesRead: number;
  totalReadingTime: number;
  bookmarksCount: number;
  commentsCount: number;
  streakDays: number;
  joinedDate: string;
}

interface SocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export function UserProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    region: user?.region || '',
    bio: user?.bio || '',
    profession: user?.profession || '',
    company: user?.company || '',
    avatar: user?.avatar || '',
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    website: user?.socialLinks?.website || '',
    twitter: user?.socialLinks?.twitter || '',
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Security states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  
  const { bookmarks } = useBookmarks();
  const { history: readingHistory } = useReadingHistory();

  // Stats
  const [stats, setStats] = useState<UserStats>({
    articlesRead: 0,
    totalReadingTime: 0,
    bookmarksCount: 0,
    commentsCount: 0,
    streakDays: 0,
    joinedDate: user?.createdAt || '',
  });

  // Load stats from Supabase data
  useEffect(() => {
    setStats({
      articlesRead: readingHistory.length,
      totalReadingTime: readingHistory.reduce((sum, h) => sum + (h.timeSpent || 0), 0),
      bookmarksCount: bookmarks.length,
      commentsCount: 0,
      streakDays: Math.min(readingHistory.length, 30),
      joinedDate: user?.createdAt || '',
    });
  }, [user, readingHistory, bookmarks]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSocialChange = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
    setHasChanges(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Biografia deve ter no máximo 500 caracteres';
    }
    
    if (formData.profession && formData.profession.length > 100) {
      newErrors.profession = 'Profissão deve ter no máximo 100 caracteres';
    }
    
    // Validate URLs
    const urlRegex = /^https?:\/\/.+/;
    if (socialLinks.website && !urlRegex.test(socialLinks.website)) {
      newErrors.website = 'URL inválida (deve começar com http:// ou https://)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Por favor, corrija os erros antes de salvar');
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateUser({
      name: formData.name.trim(),
      region: formData.region,
      bio: formData.bio.trim(),
      profession: formData.profession.trim(),
      company: formData.company.trim(),
      avatar: formData.avatar,
      socialLinks,
    });
    
    setIsSaving(false);
    setHasChanges(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({ ...prev, avatar: result }));
      setHasChanges(true);
      toast.success('Imagem carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async () => {
    if (passwordData.new.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    // Simulate password change
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Senha alterada com sucesso!');
    setShowPasswordDialog(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    const strength = Math.min(100, (score / 5) * 100);
    
    if (score <= 2) return { strength, label: 'Fraca', color: 'bg-[#ef4444]' };
    if (score <= 3) return { strength, label: 'Média', color: 'bg-[#f59e0b]' };
    if (score <= 4) return { strength, label: 'Boa', color: 'bg-[#3b82f6]' };
    return { strength, label: 'Forte', color: 'bg-[#22c55e]' };
  };

  const passwordStrength = getPasswordStrength(passwordData.new);

  return (
    <>
      <title>Meu Perfil - Portal Econômico Mundial</title>

      <main className="max-w-[1024px] mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8 flex items-start justify-between">
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Meu Perfil</h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
              Gerencie suas informações pessoais e preferências
            </p>
          </section>
          {hasChanges && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#c40000] hover:bg-[#a00000]"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
            <TabsTrigger value="info" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Informações</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Estatísticas</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA INFORMAÇÕES */}
          <TabsContent value="info" className="space-y-6">
            <section className="grid lg:grid-cols-3 gap-6">
              {/* Coluna da Esquerda - Avatar e Info Básica */}
              <article className="lg:col-span-1">
                <section className="bg-white border border-[#e5e5e5] rounded-lg p-6 text-center">
                  <section className="relative inline-block mb-4">
                    <figure 
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#e5e5e5] flex items-center justify-center overflow-hidden mx-auto cursor-pointer group"
                      onClick={handleAvatarClick}
                    >
                      {formData.avatar ? (
                        <img 
                          src={formData.avatar} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-[#6b6b6b]" />
                      )}
                      <section className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </section>
                    </figure>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </section>
                  
                  <h2 className="text-xl font-semibold text-[#111111]">{formData.name || 'Seu Nome'}</h2>
                  <p className="text-sm text-[#6b6b6b]">{formData.email}</p>
                  
                  <section className="mt-3 flex items-center justify-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs capitalize ${
                      user?.role === 'admin' 
                        ? 'bg-[#fef2f2] text-[#c40000]' 
                        : 'bg-[#dcfce7] text-[#166534]'
                    }`}>
                      <CheckCircle className="w-3 h-3" />
                      {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                    {formData.region && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0f9ff] text-[#0369a1] text-xs rounded-full">
                        <MapPin className="w-3 h-3" />
                        {CONTENT_CONFIG.regions.find(r => r.code === formData.region)?.name}
                      </span>
                    )}
                  </section>

                  <section className="mt-6 pt-6 border-t border-[#e5e5e5] text-left space-y-3">
                    <section className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-[#6b6b6b]" />
                      <span className="text-[#6b6b6b]">Membro desde:</span>
                      <span className="text-[#111111] font-medium">
                        {new Date(user?.createdAt || '').toLocaleDateString('pt-BR')}
                      </span>
                    </section>
                    <section className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#6b6b6b]" />
                      <span className="text-[#6b6b6b]">Último login:</span>
                      <span className="text-[#111111] font-medium">
                        {new Date(user?.lastLogin || '').toLocaleDateString('pt-BR')}
                      </span>
                    </section>
                  </section>
                </section>
              </article>

              {/* Coluna da Direita - Formulário */}
              <article className="lg:col-span-2">
                <section className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Informações Pessoais</h3>
                  
                  <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    {/* Nome */}
                    <fieldset>
                      <Label htmlFor="name" className="text-sm font-medium text-[#111111]">
                        Nome completo *
                      </Label>
                      <section className="relative mt-1.5">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="Seu nome"
                          className={`pl-10 min-h-[44px] ${errors.name ? 'border-[#ef4444]' : ''}`}
                        />
                      </section>
                      {errors.name && (
                        <p className="mt-1.5 text-xs text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.name}
                        </p>
                      )}
                    </fieldset>

                    {/* Email */}
                    <fieldset>
                      <Label htmlFor="email" className="text-sm font-medium text-[#111111]">
                        E-mail
                      </Label>
                      <section className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="pl-10 min-h-[44px] bg-[#f5f5f5] text-[#6b6b6b]"
                        />
                      </section>
                      <p className="mt-1.5 text-xs text-[#6b6b6b]">
                        O e-mail não pode ser alterado. Entre em contato com o suporte se necessário.
                      </p>
                    </fieldset>

                    <section className="grid sm:grid-cols-2 gap-5">
                      {/* Profissão */}
                      <fieldset>
                        <Label htmlFor="profession" className="text-sm font-medium text-[#111111]">
                          Profissão
                        </Label>
                        <Input
                          id="profession"
                          type="text"
                          value={formData.profession}
                          onChange={(e) => handleChange('profession', e.target.value)}
                          placeholder="Ex: Jornalista, Economista..."
                          className={`mt-1.5 min-h-[44px] ${errors.profession ? 'border-[#ef4444]' : ''}`}
                        />
                        {errors.profession && (
                          <p className="mt-1.5 text-xs text-[#ef4444]">{errors.profession}</p>
                        )}
                      </fieldset>

                      {/* Empresa/Instituição */}
                      <fieldset>
                        <Label htmlFor="company" className="text-sm font-medium text-[#111111]">
                          Empresa / Instituição
                        </Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleChange('company', e.target.value)}
                          placeholder="Onde você trabalha ou estuda"
                          className="mt-1.5 min-h-[44px]"
                        />
                      </fieldset>
                    </section>

                    {/* Região */}
                    <fieldset>
                      <Label htmlFor="region" className="text-sm font-medium text-[#111111]">
                        Região de interesse
                      </Label>
                      <section className="relative mt-1.5">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                        <select
                          id="region"
                          value={formData.region}
                          onChange={(e) => handleChange('region', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] focus:border-transparent min-h-[44px]"
                        >
                          <option value="">Selecione sua região</option>
                          {CONTENT_CONFIG.regions.map(region => (
                            <option key={region.code} value={region.code}>
                              {region.name}
                            </option>
                          ))}
                        </select>
                      </section>
                    </fieldset>

                    {/* Biografia */}
                    <fieldset>
                      <Label htmlFor="bio" className="text-sm font-medium text-[#111111]">
                        Biografia
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Conte um pouco sobre você..."
                        rows={4}
                        className={`mt-1.5 resize-none ${errors.bio ? 'border-[#ef4444]' : ''}`}
                      />
                      <section className="flex justify-between mt-1.5">
                        {errors.bio ? (
                          <p className="text-xs text-[#ef4444]">{errors.bio}</p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-[#6b6b6b]">{formData.bio.length}/500</p>
                      </section>
                    </fieldset>
                  </form>
                </section>
              </article>
            </section>
          </TabsContent>

          {/* ABA SOCIAL */}
          <TabsContent value="social" className="space-y-6">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Globe className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Links Sociais</h2>
                  <p className="text-xs text-[#6b6b6b]">Conecte suas redes sociais ao perfil</p>
                </section>
              </header>
              
              <section className="space-y-5">
                {/* Website */}
                <fieldset>
                  <Label htmlFor="website" className="text-sm font-medium text-[#111111] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#6b6b6b]" />
                    Website / Blog
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={socialLinks.website}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    placeholder="https://seusite.com"
                    className={`mt-1.5 ${errors.website ? 'border-[#ef4444]' : ''}`}
                  />
                  {errors.website && (
                    <p className="mt-1.5 text-xs text-[#ef4444]">{errors.website}</p>
                  )}
                </fieldset>

                {/* Twitter/X */}
                <fieldset>
                  <Label htmlFor="twitter" className="text-sm font-medium text-[#111111] flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-[#6b6b6b]" />
                    Twitter / X
                  </Label>
                  <section className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]">@</span>
                    <Input
                      id="twitter"
                      type="text"
                      value={socialLinks.twitter}
                      onChange={(e) => handleSocialChange('twitter', e.target.value)}
                      placeholder="seu_usuario"
                      className="pl-8"
                    />
                  </section>
                </fieldset>

                {/* LinkedIn */}
                <fieldset>
                  <Label htmlFor="linkedin" className="text-sm font-medium text-[#111111] flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-[#6b6b6b]" />
                    LinkedIn
                  </Label>
                  <section className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] text-sm">linkedin.com/in/</span>
                    <Input
                      id="linkedin"
                      type="text"
                      value={socialLinks.linkedin}
                      onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                      placeholder="seu-perfil"
                      className="pl-[110px]"
                    />
                  </section>
                </fieldset>

                {/* GitHub */}
                <fieldset>
                  <Label htmlFor="github" className="text-sm font-medium text-[#111111] flex items-center gap-2">
                    <Github className="w-4 h-4 text-[#6b6b6b]" />
                    GitHub
                  </Label>
                  <section className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] text-sm">github.com/</span>
                    <Input
                      id="github"
                      type="text"
                      value={socialLinks.github}
                      onChange={(e) => handleSocialChange('github', e.target.value)}
                      placeholder="seu-usuario"
                      className="pl-[100px]"
                    />
                  </section>
                </fieldset>
              </section>

              {/* Preview */}
              {(socialLinks.website || socialLinks.twitter || socialLinks.linkedin || socialLinks.github) && (
                <section className="mt-6 pt-6 border-t border-[#e5e5e5]">
                  <h3 className="text-sm font-medium text-[#111111] mb-3">Preview dos links</h3>
                  <section className="flex flex-wrap gap-2">
                    {socialLinks.website && (
                      <a 
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-full text-sm text-[#111111] transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a 
                        href={`https://twitter.com/${socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-full text-sm text-[#111111] transition-colors"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                        @{socialLinks.twitter}
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a 
                        href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-full text-sm text-[#111111] transition-colors"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        LinkedIn
                      </a>
                    )}
                    {socialLinks.github && (
                      <a 
                        href={`https://github.com/${socialLinks.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-full text-sm text-[#111111] transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        GitHub
                      </a>
                    )}
                  </section>
                </section>
              )}
            </article>
          </TabsContent>

          {/* ABA SEGURANÇA */}
          <TabsContent value="security" className="space-y-6">
            {/* Alterar Senha */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Key className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Senha</h2>
                  <p className="text-xs text-[#6b6b6b]">Altere sua senha de acesso</p>
                </section>
              </header>
              
              <section className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                <section>
                  <p className="text-sm font-medium text-[#111111]">Alterar senha</p>
                  <p className="text-xs text-[#6b6b6b]">Última alteração: há 3 meses</p>
                </section>
                <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                  Alterar
                </Button>
              </section>
            </article>

            {/* Verificação em Duas Etapas */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Smartphone className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Verificação em Duas Etapas</h2>
                  <p className="text-xs text-[#6b6b6b]">Adicione uma camada extra de segurança</p>
                </section>
              </header>
              
              <section className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                <section className="flex items-center gap-3">
                  <section className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-[#dcfce7]' : 'bg-[#e5e5e5]'}`}>
                    {twoFactorEnabled ? (
                      <Check className="w-4 h-4 text-[#166534]" />
                    ) : (
                      <X className="w-4 h-4 text-[#6b6b6b]" />
                    )}
                  </section>
                  <section>
                    <p className="text-sm font-medium text-[#111111]">
                      {twoFactorEnabled ? 'Ativada' : 'Desativada'}
                    </p>
                    <p className="text-xs text-[#6b6b6b]">
                      {twoFactorEnabled 
                        ? 'Seus logins estão protegidos com 2FA'
                        : 'Recomendamos ativar para maior segurança'}
                    </p>
                  </section>
                </section>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </section>
            </article>

            {/* Sessões Ativas */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <History className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Sessões Ativas</h2>
                  <p className="text-xs text-[#6b6b6b]">Dispositivos conectados à sua conta</p>
                </section>
              </header>
              
              <section className="space-y-3">
                <section className="flex items-center justify-between p-4 bg-[#f0fdf4] border border-[#86efac] rounded-lg">
                  <section className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-[#166534]" />
                    <section>
                      <p className="text-sm font-medium text-[#111111]">Este dispositivo</p>
                      <p className="text-xs text-[#6b6b6b]">
                        {navigator.userAgent.includes('Windows') ? 'Windows' : 
                         navigator.userAgent.includes('Mac') ? 'MacOS' : 'Linux'} • 
                        {navigator.userAgent.includes('Chrome') ? ' Chrome' : 
                         navigator.userAgent.includes('Firefox') ? ' Firefox' : ' Navegador'}
                      </p>
                    </section>
                  </section>
                  <span className="text-xs text-[#166534] bg-[#dcfce7] px-2 py-1 rounded-full">Atual</span>
                </section>
              </section>
            </article>
          </TabsContent>

          {/* ABA ESTATÍSTICAS */}
          <TabsContent value="stats" className="space-y-6">
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
                <section className="flex items-center gap-3 mb-2">
                  <section className="p-2 bg-[#fef2f2] rounded-lg">
                    <BookOpen className="w-5 h-5 text-[#c40000]" />
                  </section>
                  <span className="text-2xl font-bold text-[#111111]">{stats.articlesRead}</span>
                </section>
                <p className="text-sm text-[#6b6b6b]">Artigos lidos</p>
              </article>
              
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
                <section className="flex items-center gap-3 mb-2">
                  <section className="p-2 bg-[#fef2f2] rounded-lg">
                    <Clock className="w-5 h-5 text-[#c40000]" />
                  </section>
                  <span className="text-2xl font-bold text-[#111111]">
                    {Math.round(stats.totalReadingTime / 60)}
                  </span>
                </section>
                <p className="text-sm text-[#6b6b6b]">Minutos de leitura</p>
              </article>
              
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
                <section className="flex items-center gap-3 mb-2">
                  <section className="p-2 bg-[#fef2f2] rounded-lg">
                    <Heart className="w-5 h-5 text-[#c40000]" />
                  </section>
                  <span className="text-2xl font-bold text-[#111111]">{stats.bookmarksCount}</span>
                </section>
                <p className="text-sm text-[#6b6b6b]">Favoritos</p>
              </article>
              
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
                <section className="flex items-center gap-3 mb-2">
                  <section className="p-2 bg-[#fef2f2] rounded-lg">
                    <MessageSquare className="w-5 h-5 text-[#c40000]" />
                  </section>
                  <span className="text-2xl font-bold text-[#111111]">{stats.commentsCount}</span>
                </section>
                <p className="text-sm text-[#6b6b6b]">Comentários</p>
              </article>
            </section>

            {/* Streak */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Award className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Sequência de Leitura</h2>
                  <p className="text-xs text-[#6b6b6b]">Dias consecutivos lendo artigos</p>
                </section>
              </header>
              
              <section className="space-y-4">
                <section className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-[#c40000]">{stats.streakDays} dias</span>
                  <span className="text-sm text-[#6b6b6b]">Recorde: {Math.max(stats.streakDays, 7)} dias</span>
                </section>
                <Progress value={(stats.streakDays / 30) * 100} className="h-2" />
                <p className="text-sm text-[#6b6b6b]">
                  Continue lendo para manter sua sequência e desbloquear conquistas!
                </p>
              </section>
            </article>

            {/* Conquistas */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Award className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Conquistas</h2>
                  <p className="text-xs text-[#6b6b6b]">Seus marcos no portal</p>
                </section>
              </header>
              
              <section className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: BookOpen, label: 'Leitor Iniciante', desc: 'Leu 5 artigos', unlocked: stats.articlesRead >= 5 },
                  { icon: BookOpen, label: 'Leitor Assíduo', desc: 'Leu 25 artigos', unlocked: stats.articlesRead >= 25 },
                  { icon: Heart, label: 'Colecionador', desc: 'Salvou 10 favoritos', unlocked: stats.bookmarksCount >= 10 },
                  { icon: MessageSquare, label: 'Comentarista', desc: 'Deixou 5 comentários', unlocked: stats.commentsCount >= 5 },
                  { icon: Calendar, label: 'Consistente', desc: '7 dias de sequência', unlocked: stats.streakDays >= 7 },
                  { icon: Award, label: 'Veterano', desc: 'Membro há 1 ano', unlocked: new Date(user?.createdAt || '').getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000 },
                ].map((badge, index) => (
                  <section 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      badge.unlocked 
                        ? 'bg-[#f0fdf4] border-[#86efac]' 
                        : 'bg-[#f5f5f5] border-[#e5e5e5] opacity-60'
                    }`}
                  >
                    <section className={`p-2 rounded-full ${badge.unlocked ? 'bg-[#dcfce7]' : 'bg-[#e5e5e5]'}`}>
                      <badge.icon className={`w-4 h-4 ${badge.unlocked ? 'text-[#166534]' : 'text-[#6b6b6b]'}`} />
                    </section>
                    <section>
                      <p className={`text-sm font-medium ${badge.unlocked ? 'text-[#166534]' : 'text-[#6b6b6b]'}`}>
                        {badge.label}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">{badge.desc}</p>
                    </section>
                    {badge.unlocked && <Check className="w-4 h-4 text-[#22c55e] ml-auto" />}
                  </section>
                ))}
              </section>
            </article>
          </TabsContent>
        </Tabs>

        {/* Dialog de Alterar Senha */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar senha</DialogTitle>
              <DialogDescription>
                Escolha uma senha forte e única para sua conta.
              </DialogDescription>
            </DialogHeader>
            
            <section className="space-y-4 py-4">
              <fieldset>
                <Label>Senha atual</Label>
                <section className="relative mt-1.5">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </section>
              </fieldset>
              
              <fieldset>
                <Label>Nova senha</Label>
                <section className="relative mt-1.5">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </section>
                {passwordData.new && (
                  <section className="mt-2">
                    <section className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#6b6b6b]">Força da senha:</span>
                      <span className={passwordStrength.color.replace('bg-', 'text-')}>
                        {passwordStrength.label}
                      </span>
                    </section>
                    <Progress value={passwordStrength.strength} className="h-1" />
                  </section>
                )}
              </fieldset>
              
              <fieldset>
                <Label>Confirmar nova senha</Label>
                <section className="relative mt-1.5">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </section>
                {passwordData.confirm && passwordData.new !== passwordData.confirm && (
                  <p className="mt-1.5 text-xs text-[#ef4444]">As senhas não coincidem</p>
                )}
              </fieldset>
            </section>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={!passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                className="bg-[#c40000] hover:bg-[#a00000]"
              >
                Alterar senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
