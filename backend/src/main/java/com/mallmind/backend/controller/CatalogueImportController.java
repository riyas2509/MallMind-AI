package com.mallmind.backend.controller;

import com.mallmind.backend.dto.catalogue.ImportSummary;
import com.mallmind.backend.service.CatalogueImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/retailer/catalogue")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'RETAILER')")
public class CatalogueImportController {

    private final CatalogueImportService catalogueImportService;

    /** Expected columns: see data/seed/products_import_sample.csv. */
    @PostMapping("/import")
    public ResponseEntity<ImportSummary> importCsv(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(catalogueImportService.importCsv(file));
    }
}
