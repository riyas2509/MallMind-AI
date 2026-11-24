package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.NavigationNode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NavigationNodeRepository extends JpaRepository<NavigationNode, Long> {
    @org.springframework.data.jpa.repository.Query("select n from NavigationNode n join fetch n.floor where n.qrCode = :qrCode")
    Optional<NavigationNode> findByQrCode(@org.springframework.data.repository.query.Param("qrCode") String qrCode);
    List<NavigationNode> findByFloorId(Long floorId);

    /**
     * Eagerly fetches each node's Floor. NavigationGraphService caches the
     * returned entities in memory past the request/transaction boundary
     * (see its @PostConstruct reload()), so a LAZY floor reference would
     * throw LazyInitializationException the moment anything later reads
     * node.getFloor().getFloorNumber() -- fetch-joining here avoids that.
     */
    @org.springframework.data.jpa.repository.Query("select n from NavigationNode n join fetch n.floor")
    List<NavigationNode> findAllWithFloor();
}
