package com.mallmind.backend.service;

import com.mallmind.backend.client.ModelServiceClient;
import com.mallmind.backend.domain.contract.RecommendationProvider;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.dto.ml.MlRecommendation;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.product.ProductSearchCriteria;
import com.mallmind.backend.dto.product.RecommendationContext;
import com.mallmind.backend.dto.product.RecommendationResponse;
import com.mallmind.backend.exception.ModelServiceUnavailableException;
import com.mallmind.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phase 9: the real implementation of RecommendationProvider, plugging in
 * Phase 5's trained content-based recommendation model over HTTP
 * (ModelServiceClient -> model-service's /recommendations). Per the
 * interface's own contract, a model-service failure falls back to a
 * transparent, non-ML baseline rather than fabricating a recommendation --
 * and {@link RecommendationResponse#source()} always says honestly which
 * one actually answered (Part 17).
 *
 * The model-service's response is trusted only for product id + score
 * (ranking); every displayed fact (name, price, availability...) is
 * re-fetched from the live database, never from the model-service's own
 * catalog.csv snapshot, which can be stale.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProductRecommendationService implements RecommendationProvider<RecommendationContext, ProductResponse> {

    private final ModelServiceClient modelServiceClient;
    private final ProductRepository productRepository;
    private final ProductService productService;

    /** Primary entry point: unlike the bare interface method, this also
     * reports which path actually answered (Part 17 transparency). */
    public RecommendationResponse recommendWithSource(RecommendationContext context, int maxResults) {
        try {
            return new RecommendationResponse(mlRecommend(context, maxResults), "ml-content-based");
        } catch (ModelServiceUnavailableException ex) {
            log.warn("Recommendation model unavailable, falling back to a plain filter: {}", ex.getMessage());
            return new RecommendationResponse(baselineRecommend(context, maxResults), "baseline-filter");
        }
    }

    @Override
    public List<ProductResponse> recommend(RecommendationContext context, int maxResults) {
        return recommendWithSource(context, maxResults).products();
    }

    private List<ProductResponse> mlRecommend(RecommendationContext context, int maxResults) {
        List<MlRecommendation> ranked = modelServiceClient.recommend(
                context.category(), context.brand(), context.color(),
                context.maxBudget() == null ? null : context.maxBudget().doubleValue(),
                maxResults);

        if (ranked.isEmpty()) {
            return List.of();
        }

        List<Long> ids = ranked.stream().map(MlRecommendation::productId).toList();
        Map<Long, Product> byId = new LinkedHashMap<>();
        productRepository.findAllById(ids).forEach(p -> byId.put(p.getId(), p));

        // Preserve the model's rank order; silently skip a since-deleted product
        // rather than erroring the whole recommendation list over one stale id.
        return ids.stream()
                .map(byId::get)
                .filter(p -> p != null)
                .map(productService::toResponse)
                .toList();
    }

    /** "a transparent, non-ML baseline" per RecommendationProvider's javadoc:
     * the same category/brand/color/budget filter the plain search endpoint
     * uses, cheapest first -- no ranking model involved. */
    private List<ProductResponse> baselineRecommend(RecommendationContext context, int maxResults) {
        var criteria = new ProductSearchCriteria(null, context.brand(), context.category(), context.color(), null, context.maxBudget());
        return productService.search(criteria).stream().limit(maxResults).toList();
    }
}
