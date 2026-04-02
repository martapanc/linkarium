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

export interface DbLink {
  id: string;
  list_id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  domain: string | null;
  position: number;
  created_at: string;
  scraped_at: string | null;
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
