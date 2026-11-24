package com.mallmind.backend.dto.admin;

import com.mallmind.backend.domain.enums.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FacilityCreateRequest(
        @NotNull int floorNumber,
        @NotNull FacilityType type,
        @NotBlank String label,
        @NotNull Long navigationNodeId
) {}
