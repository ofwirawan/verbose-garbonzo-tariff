package com.verbosegarbonzo.tariff.service;

import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing cache lifecycle and scheduled cache refresh.
 *
 * Automatically refreshes (clears) cache entries based on configured schedules:
 * - freightData: Cleared every 24 hours (prices update daily)
 * - countryData: Cleared every 7 days (static data, rarely changes)
 * - productData: Cleared every 7 days (static data, rarely changes)
 */
@Service
@Slf4j
public class CacheRefreshService {

    private final CacheManager cacheManager;

    public CacheRefreshService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Refresh freight cache every 24 hours at 2 AM.
     * This ensures freight prices are fetched fresh from the API at least once daily.
     *
     * Cron expression: 0 0 2 * * * (2 AM every day)
     * Alternative: 0 0 0/12 * * * (every 12 hours)
     */
    @Scheduled(cron = "${app.cache.freight.refresh.cron:0 0 2 * * *}")
    public void refreshFreightCache() {
        try {
            var cache = cacheManager.getCache("freightData");
            if (cache != null) {
                cache.clear();
                log.info("✓ Freight cache cleared successfully. New prices will be fetched on next request.");
            }
        } catch (Exception e) {
            log.error("✗ Error clearing freight cache", e);
        }
    }

    /**
     * Refresh country cache every 7 days at 3 AM.
     * Countries are static reference data and rarely change.
     *
     * Cron expression: 0 0 3 * * 0 (3 AM every Sunday)
     */
    @Scheduled(cron = "${app.cache.country.refresh.cron:0 0 3 * * 0}")
    public void refreshCountryCache() {
        try {
            var cache = cacheManager.getCache("countryData");
            if (cache != null) {
                cache.clear();
                log.info("✓ Country cache cleared successfully.");
            }
        } catch (Exception e) {
            log.error("✗ Error clearing country cache", e);
        }
    }

    /**
     * Refresh product cache every 7 days at 3:15 AM.
     * Products are static reference data and rarely change.
     *
     * Cron expression: 0 15 3 * * 0 (3:15 AM every Sunday)
     */
    @Scheduled(cron = "${app.cache.product.refresh.cron:0 15 3 * * 0}")
    public void refreshProductCache() {
        try {
            var cache = cacheManager.getCache("productData");
            if (cache != null) {
                cache.clear();
                log.info("✓ Product cache cleared successfully.");
            }
        } catch (Exception e) {
            log.error("✗ Error clearing product cache", e);
        }
    }

    /**
     * Clear all caches immediately.
     * Useful for manual refresh when data is updated.
     */
    public void clearAllCaches() {
        try {
            if (cacheManager != null) {
                for (String cacheName : cacheManager.getCacheNames()) {
                    if (cacheName != null) {
                        clearCache(cacheName);
                        log.info("✓ Cache cleared: {}", cacheName);
                    }
                }
            }
            log.info("✓ All caches cleared successfully.");
        } catch (Exception e) {
            log.error("✗ Error clearing all caches", e);
        }
    }

    /**
     * Clear a specific cache by name.
     * Useful for targeted refresh without clearing all caches.
     *
     * @param cacheName the name of the cache to clear
     */
    public void clearCache(String cacheName) {
        try {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.info("✓ Cache cleared: {}", cacheName);
            } else {
                log.warn("⚠ Cache not found: {}", cacheName);
            }
        } catch (Exception e) {
            log.error("✗ Error clearing cache: {}", cacheName, e);
        }
    }
}
