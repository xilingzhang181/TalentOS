"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MatchItem {
  id: string;
  resumeId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string | null;
  remotePolicy: "remote" | "hybrid" | "onsite" | "unknown";
  matchScore: number;
  matchSummary: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  tags: string[];
  createdAt: string;
  jobUrl?: string;
}

export interface MatchFilters {
  /** Minimum match score (0-100). */
  minScore?: number;
  /** Filter by remote policy. */
  remotePolicy?: "remote" | "hybrid" | "onsite" | "all";
  /** Free-text search (company, title, location). */
  search?: string;
  /** Page number (1-based). */
  page?: number;
  /** Items per page. */
  pageSize?: number;
}

export interface MatchDetail extends MatchItem {
  jobDescription: string;
  explanation: {
    strengths: {
      skill: string;
      evidence: string;
      strength: "strong" | "moderate";
      confidence: number;
    }[];
    gaps: {
      skill: string;
      priority: "必须" | "加分";
      recommendation: string;
      confidence: number;
    }[];
    transferables: {
      from: string;
      to: string;
      confidence: number;
    }[];
  };
  skillMatch: {
    category: string;
    skills: {
      name: string;
      yourLevel: number;
      requiredLevel: number;
      match: "strong" | "partial" | "gap";
    }[];
  }[];
  relatedAnalyses?: { id: string; title: string; score: number }[];
}

interface UseMatchesReturn {
  matches: MatchItem[];
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  hasMore: boolean;
}

/* ------------------------------------------------------------------ */
/*  useMatches                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 12;

export function useMatches(filters: MatchFilters = {}): UseMatchesReturn {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const fetchMatches = useCallback(
    async (page: number, append: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.minScore && filters.minScore > 0)
          params.set("minScore", String(filters.minScore));
        if (filters.remotePolicy && filters.remotePolicy !== "all")
          params.set("remotePolicy", filters.remotePolicy);
        if (filters.search) params.set("search", filters.search);
        params.set("page", String(page));
        params.set("pageSize", String(filters.pageSize ?? PAGE_SIZE));

        const res = await fetch(`/api/matches?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Failed to load matches (${res.status})`);
        }

        const data: { matches: MatchItem[]; total: number } = await res.json();

        if (append) {
          setMatches((prev) => {
            const updated = [...prev, ...data.matches];
            setHasMore(updated.length < data.total);
            return updated;
          });
        } else {
          setMatches(data.matches);
          setHasMore(data.matches.length < data.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [filters.minScore, filters.remotePolicy, filters.search, filters.pageSize],
  );

  // Reset when filters change (except page)
  useEffect(() => {
    pageRef.current = 1;
    setMatches([]);
    setHasMore(true);
    fetchMatches(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minScore, filters.remotePolicy, filters.search, filters.pageSize]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    pageRef.current += 1;
    fetchMatches(pageRef.current, true);
  }, [fetchMatches, isLoading, hasMore]);

  return { matches, isLoading, error, loadMore, hasMore };
}

/* ------------------------------------------------------------------ */
/*  useMatchDetail                                                     */
/* ------------------------------------------------------------------ */

interface UseMatchDetailReturn {
  match: MatchDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useMatchDetail(id: string | null): UseMatchDetailReturn {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/matches/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Failed to load match (${res.status})`);
        }
        const data: MatchDetail = await res.json();
        if (!cancelled) setMatch(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchDetail();
    return () => { cancelled = true; };
  }, [id]);

  return { match, isLoading, error };
}
