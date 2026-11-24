package com.mallmind.backend.controller;

import com.mallmind.backend.dto.offer.OfferRequest;
import com.mallmind.backend.dto.offer.OfferResponse;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.OfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;
    private final CurrentUserService currentUserService;

    /** Public: visitors see active offers (Part 4, Module 2). Sponsored ones carry `sponsored: true` (Part 12 disclosure). */
    @GetMapping("/api/offers")
    public ResponseEntity<List<OfferResponse>> listActiveOffers() {
        return ResponseEntity.ok(offerService.listActiveOffers());
    }

    @PostMapping("/api/retailer/offers")
    @PreAuthorize("hasAnyRole('ADMIN', 'RETAILER')")
    public ResponseEntity<OfferResponse> createOffer(@Valid @RequestBody OfferRequest request) {
        return ResponseEntity.ok(offerService.createOffer(currentUserService.getCurrentUser(), request));
    }

    @DeleteMapping("/api/retailer/offers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RETAILER')")
    public ResponseEntity<Void> deactivateOffer(@PathVariable Long id) {
        offerService.deactivateOffer(currentUserService.getCurrentUser(), id);
        return ResponseEntity.noContent().build();
    }
}
