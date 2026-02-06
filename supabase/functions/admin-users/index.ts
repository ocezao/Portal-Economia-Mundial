// Supabase Edge Function: admin-users
// Operações administrativas de usuários (criar, atualizar, senha, listar)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const { action } = payload;

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

      return json({ users: mapped });
    }

    if (action === "create_user") {
      const { email, password, name, role } = payload;
      if (!email || !password) {
        return json({ error: "Email e senha são obrigatórios" }, 400);
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

      return json({ ok: true, userId });
    }

    if (action === "update_user") {
      const { userId, email, name, role } = payload;
      if (!userId) return json({ error: "userId é obrigatório" }, 400);

      if (email) {
        const { error } = await admin.auth.admin.updateUserById(userId, { email });
        if (error) throw error;
      }

      await admin
        .from("profiles")
        .upsert({ id: userId, name, role }, { onConflict: "id" });

      return json({ ok: true });
    }

    if (action === "update_password") {
      const { userId, password } = payload;
      if (!userId || !password) {
        return json({ error: "userId e senha são obrigatórios" }, 400);
      }

      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
      });
      if (error) throw error;

      return json({ ok: true });
    }

    if (action === "delete_user") {
      const { userId } = payload;
      if (!userId) return json({ error: "userId é obrigatório" }, 400);

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    return json({ error: String(error?.message ?? error) }, 500);
  }
});
