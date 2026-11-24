package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopRepository extends JpaRepository<Shop, Long> {

    List<Shop> findByNameContainingIgnoreCaseAndActiveTrue(String name);

    List<Shop> findByCategoryContainingIgnoreCaseAndActiveTrue(String category);

    List<Shop> findByFloorIdAndActiveTrue(Long floorId);

    List<Shop> findByActiveTrue();

    List<Shop> findByOwnerId(Long ownerId);
}
