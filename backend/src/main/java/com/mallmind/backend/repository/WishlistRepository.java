package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    @Query("select w from Wishlist w left join fetch w.items i left join fetch i.product where w.user = :user")
    Optional<Wishlist> findByUserWithItems(User user);

    Optional<Wishlist> findByUser(User user);
}
