package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.InventoryAdjustment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, Long> {

    List<InventoryAdjustment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<InventoryAdjustment> findByShopIdOrderByCreatedAtDesc(Long shopId, Pageable pageable);

    List<InventoryAdjustment> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);
}
