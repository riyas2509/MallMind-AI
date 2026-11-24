package com.mallmind.backend.service;

import com.mallmind.backend.client.ModelServiceClient;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.ProductCategory;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.RoleName;
import com.mallmind.backend.dto.ml.ImageClassification;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.retailer.ImageClassificationResponse;
import com.mallmind.backend.dto.retailer.ProductCreateRequest;
import com.mallmind.backend.dto.retailer.ProductUpdateRequest;
import com.mallmind.backend.dto.shop.ShopResponse;
import com.mallmind.backend.exception.ProductNotFoundException;
import com.mallmind.backend.exception.ShopNotFoundException;
import com.mallmind.backend.exception.ShopOwnershipException;
import com.mallmind.backend.repository.ProductCategoryRepository;
import com.mallmind.backend.repository.ProductRepository;
import com.mallmind.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Retailer/admin product management (Part 2.B, Part 8). RETAILER accounts
 * may only create/update products in shops they own (Shop.owner); ADMIN
 * bypasses that check entirely. Nothing here fabricates data -- every
 * write is a real row change the retailer explicitly submitted.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RetailerProductService {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ModelServiceClient modelServiceClient;

    public List<ProductResponse> listMyProducts(User currentUser) {
        List<Long> shopIds = ownedShopIds(currentUser);
        return productRepository.findByShopIdIn(shopIds).stream().map(this::toResponse).toList();
    }

    /** Lets the retailer UI offer a shop picker instead of a raw shop-id
     * field -- ADMIN sees every shop, RETAILER only the ones they own. */
    public List<ShopResponse> listMyShops(User currentUser) {
        return ownedShops(currentUser).stream().map(this::toShopResponse).toList();
    }

    public ProductResponse createProduct(User currentUser, ProductCreateRequest request) {
        Shop shop = shopRepository.findById(request.shopId())
                .orElseThrow(() -> new ShopNotFoundException(request.shopId()));
        assertOwnsShop(currentUser, shop);

        ProductCategory category = categoryRepository.findByNameIgnoreCase(request.categoryName())
                .orElseThrow(() -> new IllegalArgumentException("Unknown category: " + request.categoryName()));

        Product product = Product.builder()
                .shop(shop)
                .category(category)
                .name(request.name())
                .brand(request.brand())
                .color(request.color())
                .description(request.description())
                .price(request.price())
                .discountPrice(request.discountPrice())
                .specifications(request.specifications())
                .imageUrl(request.imageUrl())
                .available(request.available())
                .stockQuantity(request.stockQuantity())
                .build();

        return toResponse(productRepository.save(product));
    }

    public ProductResponse updateProduct(User currentUser, Long productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        assertOwnsShop(currentUser, product.getShop());

        if (request.name() != null) product.setName(request.name());
        if (request.brand() != null) product.setBrand(request.brand());
        if (request.color() != null) product.setColor(request.color());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.discountPrice() != null) product.setDiscountPrice(request.discountPrice());
        if (request.specifications() != null) product.setSpecifications(request.specifications());
        if (request.imageUrl() != null) product.setImageUrl(request.imageUrl());
        if (request.available() != null) product.setAvailable(request.available());
        if (request.stockQuantity() != null) product.setStockQuantity(request.stockQuantity());

        return toResponse(productRepository.save(product));
    }

    /** Part 9: Phase 6's image classifier, as a data-entry aid. Advisory
     * only -- the retailer still submits categoryName themselves in
     * ProductCreateRequest; this never creates or changes a product. */
    public ImageClassificationResponse classifyProductImage(byte[] imageBytes, String filename) {
        ImageClassification result = modelServiceClient.classifyImage(imageBytes, filename);
        return new ImageClassificationResponse(
                result.category(), result.confidence(), result.lowConfidence(), result.probabilities(), result.note());
    }

    public void deleteProduct(User currentUser, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        assertOwnsShop(currentUser, product.getShop());
        productRepository.delete(product);
    }

    private List<Long> ownedShopIds(User currentUser) {
        return ownedShops(currentUser).stream().map(Shop::getId).toList();
    }

    private List<Shop> ownedShops(User currentUser) {
        if (currentUser.hasRole(RoleName.ADMIN)) {
            return shopRepository.findAll();
        }
        return shopRepository.findByOwnerId(currentUser.getId());
    }

    private void assertOwnsShop(User currentUser, Shop shop) {
        if (currentUser.hasRole(RoleName.ADMIN)) {
            return;
        }
        if (shop.getOwner() == null || !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new ShopOwnershipException("You do not manage shop '" + shop.getName() + "'");
        }
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(), p.getName(), p.getBrand(), p.getColor(), p.getCategory().getName(),
                p.getPrice(), p.getDiscountPrice(), p.effectivePrice(), p.isAvailable(), p.getImageUrl(),
                p.getShop().getId(), p.getShop().getName(), p.getShop().getFloor().getFloorNumber());
    }

    private ShopResponse toShopResponse(Shop shop) {
        return new ShopResponse(
                shop.getId(), shop.getName(), shop.getCategory(), shop.getDescription(), shop.getLogoUrl(),
                shop.getFloor().getFloorNumber(), shop.getNavigationNode().getId(),
                shop.getNavigationNode().getX(), shop.getNavigationNode().getY());
    }
}
