package com.mallmind.backend.dto.catalogue;

import java.util.List;

public record ImportSummary(int totalRows, int importedCount, List<String> rowErrors) {
}
