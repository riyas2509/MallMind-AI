package com.mallmind.backend.controller;

import com.mallmind.backend.dto.shop.ShopResponse;
import com.mallmind.backend.dto.shop.ShopSearchCriteria;
import com.mallmind.backend.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public ResponseEntity<List<ShopResponse>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer floor) {
        return ResponseEntity.ok(shopService.search(new ShopSearchCriteria(name, category, floor)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShopResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.getById(id));
    }
}
