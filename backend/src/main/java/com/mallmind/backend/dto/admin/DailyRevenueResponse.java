package com.mallmind.backend.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRevenueResponse(LocalDate date, long orderCount, BigDecimal revenue) {
}
