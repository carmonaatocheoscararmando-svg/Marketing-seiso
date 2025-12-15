
export type ViewState = 'ads' | 'carousel' | 'video' | 'planner' | 'studio';

export enum StrategyAngle {
  PAIN_VS_SOLUTION = "Dolor vs Solución",
  EXCLUSIVITY = "Exclusividad",
  SCARCITY = "Escasez",
  SOCIAL_PROOF = "Prueba Social",
  URGENCY = "Urgencia",
  CUSTOM = "Personalizado"
}

export interface AdCampaign {
  id: string;
  productName: string;
  price: string;
  description: string;
  strategy: StrategyAngle;
  generatedCopy: string;
  generatedImage: string; // Base64 or URL
  createdAt: Date;
}

export interface SavedCarousel {
  id: string;
  topic: string;
  slides: CarouselSlide[];
  sunoPrompt: string;
  createdAt: Date;
}

export interface SavedVideoProject {
  id: string;
  productName: string;
  segments: VideoSegment[];
  sunoPrompt: string;
  createdAt: Date;
}

export interface CarouselSlide {
  id: number;
  title: string; // Internal title for logic
  content: string; // Description/Context
  overlayText: string; // NEW: The short text that goes ON the image
  imagePrompt: string;
  imageUrl: string;
  type: 'hook' | 'solution' | 'edu1' | 'edu2' | 'cta';
}

export interface VideoSegment {
  id: number;
  timeRange: string; // e.g., "00:00 - 00:06"
  visualDescription: string;
  cameraMovement: string;
  lighting: string;
  grokPrompt: string; // For Video Generation
  imagePrompt: string; // NEW: For Static Image Generation (Start Frame)
  imageUrl?: string; // NEW: The generated static image
  referenceImage: string; // Legacy/Fallback
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: 'idea' | 'production' | 'scheduled' | 'published';
  type: ViewState;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface AppDatabase {
  ads: AdCampaign[];
  carousels: SavedCarousel[];
  videos: SavedVideoProject[];
  planner: CalendarEvent[];
  chatHistory: ChatMessage[];
}