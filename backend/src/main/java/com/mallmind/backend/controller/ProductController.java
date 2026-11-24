package com.mallmind.backend.controller;

import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.product.ProductSearchCriteria;
import com.mallmind.backend.dto.product.RecommendationContext;
import com.mallmind.backend.dto.product.RecommendationResponse;
import com.mallmind.backend.service.ProductRecommendationService;
import com.mallmind.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductRecommendationService productRecommendationService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String sortBy) {
        var criteria = new ProductSearchCriteria(name, brand, category, color, minPrice, maxPrice, shopId, available, sortBy);
        return ResponseEntity.ok(productService.search(criteria));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<ProductResponse>> getByShopId(@PathVariable Long shopId) {
        return ResponseEntity.ok(productService.getByShopId(shopId));
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<ProductResponse>> similar(@PathVariable Long id) {
        return ResponseEntity.ok(productService.similarTo(id));
    }

    @GetMapping("/compare")
    public ResponseEntity<List<ProductResponse>> compare(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(productService.compare(ids));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<RecommendationResponse> recommendations(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) BigDecimal maxBudget,
            @RequestParam(defaultValue = "10") int maxResults) {
        var context = new RecommendationContext(category, brand, color, maxBudget);
        return ResponseEntity.ok(productRecommendationService.recommendWithSource(context, maxResults));
    }
}
