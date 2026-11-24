package com.mallmind.backend.domain.contract;

import java.util.List;

/**
 * OOP interface requirement (Part 6): any catalogue that can be searched by
 * a free-text/criteria object. ShopService and ProductService both
 * implement this with their own result types, demonstrating polymorphism —
 * callers (e.g. a future unified "search everything" endpoint) can treat
 * both uniformly.
 */
public interface Searchable<TCriteria, TResult> {
    List<TResult> search(TCriteria criteria);
}
