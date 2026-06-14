import { useState, useEffect } from 'react';
import { 
  FaWhatsapp, FaEnvelope, FaPhone, 
  FaTimes, FaPlay, FaImage, FaChevronRight, FaSun, FaMoon, FaLock 
} from 'react-icons/fa';
import ThreeDCamera from './ThreeDCamera.tsx';
import ThreeDWord from './ThreeDWord.tsx';
import ThreeDTilt from './ThreeDTilt.tsx';
import MiniGame from './MiniGame.tsx';
import { translations, Language } from '../utils/translations.ts';


interface Profile {
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  email: string;
  phone: string;
  instagram_url: string;
  facebook_url: string;
  whatsapp_url: string;
  github_url: string;
  linkedin_url: string;
  slogan: string;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

interface Publication {
  id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

interface Video {
  id: number;
  title: string;
  original_url: string;
  youtube_id: string;
  embed_url: string;
  thumbnail_url: string;
  description: string;
  published_at?: string;
}

interface Photo {
  id: number;
  title: string;
  original_url: string;
  drive_id: string;
  direct_url: string;
  description: string;
  registered_at?: string;
}

interface PublicPortfolioProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onOpenAdmin: () => void;
}

export default function PublicPortfolio({ 
  language, setLanguage, 
  theme, setTheme, 
  onOpenAdmin 
}: PublicPortfolioProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'photos'>('videos');
  const [active3DModel, setActive3DModel] = useState<'camera' | 'zetah' | 'alpacity'>('camera');
  const [showGame, setShowGame] = useState(false);
  
  // Newsletter state
  const [leadEmail, setLeadEmail] = useState('');
  const [newsSuccess, setNewsSuccess] = useState('');
  const [newsError, setNewsError] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);

  // Side drawer state
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<{ title: string; type: 'quien' | 'contacto' | 'redes' } | null>(null);

  // Modal view states
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Footer image state (changes based on social icon interaction)
  const [footerIcon, setFooterIcon] = useState('recursos/ico.png');

  // Translation helpers
  const t = translations[language];

  useEffect(() => {
    // Fetch all public data
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error('Error fetching profile:', err));

    fetch('/api/notices')
      .then(res => res.json())
      .then(data => setNotices(data.filter((n: Notice) => n.is_active)))
      .catch(err => console.error('Error fetching notices:', err));

    fetch('/api/publications')
      .then(res => res.json())
      .then(data => setPublications(data))
      .catch(err => console.error('Error fetching publications:', err));

    fetch('/api/videos')
      .then(res => res.json())
      .then(data => setVideos(data))
      .catch(err => console.error('Error fetching videos:', err));

    fetch('/api/photos')
      .then(res => res.json())
      .then(data => setPhotos(data))
      .catch(err => console.error('Error fetching photos:', err));
  }, []);

  const openDrawer = (type: 'quien' | 'contacto' | 'redes') => {
    const titles = {
      quien: t.drawerWhoTitle,
      contacto: t.drawerContactTitle,
      redes: t.drawerSocialsTitle
    };
    setDrawerContent({ title: titles[type], type });
    setSideDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSideDrawerOpen(false);
  };

  const handleSocialIconClick = (bigImg: string) => {
    setFooterIcon(bigImg);
  };

  // Newsletter subscription submit handler
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsSuccess('');
    setNewsError('');
    setNewsLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || t.newsError);
      }
      
      setNewsSuccess(t.newsSuccess);
      setLeadEmail('');
    } catch (err: any) {
      setNewsError(err.message || t.newsError);
    } finally {
      setNewsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Cargando portafolio de ZetaH...</p>
      </div>
    );
  }

  const isDefaultBio = profile.bio.includes("Mi nombre es Harol Joshue");
  const translatedBio = (language === 'en' && isDefaultBio) ? t.drawerWhoText1 + " " + t.drawerWhoText2 : profile.bio;
  const translatedTitle = (language === 'en' && profile.title.includes("Ingeniero")) ? "Software Engineer & Audiovisual Producer" : profile.title;

  return (
    <div className="portfolio-root">
      {/* Header */}
      <header className="portfolio-header glass">
        <div className="header-container">
          {/* Logo container (Left) */}
          <div className="logo-container">
            <img src="recursos/titulo.png" alt="ZetaH Gallery" className="header-logo" />
          </div>

          {/* Centered navigation menu (solo texto) */}
          <nav className="header-nav-center">
            <button className="header-nav-link" onClick={() => openDrawer('contacto')}>{t.navContact}</button>
            <button className="header-nav-link" onClick={() => openDrawer('quien')}>{t.navWhoIs}</button>
            <button className="header-nav-link" onClick={() => openDrawer('redes')}>{t.navSocials}</button>
          </nav>

          {/* Toggles theme/lang/admin (Right / funciones a la derecha) */}
          <div className="toggle-controls">
            <button 
              className="icon-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
            >
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
            
            <button 
              className="lang-toggle-btn"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              title={language === 'es' ? "Switch to English" : "Cambiar a Español"}
            >
              {language === 'es' ? "EN" : "ES"}
            </button>

            {/* Padlock button (Sutil access to Admin Panel) */}
            <button 
              className="icon-toggle-btn admin-link"
              onClick={onOpenAdmin}
              title={t.navAdmin}
              style={{ borderColor: 'rgba(0, 210, 255, 0.4)', color: 'var(--accent-cyan)' }}
            >
              <FaLock />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="container hero-container animate-fade">
          <div className="hero-content-split">
            <div className="hero-content-left">
              <div className="avatar-wrapper">
                <img src={profile.avatar_url || '/recursos/zetah-2026.jpg'} alt={profile.name} className="hero-avatar" />
                <div className="avatar-glow"></div>
              </div>
              <h1 className="hero-name">{profile.name}</h1>
              <p className="hero-title">{translatedTitle}</p>
              <p className="hero-bio">{translatedBio}</p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => openDrawer('contacto')}>
                  {t.heroHire}
                </button>
                <a href="#portfolio-section" className="btn btn-secondary">
                  {t.heroViewWork}
                </a>
              </div>
            </div>
            <div className="hero-content-right">
              <div className="three-d-viewer-wrapper">
                {active3DModel === 'camera' && <ThreeDCamera />}
                {active3DModel === 'zetah' && <ThreeDWord text="ZetaH" color="purple" />}
                {active3DModel === 'alpacity' && <ThreeDWord text="AlpaCity" color="cyan" />}
                
                <div className="three-d-selector-tabs">
                  <button 
                    className={`three-d-tab ${active3DModel === 'camera' ? 'active' : ''}`}
                    onClick={() => setActive3DModel('camera')}
                  >
                    {language === 'es' ? 'Cámara' : 'Camera'}
                  </button>
                  <button 
                    className={`three-d-tab ${active3DModel === 'zetah' ? 'active' : ''}`}
                    onClick={() => setActive3DModel('zetah')}
                  >
                    ZetaH
                  </button>
                  <button 
                    className={`three-d-tab ${active3DModel === 'alpacity' ? 'active' : ''}`}
                    onClick={() => setActive3DModel('alpacity')}
                  >
                    AlpaCity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notices Section (Fijo / Grid de Notificación Premium) */}
      {notices.length > 0 && (
        <section className="notices-section container animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <h2 className="section-title">{t.sectionNotices}</h2>
          </div>
          <div className={`notices-banner ${notices.length === 1 ? 'single' : ''}`} style={{ width: '100%' }}>
            {notices.map((notice) => (
              <div key={notice.id} className="notice-item">
                <span className="notice-title">💡 {notice.title}</span>
                <span className="notice-content">{notice.content}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Publications / Blog Section */}
      {publications.length > 0 && (
        <section className="publications-section container">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <h2 className="section-title">{t.sectionPublications}</h2>
          </div>
          <div className="publications-grid">
            {publications.map(pub => (
              <ThreeDTilt 
                key={pub.id} 
                className="pub-card glass animate-slide" 
                onClick={() => setSelectedPublication(pub)}
              >
                {pub.image_url && (
                  <div className="pub-image-wrapper">
                    <img src={pub.image_url} alt={pub.title} className="pub-image" />
                  </div>
                )}
                <div className="pub-info">
                  <span className="pub-date">{new Date(pub.created_at).toLocaleDateString()}</span>
                  <h3 className="pub-title">{pub.title}</h3>
                  <p className="pub-excerpt">
                    {pub.content.length > 150 ? `${pub.content.substring(0, 150)}...` : pub.content}
                  </p>
                  <span className="pub-read-more">{t.readMore} <FaChevronRight size={10} /></span>
                </div>
              </ThreeDTilt>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio Section (Videos & Photos) */}
      <section id="portfolio-section" className="portfolio-display-section container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <h2 className="section-title">{t.sectionPortfolio}</h2>
        </div>
        
        {/* Tabs */}
        <div className="portfolio-tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <FaPlay className="tab-icon" /> {t.tabVideos}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <FaImage className="tab-icon" /> {t.tabPhotos}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'videos' ? (
          <div className="videos-container animate-fade">
            {videos.length === 0 ? (
              <p className="empty-message">{t.emptyVideos}</p>
            ) : (
              <div className="videos-grid">
                {videos.map(video => (
                  <ThreeDTilt key={video.id} className="video-card video glass">
                    <div className="video-inner animate-fade">
                      <div className="video-wrapper">
                        <iframe 
                          src={video.embed_url} 
                          title={video.title} 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="video-info">
                        <h3 className="video-title">{video.title}</h3>
                        {video.description && <p className="video-description">{video.description}</p>}
                        {video.published_at && (
                          <span className="card-date">
                            {t.publishedAtLabel}: {new Date(video.published_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </ThreeDTilt>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="photos-container animate-fade">
            {photos.length === 0 ? (
              <p className="empty-message">{t.emptyPhotos}</p>
            ) : (
              <div className="photos-grid">
                {photos.map(photo => (
                  <ThreeDTilt 
                    key={photo.id} 
                    className="photo-card photo-frame glass" 
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="photo-image-wrapper">
                      <img 
                        src={photo.direct_url} 
                        alt={photo.title} 
                        className="photo-img photo" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://drive.google.com/uc?export=view&id=${photo.drive_id}`;
                        }}
                      />
                      <div className="photo-hover-overlay">
                        <span>{t.zoomImage}</span>
                      </div>
                    </div>
                    <div className="photo-info">
                      <h3 className="photo-title">{photo.title}</h3>
                      {photo.description && <p className="photo-description">{photo.description}</p>}
                      {photo.registered_at && (
                        <span className="card-date">
                          {t.registeredAtLabel}: {new Date(photo.registered_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </ThreeDTilt>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* MiniGame (Zetah Runner) Section */}
      <section className="gamification-section container animate-fade" style={{ textAlign: 'center', marginBottom: '6rem', marginTop: '4rem' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <h2 className="section-title">{t.sectionZetahGame}</h2>
        </div>
        
        {/* Rules / Description premium container */}
        <div className="glass" style={{ 
          maxWidth: '600px', 
          margin: '0 auto 2rem auto', 
          padding: '1.5rem', 
          textAlign: 'left', 
          border: '1px solid rgba(0, 210, 255, 0.3)', 
          boxShadow: '0 4px 20px rgba(0, 210, 255, 0.05)'
        }}>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ {language === 'es' ? 'Reglas del Juego & Premio' : 'Game Rules & Reward'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
            {language === 'es' 
              ? 'Esquiva las balas que vienen en diferentes alturas saltando. A medida que avanza el tiempo la velocidad aumentará.' 
              : 'Avoid the bullets coming at different heights by jumping. As time goes on, the speed will increase.'}
          </p>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            <li>{language === 'es' ? 'Recoge los items de energía con el rayo (⚡) para obtener una pistola.' : 'Collect the energy items with the lightning bolt (⚡) to get a gun.'}</li>
            <li>{language === 'es' ? 'Presiona [Z] para disparar y destruir las balas que vengan hacia ti.' : 'Press [Z] to shoot and destroy the oncoming bullets.'}</li>
            <li><strong>{language === 'es' ? 'Premio: ¡Llega a 1000 puntos y gana una sesión de fotos gratis!' : 'Reward: Reach 1000 points and win a free photoshoot!'}</strong></li>
          </ul>
        </div>

        <MiniGame language={language} />
      </section>

      {/* Newsletter lead capture section (Quiero más información) */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-card glass animate-slide">
            <h2>{t.newsTitle}</h2>
            <p>{t.newsSubtitle}</p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input 
                type="email" 
                className="newsletter-input" 
                placeholder={t.newsPlaceholder} 
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                required
                disabled={newsLoading}
              />
              <button type="submit" className="newsletter-btn" disabled={newsLoading}>
                {newsLoading ? '...' : t.newsButton}
              </button>
            </form>
            {newsSuccess && <div className="alert-box success-alert" style={{ marginTop: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>{newsSuccess}</div>}
            {newsError && <div className="alert-box error-alert" style={{ marginTop: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>{newsError}</div>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="portfolio-footer glass">
        <div className="container footer-grid">
          <div className="footer-contact">
            <h3 className="footer-heading">ZetaH Gallery</h3>
            <p>{t.footerLocation}</p>
            <p className="phone-text">{profile.phone}</p>
            <div className="social-icons">
              <a 
                href={profile.instagram_url} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => handleSocialIconClick('recursos/instagram_big.png')}
              >
                <img src="recursos/logo_i.png" alt="Instagram" className="social-icon-img" />
              </a>
              <a 
                href={profile.facebook_url} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => handleSocialIconClick('recursos/facebook_big.png')}
              >
                <img src="recursos/logo_f.png" alt="Facebook" className="social-icon-img" />
              </a>
              <a 
                href={profile.whatsapp_url} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => handleSocialIconClick('recursos/whatsapp_big.png')}
              >
                <img src="recursos/logo_wtp.png" alt="WhatsApp" className="social-icon-img" />
              </a>
            </div>
          </div>
          
          <div className="footer-slogan">
            <h2>{profile.slogan || 'Mañana será otro día'}</h2>
          </div>

          <div className="footer-logo">
            <img id="main-icon" src={footerIcon} alt="Logo" className="footer-logo-img" onError={(e) => {
              (e.target as HTMLImageElement).src = 'recursos/ico.png';
            }} />
          </div>
        </div>
      </footer>

      {/* Side Drawer (emergente) */}
      <div className={`side-drawer glass ${sideDrawerOpen ? 'open' : ''}`}>
        <button className="close-drawer-btn" onClick={closeDrawer}>
          <FaTimes />
        </button>
        <div className="drawer-body">
          {drawerContent && (
            <>
              <h2 className="drawer-title">{drawerContent.title}</h2>
              
              {drawerContent.type === 'quien' && (
                <div className="drawer-content-quien">
                  <div className="drawer-img-wrapper">
                    <img src={profile.avatar_url || '/recursos/zetah-2026.jpg'} alt="ZetaH" className="drawer-img" />
                  </div>
                  <p>{t.drawerWhoText1}</p>
                  <p>{t.drawerWhoText2}</p>
                  <p>{t.drawerWhoText3}</p>
                </div>
              )}

              {drawerContent.type === 'contacto' && (
                <div className="drawer-content-contacto">
                  <p>{t.drawerContactText}</p>
                  <div className="contact-links">
                    <a href={`tel:${profile.phone}`} className="contact-link-item glass">
                      <FaPhone className="contact-icon" />
                      <span>{profile.phone}</span>
                    </a>
                    <a href={`mailto:${profile.email}`} className="contact-link-item glass">
                      <FaEnvelope className="contact-icon" />
                      <span>{profile.email}</span>
                    </a>
                    <a href={profile.whatsapp_url} target="_blank" rel="noreferrer" className="contact-link-item glass">
                      <FaWhatsapp className="contact-icon" />
                      <span>{t.drawerWhatsappDirect}</span>
                    </a>
                  </div>
                  <div className="qr-wrapper">
                    <img src="recursos/codigo.jpg" alt="Código QR de Contacto" className="drawer-qr" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} />
                    <p className="qr-caption">{t.drawerContactQr}</p>
                  </div>
                </div>
              )}

              {drawerContent.type === 'redes' && (
                <div className="drawer-content-redes">
                  <div className="drawer-img-wrapper mini">
                    <img src="recursos/ico.png" alt="ZetaH" className="drawer-img" />
                  </div>
                  <p>{t.drawerSocialsText}</p>
                  <div className="social-large-list">
                    <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="social-large-item glass">
                      <span>Instagram (@joshueharol)</span>
                    </a>
                    <a href={profile.facebook_url} target="_blank" rel="noreferrer" className="social-large-item glass">
                      <span>Facebook</span>
                    </a>
                    <a href={profile.whatsapp_url} target="_blank" rel="noreferrer" className="social-large-item glass">
                      <span>{t.drawerWhatsappDirect}</span>
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Publication Reader Modal */}
      {selectedPublication && (
        <div className="modal-overlay" onClick={() => setSelectedPublication(null)}>
          <div className="modal-content glass animate-slide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPublication(null)}>
              <FaTimes />
            </button>
            {selectedPublication.image_url && (
              <img src={selectedPublication.image_url} alt={selectedPublication.title} className="modal-pub-img" />
            )}
            <div className="modal-body">
              <span className="modal-date">{new Date(selectedPublication.created_at).toLocaleDateString()}</span>
              <h2 className="modal-title">{selectedPublication.title}</h2>
              <div className="modal-text">{selectedPublication.content}</div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="modal-overlay photo-lightbox" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content animate-fade" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPhoto(null)}>
              <FaTimes />
            </button>
            <img 
              src={selectedPhoto.direct_url} 
              alt={selectedPhoto.title} 
              className="lightbox-img" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://drive.google.com/uc?export=view&id=${selectedPhoto.drive_id}`;
              }}
            />
            <div className="lightbox-info">
              <h3>{selectedPhoto.title}</h3>
              {selectedPhoto.description && <p>{selectedPhoto.description}</p>}
            </div>
          </div>
        </div>
      )}
      
      {/* Background blur effects */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
    </div>
  );
}
