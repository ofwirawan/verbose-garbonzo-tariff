package com.verbosegarbonzo.tariff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "wits")
public class WitsProperties {

    private String baseUrl;

    private Metadata metadata = new Metadata();
    private Tariff tariff = new Tariff();

    @Getter
    @Setter
    public static class Metadata {
        private String country;
        private String product;
    }

    @Getter
    @Setter
    public static class Tariff {
        private String baseUrl;
        private String dataset;
    }
}
