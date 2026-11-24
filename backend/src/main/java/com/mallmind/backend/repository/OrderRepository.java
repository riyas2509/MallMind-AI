package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Order;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    Optional<Order> findByIdAndUser(Long id, User user);

    @Query("select distinct o from Order o join o.items i where i.product.shop.id in :shopIds order by o.createdAt desc")
    List<Order> findByShopIdIn(@Param("shopIds") List<Long> shopIds);

    /** Part 8 admin dashboard. CANCELLED orders never happened as far as
     * revenue is concerned -- they're excluded, not just zeroed out. */
    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.status <> com.mallmind.backend.domain.enums.OrderStatus.CANCELLED")
    BigDecimal totalRevenue();

    long countByStatusNot(OrderStatus status);

    long countByStatus(OrderStatus status);

    /** Minimal projection for day-bucketing revenue/order-count in Java. */
    @Query("select o.createdAt as createdAt, o.totalAmount as totalAmount, o.status as status "
            + "from Order o where o.createdAt >= :since")
    List<DailyOrderRow> findDailyRowsSince(@Param("since") Instant since);

    interface DailyOrderRow {
        Instant getCreatedAt();
        BigDecimal getTotalAmount();
        OrderStatus getStatus();
    }
}
