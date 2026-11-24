package com.mallmind.backend.dto.floor;

import com.mallmind.backend.dto.shop.ShopResponse;

import java.util.List;

/** Everything the frontend's interactive floor map needs for one floor, in one call. */
public record FloorMapResponse(
        FloorSummary floor,
        List<ShopResponse> shops,
        List<FacilityResponse> facilities) {
}
