CREATE TRIGGER trigger_insert_auth_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION insert_auth_user_to_public();


