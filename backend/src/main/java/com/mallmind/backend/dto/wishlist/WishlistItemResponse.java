package com.mallmind.backend.dto.wishlist;

import com.mallmind.backend.dto.product.ProductResponse;

public record WishlistItemResponse(Long wishlistItemId, ProductResponse product) {
}
