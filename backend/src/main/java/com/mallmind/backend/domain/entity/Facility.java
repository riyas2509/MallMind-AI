package com.mallmind.backend.domain.entity;

import com.mallmind.backend.domain.enums.FacilityType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FacilityType type;

    @Column(nullable = false, length = 120)
    private String label;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "navigation_node_id", nullable = false, unique = true)
    private NavigationNode navigationNode;
}
