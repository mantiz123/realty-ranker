export type Lang = "es" | "en";

export const LANGS: Lang[] = ["es", "en"];

export function isLang(v: string | undefined): v is Lang {
  return v === "es" || v === "en";
}

export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const nav = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean);
  return nav.some((l) => l.toLowerCase().startsWith("es")) ? "es" : "en";
}

import { esVideo, enVideo } from "./i18n-video";

type Dict = Record<string, string>;

const es: Dict = {
  "nav.states": "Estados",
  "nav.upload": "Subir propiedad",
  "nav.panel": "Panel",
  "nav.login": "Entrar",
  "footer.tagline": "RealtorBoard — marketplace de agentes inmobiliarios por estado.",

  "home.badge": "Ranking por estado",
  "home.title": "El marketplace de agentes inmobiliarios de EE.UU.",
  "home.subtitle":
    "Elige un estado para ver el ranking de realtors y la valla de video con las inmobiliarias destacadas.",
  "home.search": "Buscar estado...",
  "home.states": "Estados",
  "home.active": "activos",
  "home.none": "Sin realtors",
  "home.meta.title": "RealtorBoard — Agentes inmobiliarios por estado de EE.UU.",
  "home.meta.desc":
    "Marketplace de agentes inmobiliarios organizado por estado: ranking de realtors y valla de video por cada estado de EE.UU.",

  "state.eyebrow": "Estado de EE.UU.",
  "state.ranking": "Ranking de realtors",
  "state.billboard": "Valla de video",
  "state.col.agent": "Agente",
  "state.col.clicks": "Clics",
  "state.col.amount": "Monto pagado",
  "state.col.action": "Acción",
  "state.loading": "Cargando ranking...",
  "state.empty": "Todavía no hay realtors activos en",
  "state.outbid": "Superar posición",
  "state.noVideos": "Aún no hay videos en la valla de este estado.",
  "state.videoOf": "Video {n} de {total}",
  "state.next": "Siguiente",
  "state.notFound": "Estado no encontrado",
  "state.allStates": "Ver todos los estados",
  "state.loadError": "No se pudo cargar el estado.",

  "upload.title": "Subir propiedad",
  "upload.subtitle":
    "Sube entre 5 y 15 fotos. Generaremos un video para la valla de tu estado.",
  "upload.photos": "Fotos de la propiedad",
  "upload.count": "{n} de 20 (mínimo 5)",
  "upload.drop": "Arrastra o selecciona tus fotos",
  "upload.formats": "JPG o PNG",
  "upload.remove": "Quitar foto",
  "upload.photoAlt": "Foto {n} de la propiedad",
  "upload.email": "Tu email",
  "upload.emailPlaceholder": "agente@inmobiliaria.com",
  "upload.generating": "Generando video...",
  "upload.notify": "Te avisaremos a {email} cuando esté listo.",
  "upload.processing": "procesando",
  "upload.submit": "Generar video",
  "upload.meta.title": "Subir propiedad y generar video | RealtorBoard",
  "upload.meta.desc":
    "Sube de 5 a 15 fotos de tu propiedad y genera un video para la valla de tu estado.",

  "login.title": "Entrar",
  "login.desc": "Te enviamos un enlace mágico a tu email. No necesitas contraseña.",
  "login.check": "Revisa tu bandeja de entrada",
  "login.sentTo": "Enviamos un enlace de acceso a",
  "login.other": "Usar otro email",
  "login.email": "Email",
  "login.send": "Enviar enlace mágico",
  "login.sending": "Enviando...",
  "login.meta.title": "Entrar con enlace mágico | RealtorBoard",
  "login.meta.desc":
    "Accede a tu panel de agente inmobiliario con un enlace mágico enviado a tu email.",

  "panel.title": "Panel",
  "panel.signout": "Cerrar sesión",
  "panel.loading": "Cargando tu información...",
  "panel.noProfile": "Todavía no tienes perfil de realtor",
  "panel.noProfileDesc":
    "Cuando tu cuenta de agente esté registrada, aquí verás tu ranking, tus videos y tu slot en la valla.",
  "panel.tab.ranking": "Ranking",
  "panel.tab.videos": "Mis videos",
  "panel.tab.billboard": "Mi valla",
  "panel.position": "Posición en",
  "panel.byAmount": "Ranking por monto pagado",
  "panel.amount": "Monto pagado",
  "panel.bids": "puja(s) registradas",
  "panel.noVideos": "Aún no has generado videos.",
  "panel.noSlot": "No tienes un slot activo en la valla.",
  "panel.days": "días",
  "panel.noEnd": "Sin fecha fin",
  "panel.since": "Desde",
  "panel.clicks": "clics",
  "panel.meta.title": "Panel del realtor | RealtorBoard",
  "panel.meta.desc":
    "Consulta tu posición en el ranking, tus videos generados y tu slot en la valla.",
};

const en: Dict = {
  "nav.states": "States",
  "nav.upload": "Upload listing",
  "nav.panel": "Dashboard",
  "nav.login": "Sign in",
  "footer.tagline": "RealtorBoard — the state-by-state marketplace for real estate agents.",

  "home.badge": "Statewide ranking",
  "home.title": "The marketplace for U.S. real estate agents.",
  "home.subtitle":
    "Choose a state to see the realtor ranking and the video billboard featuring its leading brokerages.",
  "home.search": "Search a state...",
  "home.states": "States",
  "home.active": "active",
  "home.none": "No realtors",
  "home.meta.title": "RealtorBoard — Real estate agents by U.S. state",
  "home.meta.desc":
    "A marketplace of real estate agents organized by state: realtor rankings and a video billboard for every U.S. state.",

  "state.eyebrow": "U.S. state",
  "state.ranking": "Realtor ranking",
  "state.billboard": "Video billboard",
  "state.col.agent": "Agent",
  "state.col.clicks": "Clicks",
  "state.col.amount": "Amount paid",
  "state.col.action": "Action",
  "state.loading": "Loading ranking...",
  "state.empty": "There are no active realtors yet in",
  "state.outbid": "Outbid position",
  "state.noVideos": "No videos on this state's billboard yet.",
  "state.videoOf": "Video {n} of {total}",
  "state.next": "Next",
  "state.notFound": "State not found",
  "state.allStates": "See all states",
  "state.loadError": "This state could not be loaded.",

  "upload.title": "Upload listing",
  "upload.subtitle": "Upload 5 to 15 photos. We'll generate a video for your state's billboard.",
  "upload.photos": "Listing photos",
  "upload.count": "{n} of 20 (minimum 5)",
  "upload.drop": "Drag or select your photos",
  "upload.formats": "JPG or PNG",
  "upload.remove": "Remove photo",
  "upload.photoAlt": "Listing photo {n}",
  "upload.email": "Your email",
  "upload.emailPlaceholder": "agent@brokerage.com",
  "upload.generating": "Generating video...",
  "upload.notify": "We'll notify {email} when it's ready.",
  "upload.processing": "processing",
  "upload.submit": "Generate video",
  "upload.meta.title": "Upload a listing and generate a video | RealtorBoard",
  "upload.meta.desc":
    "Upload 5 to 15 photos of your listing and generate a video for your state's billboard.",

  "login.title": "Sign in",
  "login.desc": "We'll email you a magic link. No password required.",
  "login.check": "Check your inbox",
  "login.sentTo": "We sent a sign-in link to",
  "login.other": "Use another email",
  "login.email": "Email",
  "login.send": "Send magic link",
  "login.sending": "Sending...",
  "login.meta.title": "Sign in with a magic link | RealtorBoard",
  "login.meta.desc": "Access your agent dashboard with a magic link sent to your email.",

  "panel.title": "Dashboard",
  "panel.signout": "Sign out",
  "panel.loading": "Loading your information...",
  "panel.noProfile": "You don't have a realtor profile yet",
  "panel.noProfileDesc":
    "Once your agent account is registered, your ranking, videos and billboard slot appear here.",
  "panel.tab.ranking": "Ranking",
  "panel.tab.videos": "My videos",
  "panel.tab.billboard": "My billboard",
  "panel.position": "Position in",
  "panel.byAmount": "Ranked by amount paid",
  "panel.amount": "Amount paid",
  "panel.bids": "bid(s) recorded",
  "panel.noVideos": "You haven't generated any videos yet.",
  "panel.noSlot": "You don't have an active billboard slot.",
  "panel.days": "days",
  "panel.noEnd": "No end date",
  "panel.since": "Since",
  "panel.clicks": "clicks",
  "panel.meta.title": "Realtor dashboard | RealtorBoard",
  "panel.meta.desc": "Check your ranking position, generated videos and billboard slot.",
};

const DICTS: Record<Lang, Dict> = { es: { ...es, ...esVideo }, en: { ...en, ...enVideo } };

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let value = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
  }
  return value;
}

export function makeT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);
}
