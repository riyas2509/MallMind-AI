package com.mallmind.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * One logged search (shop or product). Written asynchronously off the
 * request thread (see AnalyticsLogService) so logging never slows down a
 * visitor's search response, and aggregated later for the admin analytics
 * dashboard (Part 8) — never exposed per-visitor.
 */
@Entity
@Table(name = "search_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String searchType; // SHOP_SEARCH | PRODUCT_SEARCH

    @Column(nullable = false, length = 255)
    private String queryText;

    @Column(length = 100)
    private String matchedCategory;

    @Column(nullable = false)
    private int resultCount;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
