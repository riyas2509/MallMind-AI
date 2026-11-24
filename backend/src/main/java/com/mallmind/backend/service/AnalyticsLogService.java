package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.SearchEvent;
import com.mallmind.backend.repository.SearchEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Multithreading requirement (Part 6): search-event logging runs on Spring's
 * async executor (see AsyncConfig) instead of the request thread, so a
 * visitor's search response never waits on an analytics INSERT. Failures
 * here are swallowed on purpose — analytics must never break a search.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsLogService {

    private final SearchEventRepository searchEventRepository;

    @Async("analyticsExecutor")
    public void logSearch(String searchType, String queryText, String matchedCategory, int resultCount) {
        try {
            SearchEvent event = SearchEvent.builder()
                    .searchType(searchType)
                    .queryText(queryText == null ? "" : queryText)
                    .matchedCategory(matchedCategory)
                    .resultCount(resultCount)
                    .build();
            searchEventRepository.save(event);
        } catch (Exception e) {
            log.warn("Failed to log search event (search itself still succeeded): {}", e.getMessage());
        }
    }
}
