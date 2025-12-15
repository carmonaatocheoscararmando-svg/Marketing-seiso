import { AppDatabase, AdCampaign, SavedCarousel, SavedVideoProject, CalendarEvent, ChatMessage } from '../types';

const DB_KEY = 'seiso_marketing_db_v1';

const initialDB: AppDatabase = {
  ads: [],
  carousels: [],
  videos: [],
  planner: [],
  chatHistory: [
    { id: '0', sender: 'ai', text: '¡Hola! Soy tu Planner Estratégico. Veo que tienes campañas activas. ¿En qué trabajamos hoy?', timestamp: new Date() }
  ]
};

// Cargar Base de Datos (Simulando lectura de archivo JSON al inicio)
export const getDatabase = (): AppDatabase => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) return initialDB;
  try {
    return JSON.parse(stored, (key, value) => {
        // Restaurar fechas
        if (key === 'date' || key === 'createdAt' || key === 'timestamp') return new Date(value);
        return value;
    });
  } catch (e) {
    console.error("Error al leer la base de datos", e);
    return initialDB;
  }
};

// Guardar todo el estado
export const saveDatabase = (db: AppDatabase) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Helpers para guardar ítems específicos
export const saveAd = (ad: AdCampaign) => {
  const db = getDatabase();
  db.ads.push(ad);
  saveDatabase(db);
};

export const saveCarousel = (carousel: SavedCarousel) => {
  const db = getDatabase();
  db.carousels.push(carousel);
  saveDatabase(db);
};

export const saveVideoProject = (video: SavedVideoProject) => {
  const db = getDatabase();
  db.videos.push(video);
  saveDatabase(db);
};

export const savePlannerEvent = (event: CalendarEvent) => {
  const db = getDatabase();
  // Evitar duplicados simples por ID
  const exists = db.planner.find(e => e.id === event.id);
  if (!exists) {
      db.planner.push(event);
  } else {
      db.planner = db.planner.map(e => e.id === event.id ? event : e);
  }
  saveDatabase(db);
};

export const saveChatHistory = (messages: ChatMessage[]) => {
    const db = getDatabase();
    db.chatHistory = messages;
    saveDatabase(db);
};

// Helpers para Descarga (Download to PC)
export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};