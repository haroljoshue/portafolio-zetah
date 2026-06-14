import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function initDb() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:Harol2005@localhost:5432/zetah_cop_db';
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';

  console.log('Starting database initialization...');

  // 1. Parse database URL to connect to the default 'postgres' database first
  // to ensure we can create 'zetah_cop_db' if it doesn't exist.
  const urlParts = new URL(dbUrl);
  const targetDb = urlParts.pathname.substring(1); // 'zetah_cop_db'
  
  // Create URL for system 'postgres' database
  urlParts.pathname = '/postgres';
  const sysDbUrl = urlParts.toString();

  console.log(`Connecting to system database to verify/create '${targetDb}'...`);
  const sysClient = new Client({ connectionString: sysDbUrl });
  
  try {
    await sysClient.connect();
    
    // Check if the target database exists
    const checkDbRes = await sysClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`Database '${targetDb}' does not exist. Creating...`);
      // CREATE DATABASE cannot run inside a transaction blocks, and Client handles this
      await sysClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database '${targetDb}' created successfully!`);
    } else {
      console.log(`Database '${targetDb}' already exists.`);
    }
  } catch (err: any) {
    console.error('Error verifying/creating database:', err.message);
    process.exit(1);
  } finally {
    await sysClient.end();
  }

  // 2. Connect to the target database and execute the schema
  console.log(`Connecting to target database '${targetDb}' to run schema...`);
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await client.query(schemaSql);
    console.log('Schema executed successfully!');

    // 3. Insert default administrator
    const passwordHash = await bcrypt.hash(adminPass, 10);
    console.log(`Inserting default admin user: '${adminUser}'...`);
    await client.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [adminUser, passwordHash]
    );
    console.log('Admin user seed completed!');

    // 4. Insert default profile
    console.log('Inserting initial profile data for Harol Joshue (ZetaH)...');
    const bioText = 'Mi nombre es Harol Joshue, conocido artísticamente como ZetaH. Soy de Ibarra, Ecuador. Apasionado por la música y el mundo visual: cine, fotografía y edición. Aprendiz de manera autónoma, siempre explorando nuevas ideas.';
    
    await client.query(
      `INSERT INTO profile (id, name, title, bio, avatar_url, cover_url, email, phone, instagram_url, facebook_url, whatsapp_url, slogan) 
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         title = EXCLUDED.title,
         bio = EXCLUDED.bio,
         avatar_url = EXCLUDED.avatar_url,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         instagram_url = EXCLUDED.instagram_url,
         facebook_url = EXCLUDED.facebook_url,
         whatsapp_url = EXCLUDED.whatsapp_url,
         slogan = EXCLUDED.slogan`,
      [
        'Harol Joshue',
        'Ingeniero de Software y Productor Audiovisual',
        bioText,
        'recursos/zetah-2026.jpg',
        '',
        'harolzambrano2005@gmail.com',
        '+593 99 232 3613',
        'https://www.instagram.com/joshueharol/',
        'https://www.facebook.com/Zambrano2005',
        'https://w.app/l469ab',
        'Mañana será otro día'
      ]
    );
    console.log('Profile data seeded successfully!');

    // 5. Seed initial notices, publications, videos and photos for demo
    console.log('Seeding initial demo contents...');
    
    // Seed initial notice
    await client.query(
      `INSERT INTO notices (title, content, is_active) VALUES ($1, $2, $3)`,
      ['¡Bienvenidos a mi nuevo portafolio!', 'Hola a todos, he lanzado este nuevo espacio para compartir mis producciones de video, trabajos de fotografía y proyectos de software. ¡Siéntete libre de contactarme!', true]
    );

    // Seed initial publication
    await client.query(
      `INSERT INTO publications (title, content, image_url) VALUES ($1, $2, $3)`,
      [
        'Mi trayectoria en el mundo audiovisual',
        'Comencé como creador autodidacta editando videos cortos y tomando fotos en mi natal Ibarra. Con el paso del tiempo he perfeccionado mis técnicas de iluminación, encuadre y postproducción, integrándolas con mis estudios de Ingeniería de Software para crear soluciones técnicas creativas.',
        'recursos/harol.png'
      ]
    );

    // Cargar videos y fotos reales desde zetah-gallery/recursos/datos.json
    try {
      const datosPath = 'C:/Users/user/Documents/GitHub/zetah-gallery/recursos/datos.json';
      if (fs.existsSync(datosPath)) {
        console.log('Loading actual videos and photos from zetah-gallery...');
        const datosContent = fs.readFileSync(datosPath, 'utf8');
        const datos = JSON.parse(datosContent);

        // Sembrar videos
        if (datos.videos && Array.isArray(datos.videos)) {
          console.log(`Seeding ${datos.videos.length} videos from datos.json...`);
          for (let i = 0; i < datos.videos.length; i++) {
            const video = datos.videos[i];
            const embedUrl = video.url;
            const youtubeId = embedUrl.substring(embedUrl.lastIndexOf('/') + 1);
            const originalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
            const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
            const title = `Producción Audiovisual #${i + 1}`;
            const description = 'Video editado y producido por ZetaH.';
            const publishedAt = new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await client.query(
              `INSERT INTO videos (title, original_url, youtube_id, embed_url, thumbnail_url, description, published_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
              [title, originalUrl, youtubeId, embedUrl, thumbnailUrl, description, publishedAt]
            );
          }
        }

        // Sembrar fotos
        if (datos.imagenes && Array.isArray(datos.imagenes)) {
          console.log(`Seeding ${datos.imagenes.length} photos from datos.json...`);
          for (let i = 0; i < datos.imagenes.length; i++) {
            const img = datos.imagenes[i];
            const imgUrl = img.url;
            
            // Extraer driveId
            let driveId = '';
            if (imgUrl.includes('/d/')) {
              const startIdx = imgUrl.indexOf('/d/') + 3;
              const endIdx = imgUrl.includes('=') ? imgUrl.lastIndexOf('=') : imgUrl.length;
              driveId = imgUrl.substring(startIdx, endIdx);
            }

            if (driveId) {
              const originalUrl = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
              const directUrl = `https://lh3.googleusercontent.com/d/${driveId}=s800`;
              const title = `Fotografía ZetaH #${i + 1}`;
              const description = 'Captura fotográfica artística por ZetaH.';
              const registeredAt = new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

              await client.query(
                `INSERT INTO photos (title, original_url, drive_id, direct_url, description, registered_at) 
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                [title, originalUrl, driveId, directUrl, description, registeredAt]
              );
            }
          }
        }
      } else {
        console.log('No zetah-gallery/recursos/datos.json file found. Skipping actual contents seed.');
      }
    } catch (dataErr: any) {
      console.error('Warning: could not seed actual videos/photos:', dataErr.message);
    }

    console.log('Database initialization completed successfully!');
  } catch (err: any) {
    console.error('Error running migrations/seeds:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDb();
