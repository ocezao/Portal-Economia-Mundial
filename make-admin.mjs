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

for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (process.env[k]) process.env[k] = resolveEnvTemplate(process.env[k]);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@cenariointernacional.com.br';
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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function makeAdmin() {
  try {
    // Listar usuários
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      if (String(listError?.message || '').toLowerCase().includes('invalid api key') || listError?.status === 401) {
        console.error(
          'Dica: verifique se SUPABASE_SERVICE_ROLE_KEY em .env.scripts é a Service Role Key (não a anon key) e se SUPABASE_URL está correto.'
        );
      }
      return;
    }
    
    const user = users.users.find((u) => u.email === seedEmail);
    
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }
    
    console.log('Usuário encontrado:', user.id);
    console.log('Role atual:', user.user_metadata?.role);
    
    // Atualizar metadata do usuário para admin
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        user_metadata: { 
          ...user.user_metadata,
          role: 'admin',
          name: seedName,
        }
      }
    );
    
    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
      return;
    }
    
    console.log('✅ Usuário atualizado para admin com sucesso!');
    console.log('Nova role:', updatedUser.user.user_metadata?.role);
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

makeAdmin();
