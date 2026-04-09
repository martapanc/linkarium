// ============================================================
// Database types (mirrors Supabase schema)
// ============================================================

export interface DbList {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export type LinkType = "url" | "paper";

export interface DbLink {
  id: string;
  list_id: string;
  url: string | null;
  link_type: LinkType;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  domain: string | null;
  position: number;
  created_at: string;
  scraped_at: string | null;
  // Paper-specific fields
  doi: string | null;
  citation_authors: string | null;
  citation_year: number | null;
  citation_venue: string | null;
  pdf_url: string | null;
}

// ============================================================
// API request/response types
// ============================================================

export interface CreateListRequest {
  title?: string;
  description?: string;
  urls?: string[];
}

export interface CreateListResponse {
  list: DbList;
  links: DbLink[];
}

export interface AddLinksRequest {
  listId: string;
  urls: string[];
}

export interface PaperInput {
  title: string;
  doi?: string;
  citation_authors?: string;
  citation_year?: number;
  citation_venue?: string;
  description?: string;
  pdf_url?: string;
}

export interface ScrapeResult {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  domain: string;
}

// ============================================================
// UI types
// ============================================================

export type SortField = "position" | "created_at" | "title" | "domain";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface FilterConfig {
  search: string;
  domain: string | null;
}
