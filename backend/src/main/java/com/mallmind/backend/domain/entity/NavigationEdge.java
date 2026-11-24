package com.mallmind.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A weighted, undirected connection between two navigation nodes. This is
 * the adjacency-matrix-equivalent edge list that NavigationGraphService
 * loads into memory to run Dijkstra (Part 5, Linear Algebra section #3/#4).
 * `weight` is walking distance in metres (or an equivalent "cost" for
 * vertical connectors, e.g. escalator traversal time converted to an
 * equivalent walking distance).
 */
@Entity
@Table(name = "navigation_edges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationEdge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_node_id", nullable = false)
    private NavigationNode fromNode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_node_id", nullable = false)
    private NavigationNode toNode;

    @Column(nullable = false)
    private double weight;

    /** True if this edge crosses floors (escalator/elevator/staircase). */
    @Builder.Default
    @Column(nullable = false)
    private boolean verticalConnection = false;
}
