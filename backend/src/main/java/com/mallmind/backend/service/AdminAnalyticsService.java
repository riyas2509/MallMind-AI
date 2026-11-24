package com.mallmind.backend.service;

import com.mallmind.backend.client.ModelServiceClient;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.dto.admin.AnalyticsSummaryResponse;
import com.mallmind.backend.dto.admin.DailyCountResponse;
import com.mallmind.backend.dto.admin.DailyRevenueResponse;
import com.mallmind.backend.dto.admin.DemandForecastResponse;
import com.mallmind.backend.dto.admin.TermCountResponse;
import com.mallmind.backend.dto.admin.TopProductResponse;
import com.mallmind.backend.dto.ml.DemandPrediction;
import com.mallmind.backend.repository.OrderItemRepository;
import com.mallmind.backend.repository.OrderRepository;
import com.mallmind.backend.repository.ProductCategoryRepository;
import com.mallmind.backend.repository.ProductRepository;
import com.mallmind.backend.repository.SearchEventRepository;
import com.mallmind.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Part 8 admin analytics dashboard. Every number here is a real aggregate
 * over real tables (SearchEvent, Order, OrderItem) -- nothing is simulated
 * or hand-picked, unlike the model-service's deliberately-labelled
 * simulated demand series. Deliberately aggregate-only: nothing exposes a
 * single visitor's identity or search history (Part 17 privacy rule).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private static final String PRODUCT_SEARCH = "PRODUCT_SEARCH";
    private static final String SHOP_SEARCH = "SHOP_SEARCH";

    private final SearchEventRepository searchEventRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ModelServiceClient modelServiceClient;

    /** Part 9: real product categories for the dashboard's demand-forecast
     * picker -- never a hardcoded list that could drift from the seed data. */
    public List<String> categoryNames() {
        return productCategoryRepository.findAll().stream()
                .map(com.mallmind.backend.domain.entity.ProductCategory::getName)
                .sorted()
                .toList();
    }

    /** Part 9: Phase 5's demand-prediction model, called live. No baseline
     * fallback exists for this one (there's no non-ML way to "predict" a
     * number) -- a model-service outage surfaces as 503, not a guess. */
    public DemandForecastResponse demandForecast(String category) {
        DemandPrediction prediction = modelServiceClient.predictDemand(category);
        return new DemandForecastResponse(prediction.category(), prediction.predictedNextDayCount(), prediction.basis());
    }

    public AnalyticsSummaryResponse summary() {
        long totalProducts = productRepository.count();
        long totalShops = shopRepository.count();
        long totalOrders = orderRepository.countByStatusNot(OrderStatus.CANCELLED);
        BigDecimal totalRevenue = orderRepository.totalRevenue();
        long totalSearches = searchEventRepository.count();

        return new AnalyticsSummaryResponse(
                totalProducts,
                totalShops,
                totalOrders,
                totalRevenue,
                totalSearches,
                zeroResultRate(PRODUCT_SEARCH),
                zeroResultRate(SHOP_SEARCH));
    }

    private double zeroResultRate(String searchType) {
        long total = searchEventRepository.countBySearchType(searchType);
        if (total == 0) {
            return 0.0;
        }
        long zero = searchEventRepository.countBySearchTypeAndResultCount(searchType, 0);
        return (double) zero / total;
    }

    public List<TermCountResponse> topSearchTerms(String searchType, int limit) {
        return searchEventRepository.topTerms(searchType, PageRequest.of(0, limit)).stream()
                .map(r -> new TermCountResponse(r.getTerm(), r.getHits()))
                .toList();
    }

    public List<TermCountResponse> topZeroResultTerms(String searchType, int limit) {
        return searchEventRepository.topZeroResultTerms(searchType, PageRequest.of(0, limit)).stream()
                .map(r -> new TermCountResponse(r.getTerm(), r.getHits()))
                .toList();
    }

    public List<TermCountResponse> topCategories(int limit) {
        return searchEventRepository.topCategories(PageRequest.of(0, limit)).stream()
                .map(r -> new TermCountResponse(r.getTerm(), r.getHits()))
                .toList();
    }

    public List<TopProductResponse> topProducts(int limit) {
        return orderItemRepository.topProductsByQuantity(PageRequest.of(0, limit)).stream()
                .map(r -> new TopProductResponse(r.getProductName(), r.getShopName(), r.getTotalQuantity(), r.getTotalRevenue()))
                .toList();
    }

    /** Daily search counts for the trailing `days` days, zero-filled so a
     * chart doesn't show a gap for a day with no searches at all. */
    public List<DailyCountResponse> searchVolume(int days) {
        Instant since = startOfDaysAgo(days);
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        seedZeroDays(counts, days);

        for (Instant createdAt : searchEventRepository.findCreatedAtSince(since)) {
            LocalDate day = toUtcDate(createdAt);
            counts.merge(day, 1L, Long::sum);
        }

        return counts.entrySet().stream()
                .map(e -> new DailyCountResponse(e.getKey(), e.getValue()))
                .toList();
    }

    /** Daily order count + revenue for the trailing `days` days, same
     * zero-filling. CANCELLED orders are excluded from revenue but still
     * counted as orders -- they really were placed. */
    public List<DailyRevenueResponse> revenue(int days) {
        Instant since = startOfDaysAgo(days);
        Map<LocalDate, long[]> orderCounts = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> revenueByDay = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(i);
            orderCounts.put(day, new long[]{0});
            revenueByDay.put(day, BigDecimal.ZERO);
        }

        for (OrderRepository.DailyOrderRow row : orderRepository.findDailyRowsSince(since)) {
            LocalDate day = toUtcDate(row.getCreatedAt());
            if (!orderCounts.containsKey(day)) {
                continue;
            }
            orderCounts.get(day)[0]++;
            if (row.getStatus() != OrderStatus.CANCELLED) {
                revenueByDay.merge(day, row.getTotalAmount(), BigDecimal::add);
            }
        }

        return orderCounts.keySet().stream()
                .map(day -> new DailyRevenueResponse(day, orderCounts.get(day)[0], revenueByDay.get(day)))
                .toList();
    }

    private void seedZeroDays(Map<LocalDate, Long> counts, int days) {
        for (int i = days - 1; i >= 0; i--) {
            counts.put(LocalDate.now(ZoneOffset.UTC).minusDays(i), 0L);
        }
    }

    private Instant startOfDaysAgo(int days) {
        return LocalDate.now(ZoneOffset.UTC).minusDays(days - 1L).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private LocalDate toUtcDate(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).toLocalDate();
    }
}
