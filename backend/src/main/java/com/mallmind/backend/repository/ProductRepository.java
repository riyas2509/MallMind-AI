package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            select p from Product p
            where (:onlyAvailable is null or :onlyAvailable = false or p.available = true)
              and (:shopId is null or p.shop.id = :shopId)
              and (:namePattern is null or lower(p.name) like :namePattern)
              and (:brandPattern is null or lower(p.brand) like :brandPattern or lower(p.shop.name) like :brandPattern)
              and (:category is null or lower(p.category.name) = :category)
              and (:color is null or lower(p.color) = :color)
              and (:maxPrice is null or coalesce(p.discountPrice, p.price) <= :maxPrice)
              and (:minPrice is null or coalesce(p.discountPrice, p.price) >= :minPrice)
            order by coalesce(p.discountPrice, p.price) asc
            """)
    List<Product> search(
            @Param("namePattern") String namePattern,
            @Param("brandPattern") String brandPattern,
            @Param("category") String category,
            @Param("color") String color,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("shopId") Long shopId,
            @Param("onlyAvailable") Boolean onlyAvailable);

    List<Product> findByCategoryIdAndAvailableTrue(Long categoryId);

    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByShopId(Long shopId);

    List<Product> findByShopIdIn(List<Long> shopIds);
}
