-- Migration: FlowPost - Adicionar suporte a Mastodon

-- 1. Tabela de posts (já existe, adicionar colunas)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Remover check antigo se existir e adicionar novo com 'failed'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

-- 2. Tabela de perfis de usuário
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Tabela de contas sociais conectadas
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  platform_username TEXT,
  platform_account_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);

-- 4. RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem seus próprios posts" ON posts;
CREATE POLICY "Usuários veem seus próprios posts"
  ON posts FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários criam seus próprios posts" ON posts;
CREATE POLICY "Usuários criam seus próprios posts"
  ON posts FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários editam seus próprios posts" ON posts;
CREATE POLICY "Usuários editam seus próprios posts"
  ON posts FOR UPDATE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários deletam seus próprios posts" ON posts;
CREATE POLICY "Usuários deletam seus próprios posts"
  ON posts FOR DELETE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários veem seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários veem seu próprio perfil"
  ON user_profiles FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários editam seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários editam seu próprio perfil"
  ON user_profiles FOR UPDATE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários criam seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários criam seu próprio perfil"
  ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários veem suas próprias contas" ON social_accounts;
CREATE POLICY "Usuários veem suas próprias contas"
  ON social_accounts FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários gerenciam suas próprias contas" ON social_accounts;
CREATE POLICY "Usuários gerenciam suas próprias contas"
  ON social_accounts FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários atualizam suas próprias contas" ON social_accounts;
CREATE POLICY "Usuários atualizam suas próprias contas"
  ON social_accounts FOR UPDATE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários deletam suas próprias contas" ON social_accounts;
CREATE POLICY "Usuários deletam suas próprias contas"
  ON social_accounts FOR DELETE USING (user_id = auth.uid()::text);

-- 5. Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url, plan_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 6. Função: buscar posts para publicar
CREATE OR REPLACE FUNCTION get_posts_to_publish()
RETURNS TABLE (
  id BIGINT,
  user_id TEXT,
  content TEXT,
  media_urls TEXT[],
  networks TEXT[],
  hashtags JSONB,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.media_urls,
    p.networks,
    p.hashtags,
    p.scheduled_date AS scheduled_at,
    p.created_at
  FROM posts p
  WHERE p.status = 'scheduled'
    AND p.scheduled_date IS NOT NULL
    AND p.scheduled_date <= NOW()
    AND p.scheduled_date >= NOW() - INTERVAL '30 minutes'
  ORDER BY p.scheduled_date ASC
  LIMIT 10;
END;
$$;

-- 7. Função: atualizar status do post após publicação
CREATE OR REPLACE FUNCTION update_post_status(
  p_post_id BIGINT,
  p_status TEXT,
  p_url TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET
    status = p_status,
    post_url = COALESCE(p_url, post_url),
    error_message = CASE WHEN p_error IS NOT NULL THEN p_error ELSE error_message END,
    published_at = CASE WHEN p_status = 'published' THEN NOW() ELSE published_at END,
    updated_at = NOW()
  WHERE id = p_post_id;
END;
$$;

-- 8. Função: obter token de acesso de plataforma
CREATE OR REPLACE FUNCTION get_platform_token(
  p_user_id TEXT,
  p_platform TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  SELECT access_token INTO v_token
  FROM social_accounts
  WHERE user_id = p_user_id
    AND platform = p_platform
  LIMIT 1;
  RETURN v_token;
END;
$$;

-- 9. Trigger para updated_at em social_accounts
DROP TRIGGER IF EXISTS set_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER set_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
