package com.mallmind.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "floors", uniqueConstraints = @UniqueConstraint(columnNames = {"mall_id", "floor_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mall_id", nullable = false)
    private Mall mall;

    /** 0 = ground floor, 1 = first floor, 2 = second floor, etc. */
    @Column(name = "floor_number", nullable = false)
    private int floorNumber;

    @Column(nullable = false, length = 100)
    private String label;

    /** Width/height of the floor plan's coordinate space, for map rendering. */
    @Column(nullable = false)
    private double planWidth;

    @Column(nullable = false)
    private double planHeight;
}
