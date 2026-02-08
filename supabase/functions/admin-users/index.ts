// Supabase Edge Function: admin-users
// Operações administrativas de usuários (criar, atualizar, senha, listar)

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
  const { action } = payload;
  const admin = getAdminClient();

  try {
    if (action === "list_users") {
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error) throw error;

      const users = data?.users ?? [];
      const ids = users.map((u) => u.id);
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, name, role, avatar")
        .in("id", ids);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p]),
      );

      const mapped = users.map((u) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          name: p?.name ?? u.user_metadata?.name ?? u.email ?? "Usuário",
          role: p?.role ?? "user",
          createdAt: u.created_at,
          lastLogin: u.last_sign_in_at ?? u.created_at,
          isActive: !u.banned_until,
          region: null,
          bio: null,
          profession: null,
          company: null,
        };
      });

      return jsonResponse({ users: mapped });
    }

    if (action === "create_user") {
      const { email, password, name, role } = payload;
      if (!email || !password) {
        return jsonResponse({ error: "Email e senha são obrigatórios" }, 400);
      }

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        await admin
          .from("profiles")
          .upsert({ id: userId, name, role: role ?? "user" }, { onConflict: "id" });
      }

      return jsonResponse({ ok: true, userId });
    }

    if (action === "update_user") {
      const { userId, email, name, role } = payload;
      if (!userId) return jsonResponse({ error: "userId é obrigatório" }, 400);

      if (email) {
        const { error } = await admin.auth.admin.updateUserById(userId, { email });
        if (error) throw error;
      }

      await admin
        .from("profiles")
        .upsert({ id: userId, name, role }, { onConflict: "id" });

      return jsonResponse({ ok: true });
    }

    if (action === "update_password") {
      const { userId, password } = payload;
      if (!userId || !password) {
        return jsonResponse({ error: "userId e senha são obrigatórios" }, 400);
      }

      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
      });
      if (error) throw error;

      return jsonResponse({ ok: true });
    }

    if (action === "delete_user") {
      const { userId } = payload;
      if (!userId) return jsonResponse({ error: "userId é obrigatório" }, 400);

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (error) {
    return errorResponse(error, 500);
  }
});
