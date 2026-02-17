// Supabase Edge Function: admin-authors
// CRUD de autores (tabela `authors`) com checagem de admin via `profiles.role`.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  requireAdmin,
  parseBody,
  validateMethod,
  getAdminClient,
} from "../_shared/auth.ts";

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
  website: row.website ?? null,
  location: row.location ?? null,
  expertise: row.expertise ?? [],
  credentials: row.credentials ?? [],
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validar método
  const methodCheck = validateMethod(req, ["POST"]);
  if (!methodCheck.valid) {
    return methodCheck.response;
  }

  // Verificar autenticação e permissão de admin
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return jsonResponse({ error: auth.message }, auth.status);
  }

  // Parse do body
  const bodyResult = await parseBody(req);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const payload = bodyResult.data;
  const { action } = payload ?? {};
  const admin = getAdminClient();

  try {
    if (action === "list_authors") {
      const { data, error } = await admin
        .from("authors")
        .select("*")
        .order("editor", { ascending: false })
        .order("fact_checker", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return jsonResponse({ authors: (data ?? []).map(mapAuthorRow) });
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
        if (!author?.[k]) return jsonResponse({ error: `${k} é obrigatório` }, 400);
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
        website: author.website ?? null,
        location: author.location ?? null,
        expertise: author.expertise ?? [],
        credentials: author.credentials ?? [],
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
      return jsonResponse({ ok: true, author: mapAuthorRow(data) });
    }

    if (action === "update_author") {
      const slug = payload.slug ?? payload.authorSlug;
      const updates = payload.updates ?? payload.author ?? {};
      if (!slug) return jsonResponse({ error: "slug é obrigatório" }, 400);

      // Prevent changing primary key through update endpoint.
      if (updates.slug && updates.slug !== slug) {
        return jsonResponse({ error: "Não é permitido alterar o slug do autor" }, 400);
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
        website: updates.website,
        location: updates.location,
        expertise: updates.expertise,
        credentials: updates.credentials,
        education: updates.education,
        awards: updates.awards,
        languages: updates.languages,
        joined_at: updates.joinedAt,
        is_active: updates.isActive,
        fact_checker: updates.factChecker,
        editor: updates.editor,
      });

      if (Object.keys(dbUpdates).length === 0) {
        return jsonResponse({ error: "Nenhuma alteração enviada" }, 400);
      }

      const { data, error } = await admin
        .from("authors")
        .update(dbUpdates)
        .eq("slug", slug)
        .select("*")
        .single();
      if (error) throw error;
      return jsonResponse({ ok: true, author: mapAuthorRow(data) });
    }

    if (action === "delete_author") {
      const slug = payload.slug ?? payload.authorSlug;
      if (!slug) return jsonResponse({ error: "slug é obrigatório" }, 400);

      // Soft delete: keep references from articles, just deactivate.
      const { error } = await admin
        .from("authors")
        .update({ is_active: false })
        .eq("slug", slug);
      if (error) throw error;

      return jsonResponse({ ok: true });
    }

    if (action === "restore_author") {
      const slug = payload.slug ?? payload.authorSlug;
      if (!slug) return jsonResponse({ error: "slug é obrigatório" }, 400);

      const { error } = await admin
        .from("authors")
        .update({ is_active: true })
        .eq("slug", slug);
      if (error) throw error;

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (error) {
    return errorResponse(error, 500);
  }
});
