export type LeadTemperature = 'hot' | 'warm' | 'cold';

export type LeadStatus = 'new' | 'contacted' | 'visit_scheduled' | 'offer_made' | 'closed' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  temperature: LeadTemperature;
  status: LeadStatus;
  budgetMin: number;
  budgetMax: number;
  preferredZone: string;
  notes: string;
  score: number; // 0-100
  lastInteraction: string;
  createdAt: string;
  agentId: string;
  chatHistorySummary?: string;
  chatMessagesCount: number;
}

export interface PropertyDocument {
  id: string;
  name: string;
  sizeKb: number;
  type: 'blueprint' | 'dossier' | 'contract' | 'other';
  url: string;
  uploadedAt: string;
}

export interface PropertySource {
  name: string;
  url: string;
  isOfficialApi: boolean;
  lastUpdated?: string;
}

export interface Property {
  id: string;
  title: string;
  code: string;
  type: 'apartment' | 'house' | 'penthouse' | 'villa' | 'chalet' | 'commercial' | 'land';
  status: 'available' | 'reserved' | 'sold';
  price: number;
  currency?: string;
  location: {
    address: string;
    city: string;
    zone: string;
    province?: string;
    country?: string;
    lat?: number;
    lng?: number;
    googleMapsUrl?: string;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    areaM2: number;
    rooms?: number;
    terraceM2?: number;
    pool: boolean;
    garage: boolean;
    elevator: boolean;
    airConditioning: boolean;
    yearBuilt?: number;
  };
  description: string;
  images: string[];
  documents: PropertyDocument[];
  featured: boolean;
  createdAt: string;
  source?: PropertySource;
}

export interface BotConfig {
  agentId: string;
  agencyName: string;
  agentName: string;
  avatarUrl: string;
  primaryColor: string;
  welcomeMessage: string;
  fallbackMessage: string;
  whatsappNumber: string;
  enableQuickReplies: boolean;
  quickReplies: string[];
  autoScheduleVisits: boolean;
  customSystemPrompt: string;
  tone: 'professional' | 'luxurious' | 'friendly' | 'direct';
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string | number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  timeframe: string;
  sparkline: number[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  recommendedProperties?: Property[];
  visitCard?: {
    propertyId: string;
    propertyTitle: string;
    suggestedTimes: string[];
  };
}

export type AppRoute =
  | 'marketing'
  | 'aria-ai'
  | 'producto'
  | 'soluciones'
  | 'recursos'
  | 'pricing'
  | 'dashboard-metrics'
  | 'dashboard-properties'
  | 'dashboard-leads'
  | 'dashboard-bot-config'
  | 'dashboard-checkout'
  | 'dashboard-profile'
  | 'dashboard-files'
  | 'dashboard-roles'
  | 'dashboard-vault'
  | 'dashboard-integrations'
  | 'embed-preview'
  | 'comparar-manual'
  | 'comparar-crm'
  | 'comparar-chatbots';

export type UserSubscriptionRole =
  | 'admin'
  | 'subscriber_starter'
  | 'subscriber_pro'
  | 'subscriber_custom'
  | 'registered_user'
  | 'unregistered_user';

export interface UserFile {
  id: string;
  userId: string;
  name: string;
  sizeBytes: number;
  type: 'image' | 'pdf' | 'document' | 'other';
  mimeType: string;
  url: string;
  uploadedAt: string;
  storagePath: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: 'es' | 'en' | 'pt';
  notificationsEmail: boolean;
  notificationsWhatsapp: boolean;
  defaultCurrency: 'USD' | 'MXN' | 'COP' | 'ARS' | 'CLP';
}

export interface PaymentLinkConfig {
  planId: string;
  planName: string;
  priceUsd: number;
  customPaymentUrl: string;
  mercadoPagoUrl?: string;
  paypalUrl?: string;
  stripeUrl?: string;
  whatsappPayNumber?: string;
}

export interface Agency {
  id: string;
  name: string;
  plan: 'Starter' | 'Pro Enterprise' | 'Custom';
  logoUrl?: string;
  activeAgentsCount: number;
}
