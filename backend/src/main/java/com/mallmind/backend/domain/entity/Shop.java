package com.mallmind.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    /** Owning retailer account; null for demo/unmanaged seed shops. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User owner;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(length = 1000)
    private String description;

    @Column(length = 255)
    private String logoUrl;

    private LocalTime openingTime;
    private LocalTime closingTime;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "navigation_node_id", nullable = false, unique = true)
    private NavigationNode navigationNode;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
