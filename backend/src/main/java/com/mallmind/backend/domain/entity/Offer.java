package com.mallmind.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * A retailer-managed promotional offer on one shop (Part 4, Module 2 /
 * Part 8). Display-only in this phase: it does not automatically change
 * Product.discountPrice -- a retailer still sets product discount prices
 * directly; this is the "X% off at <shop>" banner/metadata layer, and
 * Part 12 requires disclosure, so `sponsored` defaults to false and must
 * be explicitly set true for a paid placement.
 */
@Entity
@Table(name = "offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    private LocalDate validFrom;
    private LocalDate validTo;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    /** Part 12: sponsored placements must be disclosed, never silently mixed in with organic results. */
    @Builder.Default
    @Column(nullable = false)
    private boolean sponsored = false;
}
