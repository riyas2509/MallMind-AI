package com.mallmind.backend.domain.entity;

import com.mallmind.backend.domain.enums.NavigationNodeType;
import jakarta.persistence.*;
import lombok.*;

/**
 * A walkable point in the indoor navigation graph (Part 4, Module 1 / Part 5
 * Linear Algebra section). Coordinates are in the floor's own plan coordinate
 * space (see Floor.planWidth/planHeight) and are what the frontend's
 * transformation matrix maps into screen pixels.
 */
@Entity
@Table(name = "navigation_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NavigationNodeType type;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    /**
     * For ESCALATOR/ELEVATOR/STAIRCASE nodes, the id of the matching node on
     * the other floor that this vertical connector leads to. Null for
     * horizontal-only nodes. The actual traversal edge is still created
     * explicitly in navigation_edges; this field just lets the admin UI and
     * seed data express "these two nodes are the same physical escalator".
     */
    @Column(name = "linked_node_id")
    private Long linkedNodeId;

    @Column(length = 120)
    private String label;

    /** QR code value printed at this physical location, for check-in
     * ("scan to find out where you are" — Part 4, Module 1 starting-location
     * flow). Null for purely structural nodes that aren't check-in points. */
    @Column(name = "qr_code", unique = true, length = 100)
    private String qrCode;
}
