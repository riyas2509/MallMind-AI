package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByActiveTrue();
    List<Offer> findByShopId(Long shopId);
    List<Offer> findByShopOwnerId(Long ownerId);
}
