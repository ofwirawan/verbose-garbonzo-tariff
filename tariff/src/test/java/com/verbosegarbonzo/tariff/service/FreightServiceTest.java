package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.exception.FreightCalculationException;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FreightServiceTest {

    @Mock
    private CountryRepository countryRepository;

    @Mock
    private RestTemplate restTemplate;

    private FreightService freightService;

    private Country testImporter;
    private Country testExporter;

    @BeforeEach
    void setup() {
        freightService = new FreightService(countryRepository, restTemplate);
        ReflectionTestUtils.setField(freightService, "freightApiUrl",
            "https://ship.freightos.com/api/shippingCalculator");

        testImporter = Country.builder()
            .countryCode("SGP")
            .name("Singapore")
            .numericCode("702")
            .city("Singapore,Singapore")
            .build();

        testExporter = Country.builder()
            .countryCode("MYS")
            .name("Malaysia")
            .numericCode("458")
            .city("Kuala Lumpur,Malaysia")
            .build();
    }

    @Test
    void calculateFreight_missingImporter_throwsIAE() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(IllegalArgumentException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));

        verify(countryRepository).findById("SGP");
    }

    @Test
    void calculateFreight_missingExporter_throwsIAE() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(IllegalArgumentException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));

        verify(countryRepository).findById("MYS");
    }

    @Test
    void calculateFreight_missingCity_throwsISE() {
        // Given
        Country importer = Country.builder()
            .countryCode("SGP")
            .name("Singapore")
            .numericCode("702")
            .city(null)
            .build();
        Country exporter = Country.builder()
            .countryCode("MYS")
            .name("Malaysia")
            .numericCode("458")
            .city("Kuala Lumpur,Malaysia")
            .build();

        when(countryRepository.findById("SGP")).thenReturn(Optional.of(importer));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(exporter));

        // When & Then
        assertThrows(IllegalStateException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_missingExporterCity_throwsISE() {
        // Given
        Country exporterNoCity = Country.builder()
            .countryCode("MYS")
            .name("Malaysia")
            .numericCode("458")
            .city(null)
            .build();

        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(exporterNoCity));

        // When & Then
        assertThrows(IllegalStateException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_successfulAirFreight_returnsFreightDetails() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        String mockResponse = createMockFreightResponse(100.0, 200.0);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        // When
        FreightService.FreightDetails result = freightService.calculateFreight("air", "SGP", "MYS", 10.0);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCostMin()).isEqualTo(100.0);
        assertThat(result.getCostMax()).isEqualTo(200.0);
        assertThat(result.getCostAverage()).isEqualTo(150.0);
        assertThat(result.getTransitDays()).isEqualTo(5); // Default for air
    }

    @Test
    void calculateFreight_successfulOceanFreight_returnsFreightDetails() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        String mockResponse = createMockFreightResponse(500.0, 800.0);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        // When
        FreightService.FreightDetails result = freightService.calculateFreight("ocean", "SGP", "MYS", 100.0);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCostMin()).isEqualTo(500.0);
        assertThat(result.getCostMax()).isEqualTo(800.0);
        assertThat(result.getCostAverage()).isEqualTo(650.0);
        assertThat(result.getTransitDays()).isEqualTo(30); // Default for ocean
    }

    @Test
    void calculateFreight_successfulExpressFreight_returnsFreightDetails() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        String mockResponse = createMockFreightResponse(300.0, 400.0);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        // When
        FreightService.FreightDetails result = freightService.calculateFreight("express", "SGP", "MYS", 5.0);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCostMin()).isEqualTo(300.0);
        assertThat(result.getCostMax()).isEqualTo(400.0);
        assertThat(result.getTransitDays()).isEqualTo(2); // Default for express
    }

    @Test
    void calculateFreight_apiReturnsNonOkStatus_throwsException() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR));

        // When & Then
        assertThrows(FreightCalculationException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_apiReturnsNullBody_throwsException() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        // When & Then
        assertThrows(FreightCalculationException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_apiReturnsZeroQuotes_throwsException() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        String mockResponse = "{\"response\":{\"estimatedFreightRates\":{\"numQuotes\":0}}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        // When & Then
        assertThrows(FreightCalculationException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_apiThrowsRestClientException_throwsFreightCalculationException() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RestClientException("API unavailable"));

        // When & Then
        assertThrows(FreightCalculationException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_invalidJsonResponse_throwsFreightCalculationException() {
        // Given
        when(countryRepository.findById("SGP")).thenReturn(Optional.of(testImporter));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(testExporter));

        String mockResponse = "invalid json";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        // When & Then
        assertThrows(FreightCalculationException.class, () ->
            freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void freightDetails_SerializableImplementation_WorksCorrectly() {
        // Given
        FreightService.FreightDetails details = new FreightService.FreightDetails(
            100.0, 150.0, 200.0, 5);

        // Then
        assertThat(details).isInstanceOf(java.io.Serializable.class);
        assertThat(details.getCostMin()).isEqualTo(100.0);
        assertThat(details.getCostAverage()).isEqualTo(150.0);
        assertThat(details.getCostMax()).isEqualTo(200.0);
        assertThat(details.getTransitDays()).isEqualTo(5);
    }

    // Helper method to create mock freight API response
    private String createMockFreightResponse(double min, double max) {
        return String.format("""
            {
              "response": {
                "estimatedFreightRates": {
                  "numQuotes": 1,
                  "mode": {
                    "price": {
                      "min": {
                        "moneyAmount": {
                          "amount": %.2f
                        }
                      },
                      "max": {
                        "moneyAmount": {
                          "amount": %.2f
                        }
                      }
                    }
                  }
                }
              }
            }
            """, min, max);
    }
}
