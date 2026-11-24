package com.mallmind.backend.controller;

import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.retailer.ImageClassificationResponse;
import com.mallmind.backend.dto.retailer.ProductCreateRequest;
import com.mallmind.backend.dto.retailer.ProductUpdateRequest;
import com.mallmind.backend.dto.shop.ShopResponse;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.RetailerProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/retailer/products")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'RETAILER')")
public class RetailerProductController {

    private final RetailerProductService retailerProductService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> listMyProducts() {
        return ResponseEntity.ok(retailerProductService.listMyProducts(currentUserService.getCurrentUser()));
    }

    /** Backs the retailer UI's shop picker (replaces a raw shop-id field) --
     * ADMIN sees every shop, RETAILER only the ones they own. */
    @GetMapping("/shops")
    public ResponseEntity<List<ShopResponse>> listMyShops() {
        return ResponseEntity.ok(retailerProductService.listMyShops(currentUserService.getCurrentUser()));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        return ResponseEntity.ok(retailerProductService.createProduct(currentUserService.getCurrentUser(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @RequestBody ProductUpdateRequest request) {
        return ResponseEntity.ok(retailerProductService.updateProduct(currentUserService.getCurrentUser(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        retailerProductService.deleteProduct(currentUserService.getCurrentUser(), id);
        return ResponseEntity.noContent().build();
    }

    /** Part 9: Phase 6's image classifier as a data-entry aid -- suggests a
     * category from a product photo. Advisory only; doesn't create or
     * modify a product. */
    @PostMapping(value = "/classify-image", consumes = "multipart/form-data")
    public ResponseEntity<ImageClassificationResponse> classifyImage(@RequestParam("image") MultipartFile image) throws IOException {
        return ResponseEntity.ok(retailerProductService.classifyProductImage(image.getBytes(), image.getOriginalFilename()));
    }
}
