// ─── Entity domain types for sentra-ui ────────────────────────────────────────
//
// Adapted from app/src/types/entities/entities.ts and the bridge API contract.
// These types are used across EntityCard, EntityDetailView, EntitySplitLayout,
// EntityNetworkGraph, ContextBanner, ContextPanel, ContextPill, and
// EntityRelatedIntelligence.

export type TSeverityLevel = "critical" | "high" | "medium" | "low" | "unknown";
export type TEntityType =
  | "government"
  | "individual"
  | "media"
  | "institution"
  | "state"
  | "organization"
  | "event"
  | "venue"
  | "persona"
  | "person"
  | "coalition";

export type TSentiment = "positive" | "negative" | "neutral" | "unknown";
export type TEntityRole = "driver" | "subject" | "observer" | "actor";

/** Lightweight entity as returned from bridge GET /api/entities */
export interface EntitySummary {
  id: string;
  slug: string;
  name_en: string;
  name_ar?: string | null;
  type: TEntityType;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  role?: TEntityRole;
  sentiment?: TSentiment;
  severity?: TSeverityLevel;
  risk_score?: number | null;
  risk_level?: string | null;
  mention_count?: number | null;
  last_activity?: string;
  image_url?: string | null;
  is_focused?: boolean;
  source_plugin_id?: string | null;
  monitoring_keywords?: string[];
  location?: string | null;
  industry?: string | null;
  // Enrichment
  abstract_en?: string | null;
  abstract_ar?: string | null;
  wiki_url_en?: string | null;
  wiki_url_ar?: string | null;
  tasks_count?: number;
  events_count?: number;
  network_edges_count?: number;
  intelligence_records_count?: number;
  sources_count?: number;
}

/** Context types that can be passed into entity detail pages */
export type TContextType = "country" | "narrative" | "alert" | "entity";

export interface EntityContext {
  type: TContextType;
  ref: string;
}

/** Network node/edge shapes for the graph renderer seam */
export interface NetworkNode {
  id: string;
  slug: string;
  name_en: string;
  name_ar?: string | null;
  type: TEntityType;
  sentiment?: TSentiment | null;
  image_url?: string | null;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  relation?: string | null;
}

export interface EntityNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/** Core AI analysis result (serialised bridge response) */
export interface InfluenceMetrics {
  reach: number;
  mediaPresence: number;
  policyImpact: number;
  sentimentScore: number;
}

export interface KeyFact {
  label?: string;
  label_en?: string;
  label_ar?: string;
  value?: string;
  value_en?: string;
  value_ar?: string;
  context?: string;
  context_en?: string;
  context_ar?: string;
}

export interface NetworkConnection {
  name?: string;
  name_en?: string;
  name_ar?: string;
  slug?: string;
  targetSlug?: string;
  id?: string;
  context?: string;
  context_en?: string;
  context_ar?: string;
  confidence?: number;
}

export interface EntityCoreAnalysis {
  profileSummary: string;
  keyFacts: KeyFact[];
  networkConnections: NetworkConnection[];
  influenceMetrics: InfluenceMetrics;
  clientRelevance?: string;
  watchRecommendations: string[];
  citations: string[];
  generatedAt: string | null;
  isStale: boolean;
  staleMinutes: number;
}

export interface RecentActivity {
  event: string;
  date: string;
  source?: string;
  sentiment?: TSentiment | null;
}

export interface ContextRecommendation {
  title: string;
  description?: string;
  priority?: string;
}

export interface EntityContextAnalysis {
  whyRelevant: string;
  contextSummary: string;
  recentActivityInContext: RecentActivity[];
  contextConnections: NetworkConnection[];
  contextRecommendations: ContextRecommendation[];
  citations: string[];
  generatedAt: string | null;
}

/** Related intelligence content items */
export interface RelatedContentItem {
  id: string;
  content_id: string;
  content_type: string;
  relationship?: string | null;
  confidence?: number | null;
  detected_at?: string | null;
  title?: string;
  slug?: string;
}

export interface CoOccurringEntity {
  id: string;
  slug: string;
  name_en: string;
  name_ar?: string | null;
  type: TEntityType;
  image_url?: string | null;
  is_focused: boolean;
  shared_content_count: number;
}

/** Type profile (capability-specific entity profile) */
export interface EntityTypeProfile {
  id: string;
  capability_slug: string;
  label_en: string;
  label_ar?: string | null;
  summary_en?: string | null;
  summary_ar?: string | null;
  fields: Record<string, unknown>;
}
