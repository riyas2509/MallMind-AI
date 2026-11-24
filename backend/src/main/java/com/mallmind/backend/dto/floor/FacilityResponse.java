package com.mallmind.backend.dto.floor;

import com.mallmind.backend.domain.enums.FacilityType;

public record FacilityResponse(Long id, FacilityType type, String label, int floorNumber, double x, double y, Long navigationNodeId) {
}
