-- ============================================================
-- MIGRAÇÃO: Políticas RLS para Tabela Comments
-- Data: 2025-02-08
-- Autor: DBA Specialist
-- ============================================================

-- Habilitar RLS na tabela comments (caso não esteja habilitado)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos (idempotente)
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

-- Política para SELECT: Qualquer um pode visualizar comentários
CREATE POLICY "Anyone can view comments" 
  ON comments FOR SELECT 
  USING (true);

-- Política para INSERT: Usuários autenticados podem criar
CREATE POLICY "Authenticated users can create comments" 
  ON comments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE: Usuários só podem atualizar seus próprios comentários
-- Verifica se user_id na tabela corresponde ao usuário autenticado
CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: Usuários só podem deletar seus próprios comentários
-- Admins podem deletar qualquer comentário (verificado via profiles.role)
CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Comentários explicativos
COMMENT ON POLICY "Anyone can view comments" ON comments IS 'Permite visualização pública de comentários';
COMMENT ON POLICY "Authenticated users can create comments" ON comments IS 'Apenas usuários autenticados podem criar comentários';
COMMENT ON POLICY "Users can update own comments" ON comments IS 'Proteção RLS: usuário só edita próprio comentário';
COMMENT ON POLICY "Users can delete own comments" ON comments IS 'Proteção RLS: usuário só deleta próprio comentário (admin pode deletar qualquer um)';

