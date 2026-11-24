package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Cart;
import com.mallmind.backend.domain.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndProductId(Cart cart, Long productId);

    /**
     * Explicit bulk JPQL deletes (@Modifying), not derived deleteBy methods.
     * A derived deleteBy loads matching entities and calls EntityManager.remove()
     * on each -- which, combined with Cart.items being CascadeType.ALL +
     * orphanRemoval=true and already lazily loaded earlier in the same
     * transaction (e.g. by CheckoutService reading cart.getItems()),
     * let Hibernate's flush-time cascade re-persist the "orphan" before the
     * remove took effect, silently undoing the delete. A bulk JPQL delete
     * goes straight to SQL and sidesteps collection-cascade state entirely.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from CartItem i where i.cart = :cart and i.product.id = :productId")
    void deleteByCartAndProductId(@org.springframework.data.repository.query.Param("cart") Cart cart,
                                   @org.springframework.data.repository.query.Param("productId") Long productId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from CartItem i where i.cart = :cart")
    void deleteByCart(@org.springframework.data.repository.query.Param("cart") Cart cart);

    /**
     * Queried directly (not via Cart.items) on purpose: within one
     * transaction, a Cart entity just created by getOrCreateCart() already
     * carries an initialized-but-empty in-memory `items` list, and Hibernate
     * will NOT repopulate that already-initialized collection from a later
     * fetch-join query in the same session -- it would silently show a
     * stale empty cart right after the very first add. Reading cart_items
     * as its own query sidesteps that collection-caching pitfall entirely.
     */
    @org.springframework.data.jpa.repository.Query(
            "select i from CartItem i join fetch i.product where i.cart.id = :cartId")
    java.util.List<CartItem> findByCartIdWithProduct(@org.springframework.data.repository.query.Param("cartId") Long cartId);
}
