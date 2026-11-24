package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Floor;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.ProductCategory;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.product.ProductSearchCriteria;
import com.mallmind.backend.exception.ProductNotFoundException;
import com.mallmind.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AnalyticsLogService analyticsLogService;

    private ProductService productService;

    private Shop zaraShop;
    private ProductCategory fashionCategory;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, analyticsLogService);

        Floor groundFloor = new Floor();
        groundFloor.setId(1L);
        groundFloor.setFloorNumber(0);
        groundFloor.setLabel("Ground Floor (G)");

        zaraShop = new Shop();
        zaraShop.setId(10L);
        zaraShop.setName("Zara");
        zaraShop.setFloor(groundFloor);

        fashionCategory = new ProductCategory();
        fashionCategory.setId(1L);
        fashionCategory.setName("Fashion & Apparel");

        sampleProduct = new Product();
        sampleProduct.setId(101L);
        sampleProduct.setName("Tailored Linen Blazer");
        sampleProduct.setBrand("Zara");
        sampleProduct.setColor("Beige");
        sampleProduct.setCategory(fashionCategory);
        sampleProduct.setShop(zaraShop);
        sampleProduct.setPrice(new BigDecimal("7990.00"));
        sampleProduct.setDiscountPrice(new BigDecimal("5990.00"));
        sampleProduct.setAvailable(true);
    }

    @Test
    @DisplayName("ProductService: getById returns mapped DTO")
    void testGetById() {
        when(productRepository.findById(101L)).thenReturn(Optional.of(sampleProduct));

        ProductResponse response = productService.getById(101L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(101L);
        assertThat(response.name()).isEqualTo("Tailored Linen Blazer");
        assertThat(response.effectivePrice()).isEqualByComparingTo(new BigDecimal("5990.00"));
        assertThat(response.shopName()).isEqualTo("Zara");
        assertThat(response.shopFloorNumber()).isEqualTo(0);
    }

    @Test
    @DisplayName("ProductService: getById throws ProductNotFoundException for missing ID")
    void testGetByIdNotFound() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getById(999L))
                .isInstanceOf(ProductNotFoundException.class);
    }

    @Test
    @DisplayName("ProductService: getByShopId returns products for given retailer")
    void testGetByShopId() {
        when(productRepository.findByShopId(10L)).thenReturn(List.of(sampleProduct));

        List<ProductResponse> products = productService.getByShopId(10L);

        assertThat(products).hasSize(1);
        assertThat(products.get(0).shopId()).isEqualTo(10L);
        assertThat(products.get(0).name()).isEqualTo("Tailored Linen Blazer");
    }

    @Test
    @DisplayName("ProductService: compare returns requested product details")
    void testCompare() {
        when(productRepository.findAllById(List.of(101L))).thenReturn(List.of(sampleProduct));

        List<ProductResponse> comparison = productService.compare(List.of(101L));

        assertThat(comparison).hasSize(1);
        assertThat(comparison.get(0).id()).isEqualTo(101L);
    }
}
