package com.verbosegarbonzo.tariff.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tariffOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TARIFF API")
                        .description("Trade Agreements Regulating Imports and Foreign Fees - REST API")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("TARIFF Team")
                                .email("support@tariff.com")
                                .url("https://tariff.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
