export const translations = {
  es: {
    navContact: "Contacto",
    navWhoIs: "¿Quién es ZetaH?",
    navSocials: "Redes Sociales",
    navAdmin: "Panel Admin",
    navPublic: "Vista Pública",
    
    heroHire: "Contratar",
    heroViewWork: "Ver Portafolio",
    
    badgeNotice: "AVISOS",
    sectionPublications: "PUBLICACIONES",
    sectionPortfolio: "PORTFOLIO",
    sectionZetahGame: "ZETAH GAME",
    sectionNotices: "AVISOS",
    
    tabVideos: "AUDIOVISUALES",
    tabPhotos: "FOTOGRAFÍAS",
    
    emptyVideos: "No hay videos subidos aún.",
    emptyPhotos: "No hay fotografías subidas aún.",
    zoomImage: "Ampliar Imagen",
    readMore: "Leer más",
    
    drawerClose: "Cerrar",
    drawerWhoTitle: "¿Quién es ZetaH?",
    drawerWhoText1: "Mi nombre es Harol Joshue, artísticamente conocido como ZetaH. Soy de Ibarra, Ecuador.",
    drawerWhoText2: "Actualmente estudio Ingeniería en Software y complemento mi formación tecnológica con una profunda pasión por el área de producción audiovisual: edición de video, dirección de fotografía y producción cinematográfica de forma independiente.",
    drawerWhoText3: "Este espacio está pensado para recopilar mis proyectos personales, conectar con clientes y exhibir mi portafolio digital.",
    
    drawerContactTitle: "Contacto",
    drawerContactText: "Si deseas colaborar en un proyecto audiovisual, contratar una sesión fotográfica o consultarme sobre desarrollos de software, contáctame por cualquiera de estos medios:",
    drawerContactQr: "Escanea para añadir a contactos o abrir en tu dispositivo",
    drawerWhatsappDirect: "WhatsApp Directo",
    
    drawerSocialsTitle: "Redes Sociales",
    drawerSocialsText: "Sigue de cerca mis publicaciones cotidianas, detrás de cámaras y trabajos artísticos en mis redes oficiales:",
    
    footerLocation: "Ecuador, Imbabura, Ibarra",
    
    // Light/Dark and Language UI descriptions
    langToggle: "EN",
    themeLight: "Modo Claro",
    themeDark: "Modo Oscuro",
    
    // --- NEWSLETTER ---
    newsTitle: "Quiero más información",
    newsSubtitle: "Suscríbete para recibir mi catálogo de tarifas, trabajos recientes y ofertas exclusivas de producción directo en tu bandeja de entrada.",
    newsPlaceholder: "Escribe tu correo electrónico aquí...",
    newsButton: "Suscribirse",
    newsSuccess: "¡Suscrito con éxito! Te he enviado un correo con mi información y contactos.",
    newsError: "Hubo un error al registrar tu suscripción. Intenta nuevamente.",
    publishedAtLabel: "Publicado el",
    registeredAtLabel: "Registrado el",
    videoLinkLabel: "Enlace del Video",
    photoLinkLabel: "Enlace de la Foto"
  },
  en: {
    navContact: "Contact",
    navWhoIs: "Who is ZetaH?",
    navSocials: "Social Media",
    navAdmin: "Admin Panel",
    navPublic: "Public View",
    
    heroHire: "Hire Me",
    heroViewWork: "View Portfolio",
    
    badgeNotice: "NOTICES",
    sectionPublications: "PUBLICATIONS",
    sectionPortfolio: "PORTFOLIO",
    sectionZetahGame: "ZETAH GAME",
    sectionNotices: "NOTICES",
    
    tabVideos: "AUDIOVISUALS",
    tabPhotos: "PHOTOGRAPHS",
    
    emptyVideos: "No videos uploaded yet.",
    emptyPhotos: "No photographs uploaded yet.",
    zoomImage: "Zoom Image",
    readMore: "Read more",
    
    drawerClose: "Close",
    drawerWhoTitle: "Who is ZetaH?",
    drawerWhoText1: "My name is Harol Joshue, artistically known as ZetaH. I am from Ibarra, Ecuador.",
    drawerWhoText2: "I am currently studying Software Engineering, and I complement my technology education with a deep passion for the audiovisual production field: video editing, photography direction, and independent filmmaking.",
    drawerWhoText3: "This space is designed to compile my personal projects, connect with clients, and showcase my digital portfolio.",
    
    drawerContactTitle: "Contact Info",
    drawerContactText: "If you want to collaborate on an audiovisual project, hire a photo session, or consult me about software development, feel free to contact me:",
    drawerContactQr: "Scan to add to contacts or open on your device",
    drawerWhatsappDirect: "Direct WhatsApp",
    
    drawerSocialsTitle: "Social Media",
    drawerSocialsText: "Follow my daily publications, behind the scenes, and artistic works closely on my official social networks:",
    
    footerLocation: "Ecuador, Imbabura, Ibarra",
    
    // Light/Dark and Language UI descriptions
    langToggle: "ES",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    
    // --- NEWSLETTER ---
    newsTitle: "Request More Information",
    newsSubtitle: "Subscribe to receive my rate catalog, recent works, and exclusive production offers directly in your inbox.",
    newsPlaceholder: "Enter your email address here...",
    newsButton: "Subscribe",
    newsSuccess: "Subscribed successfully! I have sent an email with my details and contact links.",
    newsError: "There was an error registering your email. Please try again.",
    publishedAtLabel: "Published on",
    registeredAtLabel: "Registered on",
    videoLinkLabel: "Video Link",
    photoLinkLabel: "Photo Link"
  }
};

export type Language = 'es' | 'en';
export type TranslationKey = keyof typeof translations.es;
