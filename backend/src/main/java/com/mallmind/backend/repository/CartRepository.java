package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Cart;
import com.mallmind.backend.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    @Query("select c from Cart c left join fetch c.items i left join fetch i.product where c.user = :user")
    Optional<Cart> findByUserWithItems(User user);

    Optional<Cart> findByUser(User user);
}
