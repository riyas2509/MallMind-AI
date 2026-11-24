package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Facility;
import com.mallmind.backend.domain.enums.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
    List<Facility> findByType(FacilityType type);
    List<Facility> findByFloorId(Long floorId);

    /**
     * Fetch-joins floor and navigation node so callers outside a request
     * transaction (e.g. VoiceAssistantService, which has no transaction of
     * its own while it waits on the model-service over HTTP) can safely
     * read facility.getFloor().getFloorNumber() / getNavigationNode() on
     * the returned, now-detached entities without a
     * LazyInitializationException.
     */
    @Query("select f from Facility f join fetch f.floor join fetch f.navigationNode where f.type = :type")
    List<Facility> findByTypeWithFloorAndNode(@Param("type") FacilityType type);
}
