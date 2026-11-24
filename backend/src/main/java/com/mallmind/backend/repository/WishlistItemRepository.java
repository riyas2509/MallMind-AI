package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Wishlist;
import com.mallmind.backend.domain.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    Optional<WishlistItem> findByWishlistAndProductId(Wishlist wishlist, Long productId);

    /** Explicit bulk JPQL delete -- see CartItemRepository.deleteByCart for why. */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from WishlistItem i where i.wishlist = :wishlist and i.product.id = :productId")
    void deleteByWishlistAndProductId(@org.springframework.data.repository.query.Param("wishlist") Wishlist wishlist,
                                       @org.springframework.data.repository.query.Param("productId") Long productId);

    /** See CartItemRepository.findByCartIdWithProduct for why this is queried directly. */
    @org.springframework.data.jpa.repository.Query(
            "select i from WishlistItem i join fetch i.product where i.wishlist.id = :wishlistId")
    java.util.List<WishlistItem> findByWishlistIdWithProduct(@org.springframework.data.repository.query.Param("wishlistId") Long wishlistId);
}
