// Supabase Edge Function: admin-authors
// CRUD de autores (tabela `authors`) com checagem de admin via `profiles.role`.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const getAuthUser = async (req: Request) => {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
};

const requireAdmin = async (req: Request) => {
  const user = await getAuthUser(req);
  if (!user) return { ok: false, status: 401, message: "Não autenticado" };

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { ok: false, status: 403, message: "Sem permissão" };
  }

  return { ok: true, user };
};

const mapAuthorRow = (row: any) => ({
  slug: row.slug,
  name: row.name,
  shortName: row.short_name,
  title: row.title,
  bio: row.bio,
  longBio: row.long_bio,
  photo: row.photo,
  email: row.email,
  social: row.social ?? {},
  expertise: row.expertise ?? [],
  education: row.education ?? [],
  awards: row.awards ?? [],
  languages: row.languages ?? [],
  joinedAt: row.joined_at ?? null,
  isActive: row.is_active ?? true,
  factChecker: row.fact_checker ?? false,
  editor: row.editor ?? false,
});

const pickDefined = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return json({ error: auth.message }, auth.status);

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { action } = payload ?? {};

  try {
    if (action === "list_authors") {
      const { data, error } = await admin
        .from("authors")
        .select("*")
        .order("editor", { ascending: false })
        .order("fact_checker", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return json({ authors: (data ?? []).map(mapAuthorRow) });
    }

    if (action === "create_author") {
      const author = payload.author ?? payload;

      const required = [
        "slug",
        "name",
        "shortName",
        "title",
        "bio",
        "longBio",
        "photo",
        "email",
      ];
      for (const k of required) {
        if (!author?.[k]) return json({ error: `${k} é obrigatório` }, 400);
      }

      const insertRow = {
        slug: author.slug,
        name: author.name,
        short_name: author.shortName,
        title: author.title,
        bio: author.bio,
        long_bio: author.longBio,
        photo: author.photo,
        email: author.email,
        social: author.social ?? {},
        expertise: author.expertise ?? [],
        education: author.education ?? [],
        awards: author.awards ?? [],
        languages: author.languages ?? [],
        joined_at: author.joinedAt ?? null,
        is_active: author.isActive ?? true,
        fact_checker: author.factChecker ?? false,
        editor: author.editor ?? false,
      };

      const { data, error } = await admin
        .from("authors")
        .insert(insertRow)
        .select("*")
        .single();
      if (error) throw error;
      return json({ ok: true, author: mapAuthorRow(data) });
    }

    if (action === "update_author") {
      const slug = payload.slug ?? payload.authorSlug;
      const updates = payload.updates ?? payload.author ?? {};
      if (!slug) return json({ error: "slug é obrigatório" }, 400);

      // Prevent changing primary key through update endpoint.
      if (updates.slug && updates.slug !== slug) {
        return json({ error: "Não é permitido alterar o slug do autor" }, 400);
      }

      const dbUpdates = pickDefined({
        name: updates.name,
        short_name: updates.shortName,
        title: updates.title,
        bio: updates.bio,
        long_bio: updates.longBio,
        photo: updates.photo,
        email: updates.email,
        social: updates.social,
        expertise: updates.expertise,
        education: updates.education,
        awards: updates.awards,
        languages: updates.languages,
        joined_at: updates.joinedAt,
        is_active: updates.isActive,
        fact_checker: updates.factChecker,
        editor: updates.editor,
      });

      if (Object.keys(dbUpdates).length === 0) {
        return json({ error: "Nenhuma alteração enviada" }, 400);
      }

      const { data, error } = await admin
        .from("authors")
        .update(dbUpdates)
        .eq("slug", slug)
        .select("*")
        .single();
      if (error) throw error;
      return json({ ok: true, author: mapAuthorRow(data) });
    }

    if (action === "delete_author") {
      const slug = payload.slug ?? payload.authorSlug;
      if (!slug) return json({ error: "slug é obrigatório" }, 400);

      // Soft delete: keep references from articles, just deactivate.
      const { error } = await admin
        .from("authors")
        .update({ is_active: false })
        .eq("slug", slug);
      if (error) throw error;

      return json({ ok: true });
    }

    if (action === "restore_author") {
      const slug = payload.slug ?? payload.authorSlug;
      if (!slug) return json({ error: "slug é obrigatório" }, 400);

      const { error } = await admin
        .from("authors")
        .update({ is_active: true })
        .eq("slug", slug);
      if (error) throw error;

      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    return json({ error: String((error as any)?.message ?? error) }, 500);
  }
});

