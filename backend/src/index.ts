import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth.js';
import { parseYoutubeUrl, parseGoogleDriveUrl } from './utils/parsers.js';
import { sendWelcomeEmail, sendCampaignEmail, sendWinnerEmails } from './utils/mailer.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. RUTAS PÚBLICAS
// ==========================================

// Obtener perfil del creador
app.get('/api/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profile WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las publicaciones
app.get('/api/publications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM publications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching publications:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los avisos
app.get('/api/notices', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching notices:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los videos
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos ORDER BY published_at DESC, created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching videos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las fotos
app.get('/api/photos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photos ORDER BY registered_at DESC, created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching photos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar un lead (Quiero más información)
app.post('/api/leads', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido' });
  }

  try {
    // Save to database (this will trigger DB log insert automatically!)
    const result = await pool.query(
      'INSERT INTO leads (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING *',
      [email]
    );

    // Send automated email response
    await sendWelcomeEmail(email);

    res.status(201).json({ message: 'Suscripción exitosa. Se ha enviado un correo con mi información.', lead: result.rows[0] });
  } catch (err: any) {
    console.error('Error creating lead:', err.message);
    res.status(500).json({ error: 'Error al registrar suscripción' });
  }
});

// ==========================================
// 2. AUTENTICACIÓN
// ==========================================

// Login de administrador
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_key_zetah_2026';
    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err: any) {
    console.error('Error on login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token de administrador
app.get('/api/auth/verify', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ valid: true, user: req.user });
});

// ==========================================
// 3. CONTROL DE ADMINISTRACIÓN (PROTEGIDO)
// ==========================================

// Actualizar perfil
app.put('/api/admin/profile', authenticateToken, async (req, res) => {
  const { name, title, bio, avatar_url, cover_url, email, phone, instagram_url, facebook_url, whatsapp_url, github_url, linkedin_url, slogan } = req.body;

  try {
    const result = await pool.query(
      `UPDATE profile 
       SET name = $1, title = $2, bio = $3, avatar_url = $4, cover_url = $5, 
           email = $6, phone = $7, instagram_url = $8, facebook_url = $9, 
           whatsapp_url = $10, github_url = $11, linkedin_url = $12, slogan = $13
       WHERE id = 1
       RETURNING *`,
      [name, title, bio, avatar_url, cover_url, email, phone, instagram_url, facebook_url, whatsapp_url, github_url, linkedin_url, slogan]
    );

    res.json({ message: 'Perfil actualizado exitosamente', profile: result.rows[0] });
  } catch (err: any) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// --- AVISOS ---
app.post('/api/admin/notices', authenticateToken, async (req, res) => {
  const { title, content, is_active } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son requeridos' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO notices (title, content, is_active) VALUES ($1, $2, $3) RETURNING *',
      [title, content, is_active !== undefined ? is_active : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating notice:', err.message);
    res.status(500).json({ error: 'Error al crear aviso' });
  }
});

app.put('/api/admin/notices/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, is_active } = req.body;

  try {
    const result = await pool.query(
      'UPDATE notices SET title = $1, content = $2, is_active = $3 WHERE id = $4 RETURNING *',
      [title, content, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aviso no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating notice:', err.message);
    res.status(500).json({ error: 'Error al actualizar aviso' });
  }
});

app.delete('/api/admin/notices/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM notices WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aviso no encontrado' });
    }
    res.json({ message: 'Aviso eliminado exitosamente' });
  } catch (err: any) {
    console.error('Error deleting notice:', err.message);
    res.status(500).json({ error: 'Error al eliminar aviso' });
  }
});

// --- PUBLICACIONES ---
app.post('/api/admin/publications', authenticateToken, async (req, res) => {
  const { title, content, image_url } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son requeridos' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO publications (title, content, image_url) VALUES ($1, $2, $3) RETURNING *',
      [title, content, image_url || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating publication:', err.message);
    res.status(500).json({ error: 'Error al crear publicación' });
  }
});

app.put('/api/admin/publications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, image_url } = req.body;

  try {
    const result = await pool.query(
      'UPDATE publications SET title = $1, content = $2, image_url = $3 WHERE id = $4 RETURNING *',
      [title, content, image_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating publication:', err.message);
    res.status(500).json({ error: 'Error al actualizar publicación' });
  }
});

app.delete('/api/admin/publications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM publications WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    res.json({ message: 'Publicación eliminada exitosamente' });
  } catch (err: any) {
    console.error('Error deleting publication:', err.message);
    res.status(500).json({ error: 'Error al eliminar publicación' });
  }
});

// --- VIDEOS ---
app.post('/api/admin/videos', authenticateToken, async (req, res) => {
  const { title, original_url, description, published_at } = req.body;
  if (!title || !original_url) {
    return res.status(400).json({ error: 'Título y enlace original son requeridos' });
  }

  const parsed = parseYoutubeUrl(original_url);
  if (!parsed) {
    return res.status(400).json({ error: 'El enlace de YouTube ingresado no es válido.' });
  }

  const { youtubeId, embedUrl, thumbnailUrl } = parsed;
  const pubDate = published_at || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `INSERT INTO videos (title, original_url, youtube_id, embed_url, thumbnail_url, description, published_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, original_url, youtubeId, embedUrl, thumbnailUrl, description || '', pubDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating video:', err.message);
    res.status(500).json({ error: 'Error al agregar video' });
  }
});

// EDITAR VIDEO
app.put('/api/admin/videos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, original_url, description, published_at } = req.body;
  if (!title || !original_url) {
    return res.status(400).json({ error: 'El título y enlace original son requeridos' });
  }

  const parsed = parseYoutubeUrl(original_url);
  if (!parsed) {
    return res.status(400).json({ error: 'El enlace de YouTube ingresado no es válido.' });
  }

  const { youtubeId, embedUrl, thumbnailUrl } = parsed;
  const pubDate = published_at || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `UPDATE videos 
       SET title = $1, original_url = $2, youtube_id = $3, embed_url = $4, thumbnail_url = $5, description = $6, published_at = $7 
       WHERE id = $8 RETURNING *`,
      [title, original_url, youtubeId, embedUrl, thumbnailUrl, description || '', pubDate, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating video:', err.message);
    res.status(500).json({ error: 'Error al editar video' });
  }
});

app.delete('/api/admin/videos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }
    res.json({ message: 'Video eliminado exitosamente' });
  } catch (err: any) {
    console.error('Error deleting video:', err.message);
    res.status(500).json({ error: 'Error al eliminar video' });
  }
});

// --- FOTOS ---
app.post('/api/admin/photos', authenticateToken, async (req, res) => {
  const { title, original_url, description, registered_at } = req.body;
  if (!title || !original_url) {
    return res.status(400).json({ error: 'Título y enlace original son requeridos' });
  }

  const parsed = parseGoogleDriveUrl(original_url);
  if (!parsed) {
    return res.status(400).json({ error: 'El enlace de Google Drive ingresado no es válido.' });
  }

  const { driveId, directUrl } = parsed;
  const regDate = registered_at || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `INSERT INTO photos (title, original_url, drive_id, direct_url, description, registered_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, original_url, driveId, directUrl, description || '', regDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating photo:', err.message);
    res.status(500).json({ error: 'Error al agregar fotografía' });
  }
});

// EDITAR FOTO
app.put('/api/admin/photos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, original_url, description, registered_at } = req.body;
  if (!title || !original_url) {
    return res.status(400).json({ error: 'El título y enlace original son requeridos' });
  }

  const parsed = parseGoogleDriveUrl(original_url);
  if (!parsed) {
    return res.status(400).json({ error: 'El enlace de Google Drive ingresado no es válido.' });
  }

  const { driveId, directUrl } = parsed;
  const regDate = registered_at || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `UPDATE photos 
       SET title = $1, original_url = $2, drive_id = $3, direct_url = $4, description = $5, registered_at = $6 
       WHERE id = $7 RETURNING *`,
      [title, original_url, driveId, directUrl, description || '', regDate, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fotografía no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating photo:', err.message);
    res.status(500).json({ error: 'Error al editar fotografía' });
  }
});

app.delete('/api/admin/photos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fotografía no encontrada' });
    }
    res.json({ message: 'Fotografía eliminada exitosamente' });
  } catch (err: any) {
    console.error('Error deleting photo:', err.message);
    res.status(500).json({ error: 'Error al eliminar fotografía' });
  }
});

// --- LEADS & CAMPAIGNS (ADMIN) ---
app.get('/api/admin/leads', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching leads:', err.message);
    res.status(500).json({ error: 'Error al obtener leads' });
  }
});

app.delete('/api/admin/leads/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }
    res.json({ message: 'Suscripción eliminada exitosamente' });
  } catch (err: any) {
    console.error('Error deleting lead:', err.message);
    res.status(500).json({ error: 'Error al eliminar lead' });
  }
});

// Historial de campañas publicadas
app.get('/api/admin/campaigns', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campaigns ORDER BY sent_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching campaigns:', err.message);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
});

// Enviar campaña publicitaria masiva
app.post('/api/admin/campaigns', authenticateToken, async (req, res) => {
  const { subject, content } = req.body;
  if (!subject || !content) {
    return res.status(400).json({ error: 'El asunto y contenido de la campaña son requeridos' });
  }

  try {
    // 1. Save campaign record
    const result = await pool.query(
      'INSERT INTO campaigns (subject, content) VALUES ($1, $2) RETURNING *',
      [subject, content]
    );

    // 2. Fetch all leads
    const leadsRes = await pool.query('SELECT email FROM leads');
    const emails = leadsRes.rows.map((row: { email: string }) => row.email);

    // 3. Dispatch emails (mock/real)
    console.log(`[MAILER] Dispatching Campaign "${subject}" to ${emails.length} subscribers...`);
    for (const email of emails) {
      await sendCampaignEmail(email, subject, content);
    }

    res.status(201).json({ message: `Campaña enviada con éxito a ${emails.length} correos.`, campaign: result.rows[0] });
  } catch (err: any) {
    console.error('Error sending campaign:', err.message);
    res.status(500).json({ error: 'Error al procesar campaña' });
  }
});

// --- LOGS DE AUDITORÍA ---
app.get('/api/admin/logs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 200');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching audit logs:', err.message);
    res.status(500).json({ error: 'Error al consultar logs de auditoría' });
  }
});

// --- USUARIOS ---
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, created_at FROM users ORDER BY username ASC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/admin/users', authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    const checkUser = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user?.id;

  if (loggedInUserId && parseInt(id) === loggedInUserId) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
  }

  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(countRes.rows[0].count);
    if (totalUsers <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el último usuario administrador.' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err: any) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// --- ESTADÍSTICAS ---
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const vCount = await pool.query('SELECT COUNT(*) FROM videos');
    const pCount = await pool.query('SELECT COUNT(*) FROM photos');
    const nCount = await pool.query('SELECT COUNT(*) FROM notices');
    const pubCount = await pool.query('SELECT COUNT(*) FROM publications');
    const uCount = await pool.query('SELECT COUNT(*) FROM users');
    const lCount = await pool.query('SELECT COUNT(*) FROM leads');
    const wCount = await pool.query('SELECT COUNT(*) FROM winners').catch(() => ({ rows: [{ count: '0' }] }));
    
    const vRecent = await pool.query("SELECT COUNT(*) FROM videos WHERE published_at >= CURRENT_DATE - INTERVAL '30 days'");
    const pRecent = await pool.query("SELECT COUNT(*) FROM photos WHERE registered_at >= CURRENT_DATE - INTERVAL '30 days'");

    res.json({
      videos: parseInt(vCount.rows[0].count),
      photos: parseInt(pCount.rows[0].count),
      notices: parseInt(nCount.rows[0].count),
      publications: parseInt(pubCount.rows[0].count),
      users: parseInt(uCount.rows[0].count),
      leads: parseInt(lCount.rows[0].count),
      winners: parseInt(wCount.rows[0].count),
      videos_recent: parseInt(vRecent.rows[0].count),
      photos_recent: parseInt(pRecent.rows[0].count)
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ==========================================
// 4. RUTAS DE GANADORES DEL JUEGO
// ==========================================

// Registrar un nuevo ganador (Público)
app.post('/api/winners', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Nombre, correo y número celular son requeridos.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO winners (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    );

    // Enviar correos al ganador y al administrador
    await sendWinnerEmails(name, email, phone);

    res.status(201).json({ message: 'Premio registrado con éxito. Se ha enviado un correo con las instrucciones.', winner: result.rows[0] });
  } catch (err: any) {
    console.error('Error registering winner:', err.message);
    res.status(500).json({ error: 'Error al guardar el registro del ganador' });
  }
});

// Obtener todos los ganadores (Admin - Protegido)
app.get('/api/admin/winners', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM winners ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching winners:', err.message);
    res.status(500).json({ error: 'Error al obtener la lista de ganadores' });
  }
});

// Eliminar un ganador (Admin - Protegido)
app.delete('/api/admin/winners/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM winners WHERE id = $1', [id]);
    res.json({ message: 'Ganador eliminado con éxito' });
  } catch (err: any) {
    console.error('Error deleting winner:', err.message);
    res.status(500).json({ error: 'Error al eliminar el registro del ganador' });
  }
});

// Inicializar tabla de ganadores al arrancar el servidor
const initWinnersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS winners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Winners table verified/created successfully.');
  } catch (err: any) {
    console.error('[DB] Error initializing winners table:', err.message);
  }
};
initWinnersTable();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Ruta raíz para verificar que el backend funciona
app.get('/', (req, res) => {
  res.json({ 
    message: "¡Backend de Zetah funcionando perfectamente en 2026! 🚀", 
    status: "online" 
  });
});

