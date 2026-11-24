package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Floor;
import com.mallmind.backend.domain.entity.Mall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByMallOrderByFloorNumberAsc(Mall mall);
    Optional<Floor> findByMallAndFloorNumber(Mall mall, int floorNumber);
    List<Floor> findAllByOrderByFloorNumberAsc();
    Optional<Floor> findByFloorNumber(int floorNumber);
}
