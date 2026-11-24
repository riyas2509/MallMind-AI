package com.mallmind.backend.domain.contract;

import java.util.List;

/**
 * OOP interface requirement (Part 6) and the seam where Phase 5's trained
 * content-based recommendation model plugs in (via the Python model-service
 * REST API — see Part 3.3/Part 10). Until that phase lands, implementations
 * must fall back to a transparent, non-ML baseline (e.g. popularity or
 * category match) rather than fabricate a "recommendation".
 */
public interface RecommendationProvider<TContext, TResult> {
    List<TResult> recommend(TContext context, int maxResults);
}
