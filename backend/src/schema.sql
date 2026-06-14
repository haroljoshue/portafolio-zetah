-- Drop tables if they exist (clean setup)
DROP TRIGGER IF EXISTS trg_log_profile ON profile CASCADE;
DROP TRIGGER IF EXISTS trg_log_publications ON publications CASCADE;
DROP TRIGGER IF EXISTS trg_log_notices ON notices CASCADE;
DROP TRIGGER IF EXISTS trg_log_videos ON videos CASCADE;
DROP TRIGGER IF EXISTS trg_log_photos ON photos CASCADE;
DROP TRIGGER IF EXISTS trg_log_users ON users CASCADE;
DROP TRIGGER IF EXISTS trg_log_leads ON leads CASCADE;

DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile Table
CREATE TABLE profile (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(150),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  email VARCHAR(100),
  phone VARCHAR(20),
  instagram_url TEXT,
  facebook_url TEXT,
  whatsapp_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  slogan VARCHAR(200) DEFAULT 'Mañana será otro día'
);

-- Publications Table
CREATE TABLE publications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notices Table
CREATE TABLE notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos Table
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  original_url TEXT NOT NULL,
  youtube_id VARCHAR(50) NOT NULL,
  embed_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  description TEXT,
  published_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos Table
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  original_url TEXT NOT NULL,
  drive_id VARCHAR(100) NOT NULL,
  direct_url TEXT NOT NULL,
  description TEXT,
  registered_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads Table (Newsletter Subscribers)
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns Table (Sent Publicity)
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  performed_by VARCHAR(50) DEFAULT 'SYSTEM',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger Function for Audit Logging
CREATE OR REPLACE FUNCTION log_db_changes()
RETURNS TRIGGER AS $$
DECLARE
    rec_id INTEGER;
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    user_name VARCHAR(50) := 'SYSTEM';
BEGIN
    -- Determine Record ID and JSON states
    IF (TG_OP = 'DELETE') THEN
        rec_id := OLD.id;
        old_val := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        rec_id := NEW.id;
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSE
        rec_id := NEW.id;
        new_val := to_jsonb(NEW);
    END IF;

    -- Insert audit log
    INSERT INTO logs (action_type, table_name, record_id, old_data, new_data, performed_by)
    VALUES (TG_OP, TG_TABLE_NAME, rec_id, old_val, new_val, user_name);
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Bind Triggers to All Main Tables
CREATE TRIGGER trg_log_profile AFTER INSERT OR UPDATE OR DELETE ON profile FOR EACH ROW EXECUTE FUNCTION log_db_changes();
CREATE TRIGGER trg_log_publications AFTER INSERT OR UPDATE OR DELETE ON publications FOR EACH ROW EXECUTE FUNCTION log_db_changes();
CREATE TRIGGER trg_log_notices AFTER INSERT OR UPDATE OR DELETE ON notices FOR EACH ROW EXECUTE FUNCTION log_db_changes();
CREATE TRIGGER trg_log_videos AFTER INSERT OR UPDATE OR DELETE ON videos FOR EACH ROW EXECUTE FUNCTION log_db_changes();
CREATE TRIGGER trg_log_photos AFTER INSERT OR UPDATE OR DELETE ON photos FOR EACH ROW EXECUTE FUNCTION log_db_changes();
CREATE TRIGGER trg_log_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_db_changes();
CREATE TRIGGER trg_log_leads AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION log_db_changes();
