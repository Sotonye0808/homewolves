interface CrmClient {
    id: string;
    agentId: string;
    buyerId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    agent?: import('@prisma/client').User;
    buyer?: import('@prisma/client').User;
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
    author?: import('@prisma/client').User;
}
interface RatingEntry {
    id: string;
    clientId: string;
    score: number;
    review?: string;
    authorId: string;
    createdAt: string;
    author?: import('@prisma/client').User;
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
    listing?: import('@prisma/client').Listing & {
        media?: import('@prisma/client').Media[];
    };
    author?: import('@prisma/client').User;
}
interface DashboardStats {
    activeClients: number;
    newThisMonth: number;
    pendingClients: number;
    todayInspections: number;
    unreadMessages: number;
}
//# sourceMappingURL=crm.types.d.ts.map