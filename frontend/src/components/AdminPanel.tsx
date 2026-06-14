import React, { useState, useEffect } from 'react';
import { 
  FaSignOutAlt, FaUser, FaBullhorn, FaBookOpen, FaVideo, 
  FaCamera, FaTrash, FaPlus, FaSave, FaEye, FaUsers, FaChartPie,
  FaSun, FaMoon, FaMailBulk, FaHistory, FaFolderOpen, FaEdit, FaTimes, FaTrophy
} from 'react-icons/fa';
import { Language } from '../utils/translations.ts';
import { API_URL } from '../utils/api.ts';

const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.startsWith('/api')) {
    return window.fetch(`${API_URL}${input}`, init);
  }
  return window.fetch(input, init);
};

interface AdminPanelProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onCloseAdmin: () => void;
}

export default function AdminPanel({ 
  language, setLanguage, 
  theme, setTheme, 
  onCloseAdmin 
}: AdminPanelProps) {
  const navigateToPublic = onCloseAdmin;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Tab: dashboard, profile, notices, publications, videos, photos, users, leads, logs, winners
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'notices' | 'publications' | 'videos' | 'photos' | 'users' | 'leads' | 'logs' | 'winners'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard': return language === 'es' ? 'Dashboard' : 'Dashboard';
      case 'profile': return language === 'es' ? 'Perfil & Biografía' : 'Profile & Bio';
      case 'notices': return language === 'es' ? 'Avisos/Alertas' : 'Notices/Alerts';
      case 'publications': return language === 'es' ? 'Publicaciones' : 'Publications';
      case 'videos': return language === 'es' ? 'Videos (YouTube)' : 'Videos (YouTube)';
      case 'photos': return language === 'es' ? 'Fotos (Drive)' : 'Photos (Drive)';
      case 'winners': return language === 'es' ? 'Ganadores Fotos' : 'Photo Winners';
      case 'leads': return language === 'es' ? 'Publicidad & Leads' : 'Advertising & Leads';
      case 'users': return language === 'es' ? 'Administradores' : 'Administrators';
      case 'logs': return language === 'es' ? 'Auditoría (Logs)' : 'Audit (Logs)';
      default: return '';
    }
  };

  // Token
  const [token, setToken] = useState<string | null>(null);

  // States for DB data
  const [profile, setProfile] = useState<any>({
    name: '', title: '', bio: '', avatar_url: '', cover_url: '',
    email: '', phone: '', instagram_url: '', facebook_url: '',
    whatsapp_url: '', github_url: '', linkedin_url: '', slogan: ''
  });
  const [notices, setNotices] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  
  // Dashboard stats
  const [stats, setStats] = useState<any>({
    videos: 0, photos: 0, notices: 0, publications: 0, users: 0
  });

  // Pagination current pages
  const [noticesPage, setNoticesPage] = useState(1);
  const [publicationsPage, setPublicationsPage] = useState(1);
  const [videosPage, setVideosPage] = useState(1);
  const [photosPage, setPhotosPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [winnersPage, setWinnersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [campaignsPage, setCampaignsPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  const renderPaginationControls = (totalItems: number, currentPage: number, setCurrentPage: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', alignItems: 'center' }}>
        <button 
          className="btn btn-secondary" 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(currentPage - 1)}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
        >
          {language === 'es' ? 'Anterior' : 'Previous'}
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {language === 'es' ? `Pág. ${currentPage} de ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
        </span>
        <button 
          className="btn btn-secondary" 
          disabled={currentPage === totalPages} 
          onClick={() => setCurrentPage(currentPage + 1)}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
        >
          {language === 'es' ? 'Siguiente' : 'Next'}
        </button>
      </div>
    );
  };

  // Modal Editing States
  const [editVideo, setEditVideo] = useState<any | null>(null);
  const [editPhoto, setEditPhoto] = useState<any | null>(null);

  // Form states for adding items
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', is_active: true, id: null as number | null });
  const [pubForm, setPubForm] = useState({ title: '', content: '', image_url: '', id: null as number | null });
  const [videoForm, setVideoForm] = useState({ title: '', original_url: '', description: '', published_at: new Date().toISOString().split('T')[0] });
  const [photoForm, setPhotoForm] = useState({ title: '', original_url: '', description: '', registered_at: new Date().toISOString().split('T')[0] });
  const [userForm, setUserForm] = useState({ username: '', password: '' });
  const [campaignForm, setCampaignForm] = useState({ subject: '', content: '' });

  // Load token and verify on start
  useEffect(() => {
    const savedToken = localStorage.getItem('zetah_admin_token');
    if (savedToken) {
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsLoggedIn(true);
          setToken(savedToken);
        } else {
          localStorage.removeItem('zetah_admin_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('zetah_admin_token');
      });
    }
  }, []);

  // Fetch data depending on auth
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchStats();
      
      // Profile
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error(err));

      // Notices
      fetch('/api/notices')
        .then(res => res.json())
        .then(data => setNotices(data))
        .catch(err => console.error(err));

      // Publications
      fetch('/api/publications')
        .then(res => res.json())
        .then(data => setPublications(data))
        .catch(err => console.error(err));

      // Videos
      fetch('/api/videos')
        .then(res => res.json())
        .then(data => setVideos(data))
        .catch(err => console.error(err));

      // Photos
      fetch('/api/photos')
        .then(res => res.json())
        .then(data => setPhotos(data))
        .catch(err => console.error(err));

      // Users
      fetchUsers();

      // Leads
      fetchLeads();

      // Campaigns
      fetchCampaigns();

      // Logs
      fetchLogs();

      // Winners
      fetchWinners();
    }
  }, [isLoggedIn, token]);

  const fetchStats = () => {
    if (!token) return;
    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    if (!token) return;
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  const fetchLeads = () => {
    if (!token) return;
    fetch('/api/admin/leads', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLeads(data))
      .catch(err => console.error(err));
  };

  const fetchCampaigns = () => {
    if (!token) return;
    fetch('/api/admin/campaigns', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCampaigns(data))
      .catch(err => console.error(err));
  };

  const fetchLogs = () => {
    if (!token) return;
    fetch('/api/admin/logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error(err));
  };

  const fetchWinners = () => {
    if (!token) return;
    fetch('/api/admin/winners', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setWinners(data))
      .catch(err => console.error(err));
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error de inicio de sesión');
      }
      localStorage.setItem('zetah_admin_token', data.token);
      setToken(data.token);
      setIsLoggedIn(true);
      showNotification('success', 'Sesión iniciada exitosamente');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('zetah_admin_token');
    setToken(null);
    setIsLoggedIn(false);
  };

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error actualizando perfil');
      showNotification('success', 'Perfil actualizado con éxito');
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Add or Edit Notice
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = noticeForm.id !== null;
    const url = isEditing ? `/api/admin/notices/${noticeForm.id}` : '/api/admin/notices';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noticeForm.title,
          content: noticeForm.content,
          is_active: noticeForm.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar aviso');

      if (isEditing) {
        setNotices(notices.map(n => n.id === noticeForm.id ? data : n));
        showNotification('success', 'Aviso actualizado con éxito');
      } else {
        setNotices([data, ...notices]);
        showNotification('success', 'Aviso creado con éxito');
      }

      setNoticeForm({ title: '', content: '', is_active: true, id: null });
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este aviso?')) return;
    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar aviso');
      setNotices(notices.filter(n => n.id !== id));
      showNotification('success', 'Aviso eliminado');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Add or Edit Publication
  const handleSavePub = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = pubForm.id !== null;
    const url = isEditing ? `/api/admin/publications/${pubForm.id}` : '/api/admin/publications';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: pubForm.title,
          content: pubForm.content,
          image_url: pubForm.image_url
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar publicación');

      if (isEditing) {
        setPublications(publications.map(p => p.id === pubForm.id ? data : p));
        showNotification('success', 'Publicación actualizada');
      } else {
        setPublications([data, ...publications]);
        showNotification('success', 'Publicación creada');
      }

      setPubForm({ title: '', content: '', image_url: '', id: null });
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Publication
  const handleDeletePub = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      const res = await fetch(`/api/admin/publications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar publicación');
      setPublications(publications.filter(p => p.id !== id));
      showNotification('success', 'Publicación eliminada');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar video');
      
      setVideos([data, ...videos]);
      setVideoForm({ title: '', original_url: '', description: '', published_at: new Date().toISOString().split('T')[0] });
      showNotification('success', 'Video agregado y procesado con éxito');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Edit Video Submit Handler
  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVideo) return;
    
    try {
      const res = await fetch(`/api/admin/videos/${editVideo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editVideo.title,
          original_url: editVideo.original_url,
          description: editVideo.description,
          published_at: editVideo.published_at ? editVideo.published_at.substring(0, 10) : ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar video');
      
      setVideos(videos.map(v => v.id === editVideo.id ? data : v));
      setEditVideo(null);
      showNotification('success', 'Video actualizado con éxito');
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Video
  const handleDeleteVideo = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este video del portafolio?')) return;
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar video');
      setVideos(videos.filter(v => v.id !== id));
      showNotification('success', 'Video eliminado del portafolio');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Add Photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(photoForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar fotografía');

      setPhotos([data, ...photos]);
      setPhotoForm({ title: '', original_url: '', description: '', registered_at: new Date().toISOString().split('T')[0] });
      showNotification('success', 'Fotografía agregada y procesado con éxito');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Edit Photo Submit Handler
  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhoto) return;

    try {
      const res = await fetch(`/api/admin/photos/${editPhoto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editPhoto.title,
          original_url: editPhoto.original_url,
          description: editPhoto.description,
          registered_at: editPhoto.registered_at ? editPhoto.registered_at.substring(0, 10) : ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar fotografía');

      setPhotos(photos.map(p => p.id === editPhoto.id ? data : p));
      setEditPhoto(null);
      showNotification('success', 'Fotografía actualizada con éxito');
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta fotografía del portafolio?')) return;
    try {
      const res = await fetch(`/api/admin/photos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar fotografía');
      setPhotos(photos.filter(p => p.id !== id));
      showNotification('success', 'Fotografía personalizada eliminada');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Add Admin User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar administrador');

      setUsers([...users, data]);
      setUserForm({ username: '', password: '' });
      showNotification('success', 'Nuevo administrador registrado con éxito');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Admin User
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario administrador?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');

      setUsers(users.filter(u => u.id !== id));
      showNotification('success', 'Usuario administrador eliminado');
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Lead Email
  const handleDeleteLead = async (id: number) => {
    if (!window.confirm('¿Deseas dar de baja esta suscripción de correo?')) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar lead');
      
      setLeads(leads.filter(l => l.id !== id));
      showNotification('success', 'Suscriptor dado de baja con éxito');
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Dispatch campaign
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leads.length === 0) {
      showNotification('error', 'No hay ningún correo registrado para enviar publicidad.');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar campaña');

      setCampaigns([data.campaign, ...campaigns]);
      setCampaignForm({ subject: '', content: '' });
      showNotification('success', data.message);
      fetchLogs();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // ==========================================
  // RENDER PANTALLA LOGIN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="login-root">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        
        <div className="login-card glass">
          <div className="login-header">
            <img src="recursos/ico.png" alt="ZetaH" className="login-logo" onError={(e) => {
              (e.target as HTMLImageElement).src = 'recursos/ico_blanco.png';
            }} />
            <h2>Control Administrativo</h2>
            <p>Inicia sesión para gestionar el contenido del sitio</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Usuario</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>

            {errorMsg && <div className="alert-box error-alert">{errorMsg}</div>}
            {successMsg && <div className="alert-box success-alert">{successMsg}</div>}
            
            <button type="submit" className="btn btn-primary login-btn">Ingresar</button>
          </form>

          <button onClick={navigateToPublic} className="btn btn-secondary back-public-btn">
            <FaEye /> Volver a la Vista Pública
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {successMsg && <div className="toast success-toast">{successMsg}</div>}
      {errorMsg && <div className="toast error-toast">{errorMsg}</div>}

      {/* Admin Header */}
      <header className="admin-header glass">
        <div className="admin-header-container">
          <div className="admin-logo-sec">
            <img src="recursos/ico_blanco.png" alt="ZetaH" className="admin-logo-img" />
            <span>ZetaH Panel</span>
          </div>
          <div className="admin-actions-sec">
            <div className="toggle-controls" style={{ marginRight: '1rem' }}>
              <button 
                className="icon-toggle-btn" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              
              <button 
                className="lang-toggle-btn" 
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              >
                {language === 'es' ? "EN" : "ES"}
              </button>
            </div>
            
            <button className="btn btn-secondary" onClick={navigateToPublic}>
              <FaEye /> Vista Pública
            </button>
            <button className="btn btn-primary" onClick={handleLogout}>
              <FaSignOutAlt /> Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Admin Layout */}
      <div className="admin-layout container">
        {/* Sidebar */}
        <aside className={`admin-sidebar glass ${menuOpen ? 'expanded' : ''}`}>
          <button className="admin-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span>{getTabLabel(activeTab)}</span>
            <span className="arrow-icon">{menuOpen ? '▲' : '▼'}</span>
          </button>
          
          <div className="admin-sidebar-links">
            <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}><FaChartPie /> Dashboard</button>
            <button className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}><FaUser /> Perfil & Biografía</button>
            <button className={`sidebar-link ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => { setActiveTab('notices'); setMenuOpen(false); }}><FaBullhorn /> Avisos/Alertas</button>
            <button className={`sidebar-link ${activeTab === 'publications' ? 'active' : ''}`} onClick={() => { setActiveTab('publications'); setMenuOpen(false); }}><FaBookOpen /> Publicaciones</button>
            <button className={`sidebar-link ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => { setActiveTab('videos'); fetchStats(); setMenuOpen(false); }}><FaVideo /> Videos (YouTube)</button>
            <button className={`sidebar-link ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => { setActiveTab('photos'); fetchStats(); setMenuOpen(false); }}><FaCamera /> Fotos (Drive)</button>
            <button className={`sidebar-link ${activeTab === 'winners' ? 'active' : ''}`} onClick={() => { setActiveTab('winners'); fetchWinners(); setMenuOpen(false); }}><FaTrophy /> Ganadores Fotos</button>
            <button className={`sidebar-link ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => { setActiveTab('leads'); fetchLeads(); fetchCampaigns(); setMenuOpen(false); }}><FaMailBulk /> Publicidad & Leads</button>
            <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); fetchUsers(); setMenuOpen(false); }}><FaUsers /> Administradores</button>
            <button className={`sidebar-link ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => { setActiveTab('logs'); fetchLogs(); setMenuOpen(false); }}><FaFolderOpen /> Auditoría (Logs)</button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main-content glass">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Dashboard de Estadísticas</h2>
              <p className="tab-subtitle">Resumen cuantitativo del contenido publicado en tu portafolio digital.</p>
              
              <div className="stats-grid">
                <div className="stat-card glass"><div className="stat-number">{stats.videos}</div><div className="stat-label">Videos Totales</div></div>
                <div className="stat-card glass"><div className="stat-number">{stats.photos}</div><div className="stat-label">Fotos Totales</div></div>
                <div className="stat-card glass"><div className="stat-number">{stats.videos_recent || 0}</div><div className="stat-label">Videos Nuevos (30d)</div></div>
                <div className="stat-card glass"><div className="stat-number">{stats.photos_recent || 0}</div><div className="stat-label">Fotos Nuevas (30d)</div></div>
                <div className="stat-card glass" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('winners'); fetchWinners(); }}><div className="stat-number">{stats.winners || 0}</div><div className="stat-label">Ganadores Fotos</div></div>
                <div className="stat-card glass"><div className="stat-number">{stats.leads || 0}</div><div className="stat-label">Suscriptores</div></div>
                <div className="stat-card glass"><div className="stat-number">{stats.users}</div><div className="stat-label">Admins</div></div>
              </div>

              <div className="dashboard-shortcuts glass" style={{ padding: '2rem', marginTop: '2rem' }}>
                <h3>Acciones Rápidas</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('videos')}>+ Subir Video</button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('photos')}>+ Subir Foto</button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('notices')}>+ Publicar Aviso</button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('leads')}>+ Enviar Publicidad</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Editar Perfil & Biografía</h2>
              <form onSubmit={handleUpdateProfile} className="admin-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nombre del Creador</label>
                    <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Título Profesional</label>
                    <input type="text" value={profile.title} onChange={e => setProfile({...profile, title: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Biografía</label>
                  <textarea rows={4} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Foto de Perfil (Avatar)</label>
                    <input type="text" value={profile.avatar_url} onChange={e => setProfile({...profile, avatar_url: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Eslogan en Footer</label>
                    <input type="text" value={profile.slogan} onChange={e => setProfile({...profile, slogan: e.target.value})} />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Enlace de Instagram</label>
                    <input type="text" value={profile.instagram_url} onChange={e => setProfile({...profile, instagram_url: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Enlace de Facebook</label>
                    <input type="text" value={profile.facebook_url} onChange={e => setProfile({...profile, facebook_url: e.target.value})} />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Enlace de WhatsApp</label>
                    <input type="text" value={profile.whatsapp_url} onChange={e => setProfile({...profile, whatsapp_url: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Enlace de GitHub</label>
                    <input type="text" value={profile.github_url || ''} onChange={e => setProfile({...profile, github_url: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary"><FaSave /> Guardar Cambios</button>
              </form>
            </div>
          )}

          {/* TAB: AVISOS */}
          {activeTab === 'notices' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Gestionar Avisos (Alertas Fijas)</h2>
              <div className="admin-split-layout">
                <form onSubmit={handleSaveNotice} className="admin-form compact-form glass">
                  <h3>{noticeForm.id ? 'Editar Aviso' : 'Agregar Aviso'}</h3>
                  <div className="form-group">
                    <label>Título del Aviso</label>
                    <input type="text" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Contenido</label>
                    <textarea rows={3} value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} required />
                  </div>
                  <div className="form-group checkbox-group">
                    <input type="checkbox" id="notice_active" checked={noticeForm.is_active} onChange={e => setNoticeForm({...noticeForm, is_active: e.target.checked})} />
                    <label htmlFor="notice_active">Aviso Activo</label>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Guardar</button>
                    {noticeForm.id && <button type="button" className="btn btn-secondary" onClick={() => setNoticeForm({title:'',content:'',is_active:true,id:null})}>Cancelar</button>}
                  </div>
                </form>
                <div className="admin-list-section">
                  <h3>Avisos Guardados</h3>
                  <div className="admin-items-list">
                    {notices.slice((noticesPage - 1) * ITEMS_PER_PAGE, noticesPage * ITEMS_PER_PAGE).map(notice => (
                      <div key={notice.id} className="admin-list-item glass">
                        <div className="item-info">
                          <span className={`status-dot ${notice.is_active ? 'active' : 'inactive'}`}></span>
                          <h4>{notice.title}</h4>
                          <p>{notice.content}</p>
                        </div>
                        <div className="item-actions">
                          <button className="btn-icon edit-btn" onClick={() => setNoticeForm({title:notice.title, content:notice.content, is_active:notice.is_active, id:notice.id})}>Editar</button>
                          <button className="btn-icon delete-btn" onClick={() => handleDeleteNotice(notice.id)}><FaTrash /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderPaginationControls(notices.length, noticesPage, setNoticesPage)}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PUBLICACIONES */}
          {activeTab === 'publications' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Gestionar Publicaciones</h2>
              <div className="admin-split-layout">
                <form onSubmit={handleSavePub} className="admin-form compact-form glass">
                  <h3>{pubForm.id ? 'Editar Publicación' : 'Agregar Publicación'}</h3>
                  <div className="form-group">
                    <label>Título</label>
                    <input type="text" value={pubForm.title} onChange={e => setPubForm({...pubForm, title: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Imagen Destacada (Ruta)</label>
                    <input type="text" value={pubForm.image_url} onChange={e => setPubForm({...pubForm, image_url: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Contenido</label>
                    <textarea rows={5} value={pubForm.content} onChange={e => setPubForm({...pubForm, content: e.target.value})} required />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Guardar</button>
                    {pubForm.id && <button type="button" className="btn btn-secondary" onClick={() => setPubForm({title:'',content:'',image_url:'',id:null})}>Cancelar</button>}
                  </div>
                </form>
                <div className="admin-list-section">
                  <h3>Publicaciones</h3>
                  <div className="admin-items-list">
                    {publications.slice((publicationsPage - 1) * ITEMS_PER_PAGE, publicationsPage * ITEMS_PER_PAGE).map(pub => (
                      <div key={pub.id} className="admin-list-item glass pub-item">
                        {pub.image_url && <img src={pub.image_url} alt="" className="admin-item-thumb" />}
                        <div className="item-info">
                          <h4>{pub.title}</h4>
                        </div>
                        <div className="item-actions">
                          <button className="btn-icon edit-btn" onClick={() => setPubForm({title:pub.title, content:pub.content, image_url:pub.image_url, id:pub.id})}>Editar</button>
                          <button className="btn-icon delete-btn" onClick={() => handleDeletePub(pub.id)}><FaTrash /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderPaginationControls(publications.length, publicationsPage, setPublicationsPage)}
                </div>
              </div>
            </div>
          )}

          {/* TAB: VIDEOS (CON EDICIÓN PUT EN TABLA) */}
          {activeTab === 'videos' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>CRUD de Videos de YouTube</h2>
              
              <form onSubmit={handleAddVideo} className="admin-form glass" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
                <h3>Agregar Video al Portafolio</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Título del Video</label>
                    <input type="text" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} required placeholder="Título" />
                  </div>
                  <div className="form-group">
                    <label>Enlace de YouTube</label>
                    <input type="url" value={videoForm.original_url} onChange={e => setVideoForm({...videoForm, original_url: e.target.value})} required placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Publicación</label>
                    <input type="date" value={videoForm.published_at} onChange={e => setVideoForm({...videoForm, published_at: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción corta</label>
                  <textarea rows={2} value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} placeholder="Detalles de producción..." />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}><FaPlus /> Registrar Video</button>
              </form>

              <h3>Videos Publicados (Tabla CRUD)</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Miniatura</th>
                      <th>Título</th>
                      <th>Enlace</th>
                      <th>YouTube ID</th>
                      <th>Publicado</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.slice((videosPage - 1) * ITEMS_PER_PAGE, videosPage * ITEMS_PER_PAGE).map(v => (
                      <tr key={v.id}>
                        <td><img src={v.thumbnail_url} alt="" className="table-thumb" /></td>
                        <td style={{ fontWeight: 600 }}>{v.title}</td>
                        <td><a href={v.original_url} target="_blank" rel="noreferrer" className="table-text-truncated" style={{ color: 'var(--accent-cyan)' }}>YouTube</a></td>
                        <td><span className="code-badge">{v.youtube_id}</span></td>
                        <td><span className="code-badge" style={{ background: 'rgba(112, 0, 255, 0.1)', color: '#b983ff' }}>{v.published_at ? v.published_at.substring(0, 10) : '-'}</span></td>
                        <td><div className="table-text-truncated">{v.description || 'Sin descripción'}</div></td>
                        <td>
                          <div className="item-actions">
                            <button className="btn-icon edit-btn" onClick={() => setEditVideo(v)}><FaEdit /></button>
                            <button className="btn-icon delete-btn" onClick={() => handleDeleteVideo(v.id)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPaginationControls(videos.length, videosPage, setVideosPage)}
            </div>
          )}

          {/* TAB: PHOTOS (CON EDICIÓN PUT EN TABLA) */}
          {activeTab === 'photos' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>CRUD de Fotografías de Google Drive</h2>
              
              <form onSubmit={handleAddPhoto} className="admin-form glass" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
                <h3>Agregar Foto al Portafolio</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Título de la Foto</label>
                    <input type="text" value={photoForm.title} onChange={e => setPhotoForm({...photoForm, title: e.target.value})} required placeholder="Título" />
                  </div>
                  <div className="form-group">
                    <label>Enlace de Google Drive</label>
                    <input type="url" value={photoForm.original_url} onChange={e => setPhotoForm({...photoForm, original_url: e.target.value})} required placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Registro</label>
                    <input type="date" value={photoForm.registered_at} onChange={e => setPhotoForm({...photoForm, registered_at: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción corta</label>
                  <textarea rows={2} value={photoForm.description} onChange={e => setPhotoForm({...photoForm, description: e.target.value})} placeholder="Detalles de cámara..." />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}><FaPlus /> Registrar Foto</button>
              </form>

              <h3>Fotos Publicadas (Tabla CRUD)</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Título</th>
                      <th>Enlace</th>
                      <th>Drive ID</th>
                      <th>Registrado</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {photos.slice((photosPage - 1) * ITEMS_PER_PAGE, photosPage * ITEMS_PER_PAGE).map(p => (
                      <tr key={p.id}>
                        <td><img src={p.direct_url} alt="" className="table-thumb" onError={(e) => { (e.target as HTMLImageElement).src = `https://drive.google.com/uc?export=view&id=${p.drive_id}`; }} /></td>
                        <td style={{ fontWeight: 600 }}>{p.title}</td>
                        <td><a href={p.original_url} target="_blank" rel="noreferrer" className="table-text-truncated" style={{ color: 'var(--accent-cyan)' }}>Google Drive</a></td>
                        <td><span className="code-badge">{p.drive_id.substring(0, 10)}...</span></td>
                        <td><span className="code-badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#8ae8ff' }}>{p.registered_at ? p.registered_at.substring(0, 10) : '-'}</span></td>
                        <td><div className="table-text-truncated">{p.description || 'Sin descripción'}</div></td>
                        <td>
                          <div className="item-actions">
                            <button className="btn-icon edit-btn" onClick={() => setEditPhoto(p)}><FaEdit /></button>
                            <button className="btn-icon delete-btn" onClick={() => handleDeletePhoto(p.id)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPaginationControls(photos.length, photosPage, setPhotosPage)}
            </div>
          )}

          {/* TAB: LEADS & CAMPAIGNS (PUBLICIDAD) */}
          {activeTab === 'leads' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Módulo de Publicidad & Suscriptores</h2>
              <p className="tab-subtitle">Redacta y envía publicidad masiva por correo electrónico a todos tus prospectos.</p>
              
              <div className="admin-split-layout">
                {/* Redactar Campaña */}
                <form onSubmit={handleSendCampaign} className="admin-form compact-form glass">
                  <h3>Enviar Boletín Publicitario</h3>
                  <div className="form-group">
                    <label>Asunto del Correo</label>
                    <input 
                      type="text" 
                      value={campaignForm.subject} 
                      onChange={e => setCampaignForm({...campaignForm, subject: e.target.value})} 
                      required 
                      placeholder="Ej. Oferta especial en sesiones fotográficas"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contenido del Mensaje</label>
                    <textarea 
                      rows={6}
                      value={campaignForm.content} 
                      onChange={e => setCampaignForm({...campaignForm, content: e.target.value})} 
                      required 
                      placeholder="Escribe el cuerpo del correo de publicidad masiva..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary"><FaMailBulk /> Despachar Campaña Masiva</button>
                </form>

                {/* Listado de Leads */}
                <div className="admin-list-section">
                  <h3>Suscripciones de Leads ({leads.length})</h3>
                  <div className="admin-table-container" style={{ marginTop: '0', maxHeight: '400px' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Correo</th>
                          <th>Fecha</th>
                          <th>Baja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.slice((leadsPage - 1) * ITEMS_PER_PAGE, leadsPage * ITEMS_PER_PAGE).map(lead => (
                          <tr key={lead.id}>
                            <td style={{ fontWeight: 600 }}>{lead.email}</td>
                            <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                            <td>
                              <button className="btn-icon delete-btn" onClick={() => handleDeleteLead(lead.id)}>
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationControls(leads.length, leadsPage, setLeadsPage)}

                  <h3 style={{ marginTop: '2rem' }}>Historial de Campañas Enviadas ({campaigns.length})</h3>
                  <div className="admin-items-list" style={{ maxHeight: '350px' }}>
                    {campaigns.slice((campaignsPage - 1) * ITEMS_PER_PAGE, campaignsPage * ITEMS_PER_PAGE).map(camp => (
                      <div key={camp.id} className="admin-list-item glass">
                        <div className="item-info">
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FaHistory /> {new Date(camp.sent_at).toLocaleString()}</span>
                          <h4 style={{ color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>{camp.subject}</h4>
                          <p>{camp.content.substring(0, 100)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderPaginationControls(campaigns.length, campaignsPage, setCampaignsPage)}
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Auditoría de Datos (Logs de BD)</h2>
              <p className="tab-subtitle">Registro automático e íntegro de todas las escrituras en la base de datos controladas por triggers PostgreSQL.</p>
              
              <div className="admin-table-container">
                <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>ID Log</th>
                      <th>Acción</th>
                      <th>Tabla</th>
                      <th>ID Fila</th>
                      <th>Fecha y Hora</th>
                      <th>Detalles (JSON)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice((logsPage - 1) * ITEMS_PER_PAGE, logsPage * ITEMS_PER_PAGE).map(log => (
                      <tr key={log.id}>
                        <td><span className="code-badge">#{log.id}</span></td>
                        <td>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            color: 'white',
                            backgroundColor: log.action_type === 'INSERT' ? '#10b981' : log.action_type === 'UPDATE' ? '#f59e0b' : '#ef4444'
                          }}>
                            {log.action_type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.table_name}</td>
                        <td>{log.record_id}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>
                          <div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '4px', minWidth: '150px' }}>
                            {log.new_data ? JSON.stringify(log.new_data) : JSON.stringify(log.old_data)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPaginationControls(logs.length, logsPage, setLogsPage)}
            </div>
          )}

          {/* TAB: ADMINISTRADORES */}
          {activeTab === 'users' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>CRUD de Administradores</h2>
              <div className="admin-split-layout">
                <form onSubmit={handleAddUser} className="admin-form compact-form glass">
                  <h3>Nuevo Administrador</h3>
                  <div className="form-group">
                    <label>Nombre de Usuario</label>
                    <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required placeholder="Usuario" />
                  </div>
                  <div className="form-group">
                    <label>Contraseña de Acceso</label>
                    <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required placeholder="••••••••" />
                  </div>
                  <button type="submit" className="btn btn-primary"><FaPlus /> Crear Usuario</button>
                </form>

                <div className="admin-list-section">
                  <h3>Usuarios Registrados</h3>
                  <div className="admin-table-container" style={{ marginTop: '0' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Fecha Registro</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE).map(u => (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</td>
                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td>
                              <button className="btn-icon delete-btn" onClick={() => handleDeleteUser(u.id)}><FaTrash /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationControls(users.length, usersPage, setUsersPage)}
                </div>
              </div>
            </div>
          )}

          {/* TAB: GANADORES */}
          {activeTab === 'winners' && (
            <div className="admin-section-wrapper animate-fade">
              <h2>Lista de Ganadores (Reto 1000 Puntos)</h2>
              <p className="tab-subtitle">Jugadores que alcanzaron los 1000 puntos en ZetaH Runner y registraron su premio de sesión de fotos gratis.</p>
              
              <div className="admin-list-section" style={{ marginTop: '1.5rem' }}>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo Electrónico</th>
                        <th>Número Celular</th>
                        <th>Fecha de Victoria</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No hay ganadores registrados aún.
                          </td>
                        </tr>
                      ) : (
                        winners.slice((winnersPage - 1) * ITEMS_PER_PAGE, winnersPage * ITEMS_PER_PAGE).map(w => (
                          <tr key={w.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</td>
                            <td>
                              <a href={`mailto:${w.email}`} style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                                {w.email}
                              </a>
                            </td>
                            <td>{w.phone}</td>
                            <td>{new Date(w.created_at).toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn-icon delete-btn" 
                                onClick={async () => {
                                  if (!window.confirm('¿Seguro que deseas eliminar este registro de ganador?')) return;
                                  try {
                                    const res = await fetch(`/api/admin/winners/${w.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (!res.ok) throw new Error('Error al eliminar ganador');
                                    setWinners(winners.filter(item => item.id !== w.id));
                                    showNotification('success', 'Ganador eliminado con éxito');
                                    fetchStats();
                                  } catch (err: any) {
                                    showNotification('error', err.message);
                                  }
                                }}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationControls(winners.length, winnersPage, setWinnersPage)}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL EDICIÓN VIDEO */}
      {editVideo && (
        <div className="modal-overlay" onClick={() => setEditVideo(null)}>
          <div className="modal-content glass animate-slide" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <button className="modal-close-btn" onClick={() => setEditVideo(null)}><FaTimes /></button>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Editar Video</h2>
            <form onSubmit={handleUpdateVideo} className="admin-form">
              <div className="form-group">
                <label>Título del Video</label>
                <input 
                  type="text" 
                  value={editVideo.title} 
                  onChange={e => setEditVideo({ ...editVideo, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Enlace de YouTube</label>
                <input 
                  type="url" 
                  value={editVideo.original_url || ''} 
                  onChange={e => setEditVideo({ ...editVideo, original_url: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Fecha de Publicación</label>
                <input 
                  type="date" 
                  value={editVideo.published_at ? editVideo.published_at.substring(0, 10) : ''} 
                  onChange={e => setEditVideo({ ...editVideo, published_at: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Descripción del Video</label>
                <textarea 
                  rows={3} 
                  value={editVideo.description} 
                  onChange={e => setEditVideo({ ...editVideo, description: e.target.value })} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary"><FaSave /> Guardar Cambios</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditVideo(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN FOTO */}
      {editPhoto && (
        <div className="modal-overlay" onClick={() => setEditPhoto(null)}>
          <div className="modal-content glass animate-slide" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <button className="modal-close-btn" onClick={() => setEditPhoto(null)}><FaTimes /></button>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Editar Fotografía</h2>
            <form onSubmit={handleUpdatePhoto} className="admin-form">
              <div className="form-group">
                <label>Título de la Fotografía</label>
                <input 
                  type="text" 
                  value={editPhoto.title} 
                  onChange={e => setEditPhoto({ ...editPhoto, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Enlace de Google Drive</label>
                <input 
                  type="url" 
                  value={editPhoto.original_url || ''} 
                  onChange={e => setEditPhoto({ ...editPhoto, original_url: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Fecha de Registro</label>
                <input 
                  type="date" 
                  value={editPhoto.registered_at ? editPhoto.registered_at.substring(0, 10) : ''} 
                  onChange={e => setEditPhoto({ ...editPhoto, registered_at: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Descripción de la Fotografía</label>
                <textarea 
                  rows={3} 
                  value={editPhoto.description} 
                  onChange={e => setEditPhoto({ ...editPhoto, description: e.target.value })} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary"><FaSave /> Guardar Cambios</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditPhoto(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
