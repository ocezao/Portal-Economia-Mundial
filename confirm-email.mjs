import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load `.env` first (real secrets), then `.env.scripts` (aliases/overrides for scripts).
config({ path: join(__dirname, '.env') });
config({ path: join(__dirname, '.env.scripts'), override: true });

function resolveEnvTemplate(value) {
  if (typeof value !== 'string' || value.length === 0) return value;
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key) => process.env[key] ?? '');
}

// Resolve `${VAR}` placeholders from `.env.scripts` using values loaded from `.env`.
for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_DEFAULT_PASSWORD']) {
  if (process.env[k]) process.env[k] = resolveEnvTemplate(process.env[k]);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

// Allow seeding a dedicated test admin without editing the script.
// Keep passwords out of docs/commits: set them only via `.env.scripts` or env vars.
const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@cenariointernacional.com.br';
const seedPassword = process.env.ADMIN_SEED_PASSWORD || adminPassword;
const seedName = process.env.ADMIN_SEED_NAME || 'Administrador CIN';

if (!supabaseUrl) {
  console.error('❌ ERRO: SUPABASE_URL não configurada');
  console.error('Crie um arquivo .env.scripts na pasta raiz com as variáveis necessárias');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.error('Crie um arquivo .env.scripts na pasta raiz com as variáveis necessárias');
  process.exit(1);
}

if (!seedPassword) {
  console.error('❌ ERRO: senha do admin não configurada');
  console.error('Defina ADMIN_SEED_PASSWORD (recomendado) ou ADMIN_DEFAULT_PASSWORD em .env.scripts');
  console.error('Crie um arquivo .env.scripts na pasta raiz com as variáveis necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function confirmEmail() {
  try {
    // Listar usuários
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      if (String(listError?.message || '').toLowerCase().includes('invalid api key') || listError?.status === 401) {
        console.error(
          'Dica: verifique se SUPABASE_SERVICE_ROLE_KEY em .env.scripts é a Service Role Key (não a anon key) e se SUPABASE_URL está correto.'
        );
        // Non-sensitive diagnostics to spot mismatched envs without printing secrets.
        console.error('[diag] SUPABASE_URL ok:', Boolean(supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('supabase.co')));
        console.error('[diag] SUPABASE_SERVICE_ROLE_KEY looks jwt:', Boolean(serviceRoleKey && serviceRoleKey.startsWith('eyJ')));
        console.error('[diag] SUPABASE_SERVICE_ROLE_KEY length:', serviceRoleKey ? serviceRoleKey.length : 0);
      }
      return;
    }
    
    console.log('Usuários encontrados:', users.users.length);
    
    const user = users.users.find((u) => u.email === seedEmail);
    
    if (!user) {
      console.log(`Usuário ${seedEmail} não encontrado. Criando...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: seedEmail,
        password: seedPassword,
        email_confirm: true,
        user_metadata: { role: 'admin', name: seedName },
      });
      
      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return;
      }
      
      console.log('Usuário criado:', newUser.user.id);
      
      // Atualizar perfil para admin
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: newUser.user.id, name: seedName, role: 'admin' },
          { onConflict: 'id' },
        );
        
      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
      } else {
        console.log('Perfil atualizado para admin');
      }
    } else {
      console.log('Usuário encontrado:', user.id);
      console.log('Email confirmado:', user.email_confirmed_at ? 'Sim' : 'Não');
      
      if (!user.email_confirmed_at) {
        // Atualizar usuário para confirmar email
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error('Erro ao confirmar email:', updateError);
        } else {
          console.log('Email confirmado com sucesso!');
        }
      }

      // Garantir metadata (role/name) no Auth
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata || {}), role: 'admin', name: seedName },
      });
      
      // Garantir que o perfil é admin
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, name: seedName, role: 'admin' },
          { onConflict: 'id' },
        );
        
      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
      } else {
        console.log('Perfil garantido como admin');
      }
    }
    
    console.log('✅ Processo concluído!');
  } catch (err) {
    console.error('Erro:', err);
  }
}

confirmEmail();
