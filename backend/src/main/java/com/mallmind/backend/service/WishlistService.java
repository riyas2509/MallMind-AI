package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.*;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.wishlist.WishlistItemResponse;
import com.mallmind.backend.dto.wishlist.WishlistResponse;
import com.mallmind.backend.exception.ProductNotFoundException;
import com.mallmind.backend.repository.ProductRepository;
import com.mallmind.backend.repository.WishlistItemRepository;
import com.mallmind.backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;

    public WishlistResponse getWishlist(User user) {
        Wishlist wishlist = getOrCreateWishlist(user);
        return toResponse(wishlist);
    }

    public WishlistResponse addItem(User user, Long productId) {
        Wishlist wishlist = getOrCreateWishlist(user);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        if (wishlistItemRepository.findByWishlistAndProductId(wishlist, productId).isEmpty()) {
            WishlistItem item = WishlistItem.builder().wishlist(wishlist).product(product).build();
            wishlistItemRepository.save(item);
        }
        return getWishlist(user);
    }

    public WishlistResponse removeItem(User user, Long productId) {
        Wishlist wishlist = getOrCreateWishlist(user);
        wishlistItemRepository.deleteByWishlistAndProductId(wishlist, productId);
        return getWishlist(user);
    }

    private Wishlist getOrCreateWishlist(User user) {
        return wishlistRepository.findByUser(user)
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder().user(user).build()));
    }

    private WishlistResponse toResponse(Wishlist wishlist) {
        List<WishlistItem> wishlistItems = wishlistItemRepository.findByWishlistIdWithProduct(wishlist.getId());
        List<WishlistItemResponse> items = wishlistItems.stream()
                .map(i -> new WishlistItemResponse(i.getId(), toProductResponse(i.getProduct())))
                .toList();
        return new WishlistResponse(items);
    }

    private ProductResponse toProductResponse(Product p) {
        return new ProductResponse(
                p.getId(), p.getName(), p.getBrand(), p.getColor(), p.getCategory().getName(),
                p.getPrice(), p.getDiscountPrice(), p.effectivePrice(), p.isAvailable(), p.getImageUrl(),
                p.getShop().getId(), p.getShop().getName(), p.getShop().getFloor().getFloorNumber());
    }
}
