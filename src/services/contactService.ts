import { supabase } from '@/lib/supabaseClient';

export type ContactMessageInput = {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  category: 'duvida' | 'parceria' | 'suporte' | 'outro';
  message: string;
  userId?: string | null;
};

export type JobApplicationInput = {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  coverLetter: string;
  userId?: string | null;
};

export async function createContactMessage(input: ContactMessageInput) {
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    subject: input.subject,
    category: input.category,
    message: input.message,
    user_id: input.userId ?? null,
  });

  if (error) throw error;
}

export async function createJobApplication(input: JobApplicationInput) {
  const { error } = await supabase.from('career_applications').insert({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    role: input.role,
    location: input.location ?? null,
    linkedin_url: input.linkedinUrl ?? null,
    portfolio_url: input.portfolioUrl ?? null,
    resume_url: input.resumeUrl ?? null,
    cover_letter: input.coverLetter,
    user_id: input.userId ?? null,
  });

  if (error) throw error;
}
