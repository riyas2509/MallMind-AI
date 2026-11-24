package com.mallmind.backend.controller;

import com.mallmind.backend.dto.wishlist.WishlistResponse;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist() {
        return ResponseEntity.ok(wishlistService.getWishlist(currentUserService.getCurrentUser()));
    }

    @PostMapping("/items/{productId}")
    public ResponseEntity<WishlistResponse> addItem(@PathVariable Long productId) {
        return ResponseEntity.ok(wishlistService.addItem(currentUserService.getCurrentUser(), productId));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<WishlistResponse> removeItem(@PathVariable Long productId) {
        return ResponseEntity.ok(wishlistService.removeItem(currentUserService.getCurrentUser(), productId));
    }
}
