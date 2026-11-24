package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.SearchEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SearchEventRepository extends JpaRepository<SearchEvent, Long> {

    @Query("""
            select e.queryText as term, count(e) as hits
            from SearchEvent e
            where e.searchType = :searchType
            group by e.queryText
            order by count(e) desc
            """)
    List<TermCount> topTerms(@Param("searchType") String searchType, Pageable pageable);

    /** Part 8 admin dashboard: searches that found nothing -- a catalogue
     * gap signal, not something to hide from the admin. */
    @Query("""
            select e.queryText as term, count(e) as hits
            from SearchEvent e
            where e.searchType = :searchType and e.resultCount = 0 and e.queryText <> ''
            group by e.queryText
            order by count(e) desc
            """)
    List<TermCount> topZeroResultTerms(@Param("searchType") String searchType, Pageable pageable);

    @Query("""
            select e.matchedCategory as term, count(e) as hits
            from SearchEvent e
            where e.matchedCategory is not null
            group by e.matchedCategory
            order by count(e) desc
            """)
    List<TermCount> topCategories(Pageable pageable);

    long countBySearchType(String searchType);

    long countBySearchTypeAndResultCount(String searchType, int resultCount);

    /** Minimal projection for day-bucketing in Java (see AdminAnalyticsService)
     * -- avoids a Postgres-specific date_trunc native query for a dataset
     * this small. */
    @Query("select e.createdAt from SearchEvent e where e.createdAt >= :since")
    List<Instant> findCreatedAtSince(@Param("since") Instant since);

    interface TermCount {
        String getTerm();
        long getHits();
    }
}
