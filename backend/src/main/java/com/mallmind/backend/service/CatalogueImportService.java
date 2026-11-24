package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.ProductCategory;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.dto.catalogue.ImportSummary;
import com.mallmind.backend.exception.CatalogueImportException;
import com.mallmind.backend.repository.ProductCategoryRepository;
import com.mallmind.backend.repository.ProductRepository;
import com.mallmind.backend.repository.ShopRepository;
import com.mallmind.backend.util.SimpleCsvParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/**
 * File management + real multithreading requirement (Part 6). Retailers and
 * admins upload a CSV catalogue (see data/seed/products_import_sample.csv
 * for the expected columns); this service validates every row against the
 * real shop/category tables (never fabricates a shop or category), splits
 * valid rows into chunks, and parses/builds them CONCURRENTLY on the
 * catalogueImportExecutor pool before a single batched save. Thread safety:
 * each worker only reads shared, already-loaded lookup maps and returns its
 * own row results -- there is no shared mutable state between threads, so
 * no explicit locking is needed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogueImportService {

    private static final int CHUNK_SIZE = 25;
    private static final List<String> EXPECTED_HEADER = List.of(
            "shop_id", "category_name", "name", "brand", "color", "description",
            "price", "discount_price", "specifications", "image_url", "available", "stock_quantity");

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ProductCategoryRepository categoryRepository;

    @Qualifier("catalogueImportExecutor")
    private final Executor catalogueImportExecutor;

    public ImportSummary importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CatalogueImportException("Uploaded catalogue file is empty");
        }

        List<String> lines;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            lines = reader.lines().filter(l -> !l.isBlank()).toList();
        } catch (IOException e) {
            throw new CatalogueImportException("Could not read uploaded CSV file", e);
        }

        if (lines.isEmpty()) {
            throw new CatalogueImportException("CSV file has no rows");
        }

        List<String> header = SimpleCsvParser.parseLine(lines.get(0)).stream().map(String::trim).toList();
        if (!header.equals(EXPECTED_HEADER)) {
            throw new CatalogueImportException(
                    "CSV header does not match expected columns: " + EXPECTED_HEADER);
        }

        List<String> dataLines = lines.subList(1, lines.size());

        // Preload lookups once -- every worker thread only reads these maps.
        Map<Long, Shop> shopsById = new HashMap<>();
        shopRepository.findAll().forEach(s -> shopsById.put(s.getId(), s));
        Map<String, ProductCategory> categoriesByName = new HashMap<>();
        categoryRepository.findAll().forEach(c -> categoriesByName.put(c.getName().toLowerCase(), c));

        List<List<String>> chunks = chunk(dataLines, CHUNK_SIZE);
        List<CompletableFuture<ChunkResult>> futures = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {
            int chunkIndex = i;
            List<String> chunkLines = chunks.get(i);
            futures.add(CompletableFuture.supplyAsync(
                    () -> processChunk(chunkIndex, chunkLines, shopsById, categoriesByName),
                    catalogueImportExecutor));
        }

        List<Product> allProducts = new ArrayList<>();
        List<String> allErrors = new ArrayList<>();
        for (CompletableFuture<ChunkResult> future : futures) {
            ChunkResult result = future.join();
            allProducts.addAll(result.products());
            allErrors.addAll(result.errors());
        }

        List<Product> saved = productRepository.saveAll(allProducts);
        log.info("Catalogue import: {} rows processed, {} imported, {} errors",
                dataLines.size(), saved.size(), allErrors.size());

        return new ImportSummary(dataLines.size(), saved.size(), allErrors);
    }

    private ChunkResult processChunk(
            int chunkIndex, List<String> lines, Map<Long, Shop> shopsById, Map<String, ProductCategory> categoriesByName) {
        List<Product> products = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < lines.size(); i++) {
            int rowNumber = chunkIndex * CHUNK_SIZE + i + 2; // +2: header row + 1-indexing
            try {
                List<String> fields = SimpleCsvParser.parseLine(lines.get(i));
                if (fields.size() != EXPECTED_HEADER.size()) {
                    errors.add("Row " + rowNumber + ": expected " + EXPECTED_HEADER.size()
                            + " columns, found " + fields.size());
                    continue;
                }
                products.add(toProduct(fields, shopsById, categoriesByName));
            } catch (Exception e) {
                errors.add("Row " + rowNumber + ": " + e.getMessage());
            }
        }
        return new ChunkResult(products, errors);
    }

    private Product toProduct(List<String> f, Map<Long, Shop> shopsById, Map<String, ProductCategory> categoriesByName) {
        long shopId = Long.parseLong(f.get(0).trim());
        Shop shop = shopsById.get(shopId);
        if (shop == null) {
            throw new IllegalArgumentException("Unknown shop_id " + shopId);
        }

        String categoryName = f.get(1).trim();
        ProductCategory category = categoriesByName.get(categoryName.toLowerCase());
        if (category == null) {
            throw new IllegalArgumentException("Unknown category_name '" + categoryName + "'");
        }

        String name = f.get(2).trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }

        BigDecimal price = new BigDecimal(f.get(6).trim());
        String discountRaw = f.get(7).trim();
        BigDecimal discountPrice = discountRaw.isEmpty() ? null : new BigDecimal(discountRaw);

        return Product.builder()
                .shop(shop)
                .category(category)
                .name(name)
                .brand(blankToNull(f.get(3)))
                .color(blankToNull(f.get(4)))
                .description(blankToNull(f.get(5)))
                .price(price)
                .discountPrice(discountPrice)
                .specifications(blankToNull(f.get(8)))
                .imageUrl(blankToNull(f.get(9)))
                .available(Boolean.parseBoolean(f.get(10).trim()))
                .stockQuantity(f.get(11).trim().isEmpty() ? 0 : Integer.parseInt(f.get(11).trim()))
                .build();
    }

    private String blankToNull(String s) {
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<List<String>> chunk(List<String> lines, int size) {
        List<List<String>> chunks = new ArrayList<>();
        for (int i = 0; i < lines.size(); i += size) {
            chunks.add(lines.subList(i, Math.min(i + size, lines.size())));
        }
        return chunks;
    }

    private record ChunkResult(List<Product> products, List<String> errors) {
    }
}
