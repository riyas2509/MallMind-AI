package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.NavigationEdge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NavigationEdgeRepository extends JpaRepository<NavigationEdge, Long> {
    @org.springframework.data.jpa.repository.Query(
            "select e from NavigationEdge e join fetch e.fromNode join fetch e.toNode")
    List<NavigationEdge> findAllWithNodes();
}
