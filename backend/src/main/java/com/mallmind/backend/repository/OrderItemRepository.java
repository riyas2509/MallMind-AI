package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Part 8 admin dashboard: best-selling products by real order history
     * (sandbox checkout, but a real quantity -- never fabricated). Grouped
     * by the snapshot fields, not a live Product join, so a since-deleted
     * or renamed product still shows up correctly for past orders. */
    @Query("""
            select i.productNameSnapshot as productName, i.shopNameSnapshot as shopName,
                   sum(i.quantity) as totalQuantity,
                   sum(i.unitPriceSnapshot * i.quantity) as totalRevenue
            from OrderItem i
            where i.order.status <> com.mallmind.backend.domain.enums.OrderStatus.CANCELLED
            group by i.productNameSnapshot, i.shopNameSnapshot
            order by sum(i.quantity) desc
            """)
    List<TopProduct> topProductsByQuantity(Pageable pageable);

    interface TopProduct {
        String getProductName();
        String getShopName();
        long getTotalQuantity();
        BigDecimal getTotalRevenue();
    }
}
