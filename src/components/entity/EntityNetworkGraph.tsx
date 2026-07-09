'use client'

// ─── EntityNetworkGraph ────────────────────────────────────────────────────────
//
// Adapted from app/src/components/entity/EntityNetworkGraph.tsx
//
// GRAPH LIBRARY DECISION — SEAM PATTERN
// ──────────────────────────────────────
// The source uses @react-sigma/core + graphology + sigma + graphology-layout-forceatlas2.
// These are heavy bundles (~600 KB minified) and not in sentra-ui's package.json.
// Adding them would inflate every product that imports sentra-ui.
//
// Decision: use a RENDER SEAM — the chrome (container, loading, error, empty
// states, legend, stats pill, hint text) is fully implemented here. The actual
// force-directed canvas is injected by the host via the `renderGraph` prop.
//
// Storybook: stories use a mock renderGraph that renders a placeholder SVG.
// The app uses renderGraph={() => <EntityNetworkGraphCanvas slug={slug} />}
// where EntityNetworkGraphCanvas is the existing GraphCanvas component from the
// original EntityNetworkGraph.tsx (unchanged in app/).
//
// This keeps sentra-ui bundle lean and the chrome portable to any host product.
//
// Changes vs source:
//   - useLanguage → language / isRTL props
//   - useEntityNetwork hook removed; data injected as props (network + status)
//   - Graph canvas replaced with renderGraph seam
//   - @/components/ui/* → ../ui/*
//   - "use client" directive removed

import { Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Skeleton } from "@togo-framework/ui-core";
import type { EntityNetwork } from "./types";

// ── Sentiment legend colours ───────────────────────────────────────────────────
// Matches the SENTIMENT_COLORS palette in the original component so the legend
// stays visually consistent even when the graph canvas is injected from outside.
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#34d399", // emerald-400
  neutral: "#94a3b8",  // slate-400
  negative: "#f87171", // red-400
};

const SENTIMENT_LEGEND = [
  { key: "positive", en: "Positive", ar: "إيجابي" },
  { key: "neutral",  en: "Neutral",  ar: "محايد"  },
  { key: "negative", en: "Negative", ar: "سلبي"   },
] as const;

export interface EntityNetworkGraphProps {
  /**
   * SEAM — host renders the actual graph canvas inside this callback.
   * Receives the network data so the canvas can build its own graphology Graph.
   * If omitted, a "graph unavailable" placeholder is shown.
   *
   * Example (app side):
   *   renderGraph={(network) => <EntityNetworkGraphCanvas slug={slug} network={network} />}
   */
  renderGraph?: (network: EntityNetwork) => React.ReactNode;
  /** Network data fetched from GET /api/entities/{slug}/network */
  network: EntityNetwork | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  language?: "en" | "ar";
  isRTL?: boolean;
}

const EntityNetworkGraph = ({
  renderGraph,
  network,
  isLoading,
  isError,
  onRetry,
  language = "en",
  isRTL = false,
}: EntityNetworkGraphProps) => {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[480px] gap-3 text-muted-foreground"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-xs">
          {language === "ar"
            ? "جارٍ تحميل شبكة الجهة..."
            : "Loading entity network..."}
        </span>
        <div className="w-full max-w-md space-y-2 px-4">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
          <Skeleton className="h-3 w-4/6 rounded" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[480px] gap-3"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <AlertCircle className="w-8 h-8 text-destructive/70" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {language === "ar"
              ? "تعذّر تحميل شبكة الجهة"
              : "Could not load entity network"}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "ar"
              ? "حدث خطأ أثناء جلب البيانات."
              : "An error occurred while fetching data."}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-fast ease-standard mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === "ar" ? "إعادة المحاولة" : "Try again"}
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!network || network.nodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[480px] gap-3 px-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="19" cy="19" r="2" />
            <line x1="7" y1="12" x2="17" y2="6" />
            <line x1="7" y1="12" x2="17" y2="18" />
          </svg>
        </div>
        <div className="text-center space-y-1 max-w-md">
          <p className="text-sm font-medium text-foreground">
            {language === "ar"
              ? "لا توجد علاقات مسجّلة لهذه الجهة"
              : "No relationships recorded for this entity"}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "ar"
              ? "ستظهر العلاقات هنا عند اكتشافها من خلال تحليل المحتوى."
              : "Relationships will appear here as content analysis discovers them."}
          </p>
        </div>
      </div>
    );
  }

  // ── Graph chrome + seam ────────────────────────────────────────────────────
  // dir="ltr" on the outer container: Sigma canvas always uses LTR coordinates.
  // RTL text rendering is the graph host's responsibility.
  return (
    <div
      className="relative overflow-hidden w-full bg-background"
      style={{ height: 480, minHeight: 480 }}
      dir="ltr"
    >
      {/* Injected graph canvas or fallback placeholder */}
      {renderGraph ? (
        renderGraph(network)
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 text-xs text-muted-foreground">
          {language === "ar"
            ? "عارض الرسم البياني غير متاح"
            : "Graph renderer not provided"}
        </div>
      )}

      {/* Stats pill — top-end */}
      <div
        className="absolute top-3 end-3 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border/50 rounded-full px-3 py-1.5 text-[10px] text-muted-foreground font-medium"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <span>
          {network.nodes.length} {language === "ar" ? "جهة" : "entities"}
        </span>
        <span className="opacity-40">·</span>
        <span>
          {network.edges.length} {language === "ar" ? "رابط" : "edges"}
        </span>
      </div>

      {/* Drag hint — top-start */}
      <div
        className="absolute top-3 start-3 z-10 text-[10px] text-muted-foreground/60"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {isRTL
          ? "اسحب العقد · مرّر للتكبير · انقر للانتقال"
          : "Drag · Scroll to zoom · Click to navigate"}
      </div>

      {/* Sentiment legend — bottom-end */}
      <div
        className="absolute bottom-3 end-3 z-20 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/30 rounded-full px-3 py-1.5"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {SENTIMENT_LEGEND.map(({ key, en, ar }) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: SENTIMENT_COLORS[key] }}
            />
            <span className="text-[10px] text-muted-foreground">
              {language === "ar" ? ar : en}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

EntityNetworkGraph.displayName = "EntityNetworkGraph";

export { EntityNetworkGraph };