interface CrmClient {
  id: string;
  agentId: string;
  buyerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  agent?: Record<string, unknown>;
  buyer?: Record<string, unknown>;
  notes?: NoteEntry[];
  ratings?: RatingEntry[];
  inspections?: InspectionEntry[];
}

interface NoteEntry {
  id: string;
  clientId: string;
  content: string;
  authorId: string;
  createdAt: string;
  author?: Record<string, unknown>;
}

interface RatingEntry {
  id: string;
  clientId: string;
  score: number;
  review?: string;
  authorId: string;
  createdAt: string;
  author?: Record<string, unknown>;
}

interface InspectionEntry {
  id: string;
  clientId: string;
  listingId: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  client?: CrmClient;
  listing?: Record<string, unknown>;
  author?: Record<string, unknown>;
}

interface DashboardStats {
  activeClients: number;
  newThisMonth: number;
  pendingClients: number;
  todayInspections: number;
  unreadMessages: number;
}
