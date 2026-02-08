'use client';

/**
 * Trabalhe Conosco (client)
 * Mantido como client por causa de estado e envio do formulario.
 */

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createJobApplication } from '@/services/contactService';
import { toast } from 'sonner';

const COVER_MIN = 60;

export default function TrabalheConoscoPageClient() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    role: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    coverLetter: '',
  });

  const isValid = useMemo(() => {
    return (
      form.name.trim().length >= 2 &&
      form.email.trim().length >= 5 &&
      form.role.trim().length >= 2 &&
      form.coverLetter.trim().length >= COVER_MIN
    );
  }, [form]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await createJobApplication({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role.trim(),
        location: form.location.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
        resumeUrl: form.resumeUrl.trim() || null,
        coverLetter: form.coverLetter.trim(),
        userId: user?.id ?? null,
      });
      toast.success('Candidatura enviada. Obrigado por se inscrever.');
      setForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: '',
        role: '',
        location: '',
        linkedinUrl: '',
        portfolioUrl: '',
        resumeUrl: '',
        coverLetter: '',
      });
    } catch (error) {
      toast.error('Não foi possível enviar. Verifique a configuração do banco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-8 sm:py-10 lg:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">Carreiras</p>
        <h1 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2">Trabalhe Conosco</h1>
        <p className="text-sm text-[#6b6b6b] mt-3 max-w-2xl">
          Quer fazer parte do PEM? Conte sobre você e envie links para portfolio ou curriculo.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#e5e5e5] rounded-2xl p-5 sm:p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]"
        >
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset>
              <Label htmlFor="career-name">Nome</Label>
              <Input
                id="career-name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </fieldset>
            <fieldset>
              <Label htmlFor="career-email">Email</Label>
              <Input
                id="career-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="voce@email.com"
                required
              />
            </fieldset>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <fieldset>
              <Label htmlFor="career-phone">Telefone</Label>
              <Input
                id="career-phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </fieldset>
            <fieldset>
              <Label htmlFor="career-role">Area ou cargo desejado</Label>
              <Input
                id="career-role"
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                placeholder="Ex: Jornalismo, Data, Produto"
                required
              />
            </fieldset>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <fieldset>
              <Label htmlFor="career-location">Localizacao</Label>
              <Input
                id="career-location"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Cidade/Estado"
              />
            </fieldset>
            <fieldset>
              <Label htmlFor="career-linkedin">LinkedIn</Label>
              <Input
                id="career-linkedin"
                value={form.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </fieldset>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <fieldset>
              <Label htmlFor="career-portfolio">Portfolio</Label>
              <Input
                id="career-portfolio"
                value={form.portfolioUrl}
                onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                placeholder="https://seu-portfolio.com"
              />
            </fieldset>
            <fieldset>
              <Label htmlFor="career-resume">Curriculo (URL)</Label>
              <Input
                id="career-resume"
                value={form.resumeUrl}
                onChange={(e) => handleChange('resumeUrl', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </fieldset>
          </section>

          <fieldset className="mt-4">
            <Label htmlFor="career-cover">Conte sobre voce</Label>
            <Textarea
              id="career-cover"
              value={form.coverLetter}
              onChange={(e) => handleChange('coverLetter', e.target.value)}
              placeholder="Experiencia, motivacao, habilidades e links relevantes."
              rows={6}
              required
            />
            <p className="text-xs text-[#6b6b6b] mt-1">Mínimo {COVER_MIN} caracteres.</p>
          </fieldset>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-[#6b6b6b]">Ao enviar, você concorda com nossa política de privacidade.</p>
            <Button
              type="submit"
              className="bg-[#111111] hover:bg-[#000000]"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar candidatura'}
            </Button>
          </div>
        </form>

        <aside className="bg-[#0f172a] text-white rounded-2xl p-5 sm:p-7 h-fit">
          <h2 className="text-lg font-bold">O que buscamos</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="border-b border-white/10 pb-2">Curiosidade e leitura diaria de noticias</li>
            <li className="border-b border-white/10 pb-2">Escrita clara e objetiva</li>
            <li className="border-b border-white/10 pb-2">Capacidade de trabalhar com dados</li>
            <li>Compromisso com prazos e qualidade</li>
          </ul>
          <div className="mt-6 rounded-lg border border-white/10 p-4 text-xs text-white/70">
            Pode enviar links publicos. Arquivos devem ser links externos.
          </div>
        </aside>
      </section>
    </section>
  );
}

