-- ============================================================
-- MIGRAÇÃO: Correção de Schema da Tabela Comments
-- Data: 2025-02-08
-- Autor: DBA Specialist
-- ============================================================

-- Verificar e adicionar coluna user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Migrar dados de author_id (se existir) para user_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'author_id'
    ) THEN
      UPDATE comments SET user_id = author_id::UUID WHERE user_id IS NULL AND author_id IS NOT NULL;
    END IF;
    
    -- Tornar user_id obrigatório para novos registros
    ALTER TABLE comments ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Garantir que a coluna author (JSONB) existe para armazenar dados denormalizados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'author'
  ) THEN
    ALTER TABLE comments ADD COLUMN author JSONB DEFAULT '{}';
  END IF;
END $$;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Atualizar políticas RLS para garantir que funcionam com user_id
-- Remover políticas antigas e recriar
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

-- Recriar políticas com a coluna correta (user_id)
CREATE POLICY "Anyone can view comments" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON comments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela comments (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comentários explicativos
COMMENT ON TABLE comments IS 'Tabela de comentários com RLS ativado';
COMMENT ON COLUMN comments.user_id IS 'Referência ao usuário autenticado (UUID do auth.users)';
COMMENT ON COLUMN comments.author IS 'Dados denormalizados do autor (nome, avatar) para exibição rápida';
