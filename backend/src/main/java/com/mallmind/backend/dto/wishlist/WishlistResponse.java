package com.mallmind.backend.dto.wishlist;

import java.util.List;

public record WishlistResponse(List<WishlistItemResponse> items) {
}
