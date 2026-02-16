import { html } from '@/lib/server/email';

type ContactCategory = 'duvida' | 'parceria' | 'suporte' | 'outro';

const categoryLabel: Record<ContactCategory, string> = {
  duvida: 'Duvida',
  parceria: 'Parceria',
  suporte: 'Suporte',
  outro: 'Outro',
};

function wrap(title: string, body: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
    <h2 style="margin:0 0 16px;">${title}</h2>
    ${body}
    <p style="margin-top:24px;color:#666;font-size:12px;">Cenario Internacional</p>
  </div>
  `;
}

export function contactAckTemplate(name: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Recebemos sua mensagem',
    html: wrap(
      'Mensagem recebida',
      `<p>Ola ${html.esc(name)},</p><p>Recebemos seu contato e retornaremos em ate 1 dia util.</p>`,
    ),
    text: `Ola ${name}, recebemos sua mensagem e retornaremos em ate 1 dia util.`,
  };
}

export function contactInternalTemplate(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  category: ContactCategory;
  message: string;
}): { subject: string; html: string; text: string } {
  const cat = categoryLabel[input.category];
  return {
    subject: `[Contato] ${input.subject}`,
    html: wrap(
      'Novo contato recebido',
      `
      <p><strong>Nome:</strong> ${html.esc(input.name)}</p>
      <p><strong>Email:</strong> ${html.esc(input.email)}</p>
      <p><strong>Telefone:</strong> ${html.esc(input.phone || '-')}</p>
      <p><strong>Categoria:</strong> ${html.esc(cat)}</p>
      <p><strong>Assunto:</strong> ${html.esc(input.subject)}</p>
      <p><strong>Mensagem:</strong><br/>${html.esc(input.message).replaceAll('\n', '<br/>')}</p>
      `,
    ),
    text: [
      'Novo contato recebido',
      `Nome: ${input.name}`,
      `Email: ${input.email}`,
      `Telefone: ${input.phone || '-'}`,
      `Categoria: ${cat}`,
      `Assunto: ${input.subject}`,
      `Mensagem: ${input.message}`,
    ].join('\n'),
  };
}

export function careerAckTemplate(name: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Recebemos sua candidatura',
    html: wrap(
      'Candidatura recebida',
      `<p>Ola ${html.esc(name)},</p><p>Recebemos sua candidatura e nosso time analisara seu perfil.</p>`,
    ),
    text: `Ola ${name}, recebemos sua candidatura e nosso time analisara seu perfil.`,
  };
}

export function careerInternalTemplate(input: {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  coverLetter: string;
}): { subject: string; html: string; text: string } {
  return {
    subject: `[Carreiras] ${input.role} - ${input.name}`,
    html: wrap(
      'Nova candidatura recebida',
      `
      <p><strong>Nome:</strong> ${html.esc(input.name)}</p>
      <p><strong>Email:</strong> ${html.esc(input.email)}</p>
      <p><strong>Telefone:</strong> ${html.esc(input.phone || '-')}</p>
      <p><strong>Cargo/Area:</strong> ${html.esc(input.role)}</p>
      <p><strong>Localizacao:</strong> ${html.esc(input.location || '-')}</p>
      <p><strong>LinkedIn:</strong> ${html.esc(input.linkedinUrl || '-')}</p>
      <p><strong>Portfolio:</strong> ${html.esc(input.portfolioUrl || '-')}</p>
      <p><strong>Curriculo:</strong> ${html.esc(input.resumeUrl || '-')}</p>
      <p><strong>Apresentacao:</strong><br/>${html.esc(input.coverLetter).replaceAll('\n', '<br/>')}</p>
      `,
    ),
    text: [
      'Nova candidatura recebida',
      `Nome: ${input.name}`,
      `Email: ${input.email}`,
      `Telefone: ${input.phone || '-'}`,
      `Cargo/Area: ${input.role}`,
      `Localizacao: ${input.location || '-'}`,
      `LinkedIn: ${input.linkedinUrl || '-'}`,
      `Portfolio: ${input.portfolioUrl || '-'}`,
      `Curriculo: ${input.resumeUrl || '-'}`,
      `Apresentacao: ${input.coverLetter}`,
    ].join('\n'),
  };
}

export function accountCreatedTemplate(name: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Sua conta foi criada no Cenario Internacional',
    html: wrap(
      'Conta criada',
      `<p>Ola ${html.esc(name)},</p><p>Sua conta foi criada com sucesso no Cenario Internacional.</p>`,
    ),
    text: `Ola ${name}, sua conta foi criada com sucesso no Cenario Internacional.`,
  };
}

export function accountEmailUpdatedTemplate(name: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Seu email de conta foi atualizado',
    html: wrap(
      'Email atualizado',
      `<p>Ola ${html.esc(name)},</p><p>Detectamos uma alteracao de email na sua conta.</p>`,
    ),
    text: `Ola ${name}, detectamos uma alteracao de email na sua conta.`,
  };
}

export function accountPasswordUpdatedTemplate(name: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Sua senha foi alterada',
    html: wrap(
      'Senha alterada',
      `<p>Ola ${html.esc(name)},</p><p>Detectamos uma alteracao de senha na sua conta.</p>`,
    ),
    text: `Ola ${name}, detectamos uma alteracao de senha na sua conta.`,
  };
}
