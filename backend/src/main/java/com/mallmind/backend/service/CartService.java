package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.*;
import com.mallmind.backend.dto.cart.CartItemResponse;
import com.mallmind.backend.dto.cart.CartResponse;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.exception.ProductNotFoundException;
import com.mallmind.backend.repository.CartItemRepository;
import com.mallmind.backend.repository.CartRepository;
import com.mallmind.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartResponse getCart(User user) {
        return toResponse(getOrCreateCart(user));
    }

    public CartResponse addItem(User user, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Cart cart = getOrCreateCart(user);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        if (!product.isAvailable()) {
            throw new IllegalArgumentException("Product '" + product.getName() + "' is not currently available");
        }

        CartItem item = cartItemRepository.findByCartAndProductId(cart, productId)
                .orElseGet(() -> CartItem.builder().cart(cart).product(product).quantity(0).build());

        int targetQuantity = item.getQuantity() + quantity;
        if (product.getStockQuantity() < targetQuantity) {
            throw new IllegalArgumentException("Not enough stock for '" + product.getName()
                    + "'. Available: " + product.getStockQuantity() + ", requested total: " + targetQuantity);
        }

        item.setQuantity(targetQuantity);
        cartItemRepository.save(item);

        return getCart(user);
    }

    /** quantity=0 removes the line item; negative quantities are rejected. */
    public CartResponse updateItemQuantity(User user, Long productId, int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        Cart cart = getOrCreateCart(user);
        if (quantity == 0) {
            cartItemRepository.deleteByCartAndProductId(cart, productId);
        } else {
            CartItem item = cartItemRepository.findByCartAndProductId(cart, productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product " + productId + " is not in the cart"));
            Product product = item.getProduct();
            if (product.getStockQuantity() < quantity) {
                throw new IllegalArgumentException("Not enough stock for '" + product.getName()
                        + "'. Available: " + product.getStockQuantity() + ", requested: " + quantity);
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return getCart(user);
    }

    public CartResponse removeItem(User user, Long productId) {
        Cart cart = getOrCreateCart(user);
        cartItemRepository.deleteByCartAndProductId(cart, productId);
        return getCart(user);
    }

    public void clear(User user) {
        Cart cart = getOrCreateCart(user);
        cartItemRepository.deleteByCart(cart);
    }

    Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItem> cartItems = cartItemRepository.findByCartIdWithProduct(cart.getId());
        List<CartItemResponse> items = cartItems.stream()
                .map(i -> new CartItemResponse(
                        i.getId(), toProductResponse(i.getProduct()), i.getQuantity(),
                        i.getProduct().effectivePrice().multiply(BigDecimal.valueOf(i.getQuantity()))))
                .toList();
        BigDecimal subtotal = items.stream().map(CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalItemCount = items.stream().mapToInt(CartItemResponse::quantity).sum();
        return new CartResponse(items, subtotal, totalItemCount);
    }

    private ProductResponse toProductResponse(Product p) {
        return new ProductResponse(
                p.getId(), p.getName(), p.getBrand(), p.getColor(), p.getCategory().getName(),
                p.getPrice(), p.getDiscountPrice(), p.effectivePrice(), p.isAvailable(), p.getImageUrl(),
                p.getShop().getId(), p.getShop().getName(), p.getShop().getFloor().getFloorNumber());
    }
}
