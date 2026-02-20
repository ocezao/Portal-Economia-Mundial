-- Create auth.uid() function
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- Also create auth.jwt() function if needed
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE SQL
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.uid() TO portal_user;
GRANT EXECUTE ON FUNCTION auth.jwt() TO portal_user;
