package com.mallmind.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "malls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private int totalFloors = 0;
}
