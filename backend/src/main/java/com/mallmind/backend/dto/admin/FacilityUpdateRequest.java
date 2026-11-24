package com.mallmind.backend.dto.admin;

import com.mallmind.backend.domain.enums.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FacilityUpdateRequest(
        @NotNull FacilityType type,
        @NotBlank String label
) {}
