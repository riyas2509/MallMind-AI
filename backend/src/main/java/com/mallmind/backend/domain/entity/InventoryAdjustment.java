package com.mallmind.backend.domain.entity;

import com.mallmind.backend.domain.enums.InventoryAdjustmentReason;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "inventory_adjustments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 150)
    private String productNameSnapshot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false, length = 150)
    private String shopNameSnapshot;

    @Column(nullable = false)
    private int oldStock;

    @Column(nullable = false)
    private int newStock;

    @Column(nullable = false)
    private int changeQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private InventoryAdjustmentReason reason;

    @Column(nullable = false, length = 180)
    private String actorEmail;

    @Column(nullable = false, length = 50)
    private String actorRole;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
