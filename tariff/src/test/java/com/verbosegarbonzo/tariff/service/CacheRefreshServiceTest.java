package com.verbosegarbonzo.tariff.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CacheRefreshServiceTest {

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache freightCache;

    @Mock
    private Cache countryCache;

    @Mock
    private Cache productCache;

    @InjectMocks
    private CacheRefreshService cacheRefreshService;

    @BeforeEach
    void setUp() {
        // Reset mocks before each test
        reset(cacheManager, freightCache, countryCache, productCache);
    }

    @Test
    void refreshFreightCache_Success_ClearsCacheSuccessfully() {
        // Given
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);

        // When
        cacheRefreshService.refreshFreightCache();

        // Then
        verify(cacheManager).getCache("freightData");
        verify(freightCache).clear();
    }

    @Test
    void refreshFreightCache_CacheNotFound_DoesNotThrowException() {
        // Given
        when(cacheManager.getCache("freightData")).thenReturn(null);

        // When
        cacheRefreshService.refreshFreightCache();

        // Then
        verify(cacheManager).getCache("freightData");
        verify(freightCache, never()).clear();
    }

    @Test
    void refreshFreightCache_ClearThrowsException_HandlesGracefully() {
        // Given
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);
        doThrow(new RuntimeException("Cache clear failed")).when(freightCache).clear();

        // When
        cacheRefreshService.refreshFreightCache();

        // Then
        verify(cacheManager).getCache("freightData");
        verify(freightCache).clear();
        // Should not throw exception - error is logged
    }

    @Test
    void refreshCountryCache_Success_ClearsCacheSuccessfully() {
        // Given
        when(cacheManager.getCache("countryData")).thenReturn(countryCache);

        // When
        cacheRefreshService.refreshCountryCache();

        // Then
        verify(cacheManager).getCache("countryData");
        verify(countryCache).clear();
    }

    @Test
    void refreshCountryCache_CacheNotFound_DoesNotThrowException() {
        // Given
        when(cacheManager.getCache("countryData")).thenReturn(null);

        // When
        cacheRefreshService.refreshCountryCache();

        // Then
        verify(cacheManager).getCache("countryData");
        verify(countryCache, never()).clear();
    }

    @Test
    void refreshCountryCache_ClearThrowsException_HandlesGracefully() {
        // Given
        when(cacheManager.getCache("countryData")).thenReturn(countryCache);
        doThrow(new RuntimeException("Cache clear failed")).when(countryCache).clear();

        // When
        cacheRefreshService.refreshCountryCache();

        // Then
        verify(cacheManager).getCache("countryData");
        verify(countryCache).clear();
        // Should not throw exception - error is logged
    }

    @Test
    void refreshProductCache_Success_ClearsCacheSuccessfully() {
        // Given
        when(cacheManager.getCache("productData")).thenReturn(productCache);

        // When
        cacheRefreshService.refreshProductCache();

        // Then
        verify(cacheManager).getCache("productData");
        verify(productCache).clear();
    }

    @Test
    void refreshProductCache_CacheNotFound_DoesNotThrowException() {
        // Given
        when(cacheManager.getCache("productData")).thenReturn(null);

        // When
        cacheRefreshService.refreshProductCache();

        // Then
        verify(cacheManager).getCache("productData");
        verify(productCache, never()).clear();
    }

    @Test
    void refreshProductCache_ClearThrowsException_HandlesGracefully() {
        // Given
        when(cacheManager.getCache("productData")).thenReturn(productCache);
        doThrow(new RuntimeException("Cache clear failed")).when(productCache).clear();

        // When
        cacheRefreshService.refreshProductCache();

        // Then
        verify(cacheManager).getCache("productData");
        verify(productCache).clear();
        // Should not throw exception - error is logged
    }

    @Test
    void clearAllCaches_Success_ClearsAllCachesSuccessfully() {
        // Given
        when(cacheManager.getCacheNames()).thenReturn(
            Arrays.asList("freightData", "countryData", "productData"));
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);
        when(cacheManager.getCache("countryData")).thenReturn(countryCache);
        when(cacheManager.getCache("productData")).thenReturn(productCache);

        // When
        cacheRefreshService.clearAllCaches();

        // Then
        verify(freightCache).clear();
        verify(countryCache).clear();
        verify(productCache).clear();
    }

    @Test
    void clearAllCaches_WithNoCaches_DoesNotThrowException() {
        // Given
        when(cacheManager.getCacheNames()).thenReturn(Collections.emptyList());

        // When
        cacheRefreshService.clearAllCaches();

        // Then
        verify(cacheManager).getCacheNames();
        // Should not throw exception
    }

    @Test
    void clearAllCaches_WithNullCache_SkipsNullCache() {
        // Given
        when(cacheManager.getCacheNames()).thenReturn(
            Arrays.asList("freightData", "countryData"));
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);
        when(cacheManager.getCache("countryData")).thenReturn(null);

        // When
        cacheRefreshService.clearAllCaches();

        // Then
        verify(freightCache).clear();
        verify(countryCache, never()).clear();
    }

    @Test
    void clearAllCaches_WithException_HandlesGracefully() {
        // Given
        when(cacheManager.getCacheNames()).thenReturn(
            Arrays.asList("freightData", "countryData"));
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);
        when(cacheManager.getCache("countryData")).thenReturn(countryCache);
        doThrow(new RuntimeException("Clear failed")).when(freightCache).clear();

        // When
        cacheRefreshService.clearAllCaches();

        // Then
        verify(freightCache).clear();
        // Should not throw exception - error is logged
    }

    @Test
    void clearCache_WithValidCacheName_ClearsCacheSuccessfully() {
        // Given
        String cacheName = "freightData";
        when(cacheManager.getCache(cacheName)).thenReturn(freightCache);

        // When
        cacheRefreshService.clearCache(cacheName);

        // Then
        verify(cacheManager).getCache(cacheName);
        verify(freightCache).clear();
    }

    @Test
    void clearCache_WithNonExistentCacheName_LogsWarning() {
        // Given
        String cacheName = "nonExistentCache";
        when(cacheManager.getCache(cacheName)).thenReturn(null);

        // When
        cacheRefreshService.clearCache(cacheName);

        // Then
        verify(cacheManager).getCache(cacheName);
        // Should log warning but not throw exception
    }

    @Test
    void clearCache_WithException_HandlesGracefully() {
        // Given
        String cacheName = "freightData";
        when(cacheManager.getCache(cacheName)).thenReturn(freightCache);
        doThrow(new RuntimeException("Clear failed")).when(freightCache).clear();

        // When
        cacheRefreshService.clearCache(cacheName);

        // Then
        verify(cacheManager).getCache(cacheName);
        verify(freightCache).clear();
        // Should not throw exception - error is logged
    }

    @Test
    void clearCache_WithCountryCache_ClearsCacheSuccessfully() {
        // Given
        String cacheName = "countryData";
        when(cacheManager.getCache(cacheName)).thenReturn(countryCache);

        // When
        cacheRefreshService.clearCache(cacheName);

        // Then
        verify(cacheManager).getCache(cacheName);
        verify(countryCache).clear();
    }

    @Test
    void clearCache_WithProductCache_ClearsCacheSuccessfully() {
        // Given
        String cacheName = "productData";
        when(cacheManager.getCache(cacheName)).thenReturn(productCache);

        // When
        cacheRefreshService.clearCache(cacheName);

        // Then
        verify(cacheManager).getCache(cacheName);
        verify(productCache).clear();
    }

    @Test
    void clearAllCaches_WithMultipleCaches_ClearsInOrder() {
        // Given
        when(cacheManager.getCacheNames()).thenReturn(
            Arrays.asList("cache1", "cache2", "cache3"));
        Cache cache1 = mock(Cache.class);
        Cache cache2 = mock(Cache.class);
        Cache cache3 = mock(Cache.class);
        when(cacheManager.getCache("cache1")).thenReturn(cache1);
        when(cacheManager.getCache("cache2")).thenReturn(cache2);
        when(cacheManager.getCache("cache3")).thenReturn(cache3);

        // When
        cacheRefreshService.clearAllCaches();

        // Then
        verify(cache1).clear();
        verify(cache2).clear();
        verify(cache3).clear();
    }

    @Test
    void refreshFreightCache_CalledMultipleTimes_ClearsCacheEachTime() {
        // Given
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);

        // When
        cacheRefreshService.refreshFreightCache();
        cacheRefreshService.refreshFreightCache();
        cacheRefreshService.refreshFreightCache();

        // Then
        verify(cacheManager, times(3)).getCache("freightData");
        verify(freightCache, times(3)).clear();
    }

    @Test
    void clearCache_WithEmptyString_HandlesGracefully() {
        // Given
        String cacheName = "";
        when(cacheManager.getCache(cacheName)).thenReturn(null);

        // When
        cacheRefreshService.clearCache(cacheName);

        // Then
        verify(cacheManager).getCache(cacheName);
        // Should not throw exception
    }

    @Test
    void clearAllCaches_WithPartialFailure_ContinuesClearing() {
        // Given
        when(cacheManager.getCacheNames()).thenReturn(
            Arrays.asList("freightData", "countryData", "productData"));
        when(cacheManager.getCache("freightData")).thenReturn(freightCache);
        when(cacheManager.getCache("countryData")).thenReturn(countryCache);
        when(cacheManager.getCache("productData")).thenReturn(productCache);

        doNothing().when(freightCache).clear();
        doThrow(new RuntimeException("Clear failed")).when(countryCache).clear();
        doNothing().when(productCache).clear();

        // When
        cacheRefreshService.clearAllCaches();

        // Then
        verify(freightCache).clear();
        verify(countryCache).clear();
        verify(productCache).clear();
        // All caches should be attempted even if one fails
    }
}
