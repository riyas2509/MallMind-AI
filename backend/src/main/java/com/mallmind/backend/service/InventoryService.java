package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.InventoryAdjustment;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.InventoryAdjustmentReason;
import com.mallmind.backend.domain.enums.RoleName;
import com.mallmind.backend.dto.admin.InventoryAdjustmentRequest;
import com.mallmind.backend.dto.admin.InventoryAdjustmentResponse;
import com.mallmind.backend.dto.admin.InventoryAlertResponse;
import com.mallmind.backend.exception.ProductNotFoundException;
import com.mallmind.backend.exception.ShopOwnershipException;
import com.mallmind.backend.repository.InventoryAdjustmentRepository;
import com.mallmind.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryAdjustmentRepository inventoryAdjustmentRepository;
    private final AuditLogService auditLogService;

    public InventoryAdjustmentResponse adjustStock(User actor, InventoryAdjustmentRequest request) {
        if (request.newStock() < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative. Provided: " + request.newStock());
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ProductNotFoundException(request.productId()));

        boolean isAdmin = actor.hasRole(RoleName.ADMIN);
        if (!isAdmin) {
            boolean owns = product.getShop().getOwner() != null &&
                    product.getShop().getOwner().getId().equals(actor.getId());
            if (!owns) {
                throw new ShopOwnershipException("You do not manage the store '" + product.getShop().getName() + "' for product #" + product.getId());
            }
        }

        int oldStock = product.getStockQuantity();
        int newStock = request.newStock();
        int change = newStock - oldStock;

        product.setStockQuantity(newStock);
        if (newStock == 0) {
            product.setAvailable(false);
        } else if (!product.isAvailable() && newStock > 0) {
            product.setAvailable(true);
        }
        productRepository.save(product);

        InventoryAdjustment adj = InventoryAdjustment.builder()
                .product(product)
                .productNameSnapshot(product.getName())
                .shop(product.getShop())
                .shopNameSnapshot(product.getShop().getName())
                .oldStock(oldStock)
                .newStock(newStock)
                .changeQuantity(change)
                .reason(request.reason() != null ? request.reason() : InventoryAdjustmentReason.CORRECTION)
                .actorEmail(actor.getEmail())
                .actorRole(isAdmin ? "ADMIN" : "RETAILER")
                .notes(request.notes())
                .build();
        adj = inventoryAdjustmentRepository.save(adj);

        auditLogService.record(
                actor.getEmail(),
                isAdmin ? "ADMIN" : "RETAILER",
                "STOCK_ADJUSTED",
                "PRODUCT",
                String.valueOf(product.getId()),
                "Product '" + product.getName() + "' stock changed from " + oldStock + " to " + newStock +
                        " (diff: " + change + ", reason: " + adj.getReason() + ")",
                "SUCCESS"
        );

        return toResponse(adj);
    }

    @Transactional(readOnly = true)
    public List<InventoryAlertResponse> getInventoryAlerts(Long shopId) {
        List<Product> products = (shopId != null)
                ? productRepository.findByShopId(shopId)
                : productRepository.findAll();

        List<InventoryAlertResponse> alerts = new ArrayList<>();
        for (Product p : products) {
            if (!p.isAvailable() || p.getStockQuantity() == 0) {
                alerts.add(new InventoryAlertResponse(
                        p.getId(), p.getName(), p.getBrand(), p.getCategory().getName(),
                        p.getShop().getId(), p.getShop().getName(), p.getShop().getFloor().getFloorNumber(),
                        p.effectivePrice(), p.getStockQuantity(), p.isAvailable(), "OUT_OF_STOCK"));
            } else if (p.getStockQuantity() <= 5) {
                alerts.add(new InventoryAlertResponse(
                        p.getId(), p.getName(), p.getBrand(), p.getCategory().getName(),
                        p.getShop().getId(), p.getShop().getName(), p.getShop().getFloor().getFloorNumber(),
                        p.effectivePrice(), p.getStockQuantity(), p.isAvailable(), "LOW_STOCK"));
            }
        }
        return alerts;
    }

    @Transactional(readOnly = true)
    public List<InventoryAdjustmentResponse> getHistory(Long shopId, int limit) {
        PageRequest pr = PageRequest.of(0, Math.min(limit, 100));
        List<InventoryAdjustment> list = (shopId != null)
                ? inventoryAdjustmentRepository.findByShopIdOrderByCreatedAtDesc(shopId, pr)
                : inventoryAdjustmentRepository.findAllByOrderByCreatedAtDesc(pr);
        return list.stream().map(this::toResponse).toList();
    }

    private InventoryAdjustmentResponse toResponse(InventoryAdjustment a) {
        return new InventoryAdjustmentResponse(
                a.getId(),
                a.getProduct().getId(),
                a.getProductNameSnapshot(),
                a.getShop().getId(),
                a.getShopNameSnapshot(),
                a.getOldStock(),
                a.getNewStock(),
                a.getChangeQuantity(),
                a.getReason(),
                a.getActorEmail(),
                a.getActorRole(),
                a.getNotes(),
                a.getCreatedAt());
    }
}
