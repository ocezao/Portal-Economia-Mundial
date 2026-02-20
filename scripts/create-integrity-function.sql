-- Create integrity check function
CREATE OR REPLACE FUNCTION check_database_integrity()
RETURNS TABLE (
    check_name TEXT,
    check_status TEXT,
    details TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check 1: Total articles
    RETURN QUERY
    SELECT 
        'Total articles'::TEXT AS check_name,
        'INFO'::TEXT AS check_status,
        (SELECT COUNT(*)::TEXT || ' articles in database' FROM news_articles) AS details;

    -- Check 2: Total users
    RETURN QUERY
    SELECT 
        'Total users'::TEXT AS check_name,
        'INFO'::TEXT AS check_status,
        (SELECT COUNT(*)::TEXT || ' users in database' FROM auth.users) AS details;

    -- Check 3: Total categories
    RETURN QUERY
    SELECT 
        'Total categories'::TEXT AS check_name,
        'INFO'::TEXT AS check_status,
        (SELECT COUNT(*)::TEXT || ' categories in database' FROM categories) AS details;

    -- Check 4: Database size
    RETURN QUERY
    SELECT 
        'Database size'::TEXT AS check_name,
        'INFO'::TEXT AS check_status,
        pg_size_pretty(pg_database_size('portal')) AS details;
END;
$$;

GRANT EXECUTE ON FUNCTION check_database_integrity() TO portal_user;
