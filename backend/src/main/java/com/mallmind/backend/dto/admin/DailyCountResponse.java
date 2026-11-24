package com.mallmind.backend.dto.admin;

import java.time.LocalDate;

public record DailyCountResponse(LocalDate date, long count) {
}
