package com.mallmind.backend.controller;

import com.mallmind.backend.dto.admin.AnalyticsSummaryResponse;
import com.mallmind.backend.dto.admin.DailyCountResponse;
import com.mallmind.backend.dto.admin.DailyRevenueResponse;
import com.mallmind.backend.dto.admin.TermCountResponse;
import com.mallmind.backend.dto.admin.TopProductResponse;
import com.mallmind.backend.dto.admin.DemandForecastResponse;
import com.mallmind.backend.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Part 8: admin analytics dashboard API. ADMIN-only (enforced both here
 * and in SecurityConfig's /api/admin/** rule) and aggregate-only -- never
 * exposes a single visitor's search history (Part 17). */
@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryResponse> summary() {
        return ResponseEntity.ok(adminAnalyticsService.summary());
    }

    @GetMapping("/search-terms/top")
    public ResponseEntity<List<TermCountResponse>> topSearchTerms(
            @RequestParam(defaultValue = "PRODUCT_SEARCH") String searchType,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminAnalyticsService.topSearchTerms(searchType, limit));
    }

    @GetMapping("/search-terms/zero-result")
    public ResponseEntity<List<TermCountResponse>> topZeroResultTerms(
            @RequestParam(defaultValue = "PRODUCT_SEARCH") String searchType,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminAnalyticsService.topZeroResultTerms(searchType, limit));
    }

    @GetMapping("/categories/top")
    public ResponseEntity<List<TermCountResponse>> topCategories(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminAnalyticsService.topCategories(limit));
    }

    @GetMapping("/products/top")
    public ResponseEntity<List<TopProductResponse>> topProducts(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminAnalyticsService.topProducts(limit));
    }

    @GetMapping("/search-volume")
    public ResponseEntity<List<DailyCountResponse>> searchVolume(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminAnalyticsService.searchVolume(days));
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<DailyRevenueResponse>> revenue(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminAnalyticsService.revenue(days));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> categories() {
        return ResponseEntity.ok(adminAnalyticsService.categoryNames());
    }

    /** Part 9: Phase 5's demand-prediction model, wired in for real. */
    @GetMapping("/demand/{category}/predict")
    public ResponseEntity<DemandForecastResponse> demandForecast(@PathVariable String category) {
        return ResponseEntity.ok(adminAnalyticsService.demandForecast(category));
    }
}
