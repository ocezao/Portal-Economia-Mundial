'use client';

/**
 * Página Fale Conosco (client)
 * Mantida como client por causa de estado e envio do formulario.
 */

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createContactMessage } from '@/services/contactService';
import { toast } from 'sonner';

const SUBJECT_MIN = 4;
const MESSAGE_MIN = 20;

export default function FaleConoscoPageClient() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    subject: '',
    category: 'duvida',
    message: '',
  });

  const isValid = useMemo(() => {
    return (
      form.name.trim().length >= 2 &&
      form.email.trim().length >= 5 &&
      form.subject.trim().length >= SUBJECT_MIN &&
      form.message.trim().length >= MESSAGE_MIN
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
      await createContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim(),
        category: form.category as 'duvida' | 'parceria' | 'suporte' | 'outro',
        message: form.message.trim(),
        userId: user?.id ?? null,
      });
      toast.success('Mensagem enviada. Responderemos em breve.');
      setForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: '',
        subject: '',
        category: 'duvida',
        message: '',
      });
    } catch {
      toast.error('Não foi possível enviar. Verifique a configuração do banco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-8 sm:py-10 lg:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">Contato</p>
        <h1 className="text-3xl sm:text-4xl font-black text-[#111111] mt-2">Fale Conosco</h1>
        <p className="text-sm text-[#6b6b6b] mt-3 max-w-2xl">
          Envie dúvidas, sugestões ou parcerias. Nosso time responde o mais rápido possível.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#e5e5e5] rounded-2xl p-5 sm:p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]"
        >
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset>
              <Label htmlFor="contact-name">Nome</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </fieldset>
            <fieldset>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
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
              <Label htmlFor="contact-phone">Telefone (opcional)</Label>
              <Input
                id="contact-phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </fieldset>
            <fieldset>
              <Label htmlFor="contact-category">Categoria</Label>
              <select
                id="contact-category"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm bg-white"
              >
                <option value="duvida">Dúvida</option>
                <option value="suporte">Suporte</option>
                <option value="parceria">Parceria</option>
                <option value="outro">Outro</option>
              </select>
            </fieldset>
          </section>

          <fieldset className="mt-4">
            <Label htmlFor="contact-subject">Assunto</Label>
            <Input
              id="contact-subject"
              value={form.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Ex: Sugestão de pauta"
              required
            />
          </fieldset>

          <fieldset className="mt-4">
            <Label htmlFor="contact-message">Mensagem</Label>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Explique o motivo do contato com detalhes."
              rows={6}
              required
            />
            <p className="text-xs text-[#6b6b6b] mt-1">Mínimo {MESSAGE_MIN} caracteres.</p>
          </fieldset>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-[#6b6b6b]">Ao enviar, você concorda com nossa política de privacidade.</p>
            <Button
              type="submit"
              className="bg-[#c40000] hover:bg-[#a00000]"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
            </Button>
          </div>
        </form>

        <aside className="bg-[#111111] text-white rounded-2xl p-5 sm:p-7 h-fit">
          <h2 className="text-lg font-bold">Atendimento</h2>
          <p className="text-sm text-white/70 mt-2">
            Atendimento em dias úteis, 9h às 18h. Resposta média em até 1 dia útil.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-white/60">Email</span>
              <span>contato@portaleconomicomundial.com</span>
            </p>
            <p className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-white/60">Telefone</span>
              <span>+55 11 3000-0000</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-white/60">Resposta</span>
              <span>até 1 dia útil</span>
            </p>
          </div>
        </aside>
      </section>
    </section>
  );
}

