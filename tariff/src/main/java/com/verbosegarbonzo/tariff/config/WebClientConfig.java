package com.verbosegarbonzo.tariff.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {
    // Creates one shared WebClient bean with base URL, timeouts, User-Agent.
    // Every service can inject and reuse it.

    private final WitsProperties props;

    public WebClientConfig(WitsProperties props) {
        this.props = props;
    }

    private HttpClient httpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30000)
                .responseTimeout(Duration.ofSeconds(30))
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(30, TimeUnit.SECONDS))
                            .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS))
                );
    }

    @Bean
    public WebClient metadataWebClient() {
        return WebClient.builder()
                .baseUrl(props.getBaseUrl()) // metadata base url
                .defaultHeader("User-Agent", "TariffApp/1.0")
                .clientConnector(new ReactorClientHttpConnector(httpClient()))
                .build();
    }

    @Bean
    public WebClient tariffWebClient() {
        return WebClient.builder()
                .baseUrl(props.getTariff().getBaseUrl()) // tariff base url
                .defaultHeader("User-Agent", "TariffApp/1.0")
                .clientConnector(new ReactorClientHttpConnector(httpClient()))
                .build();
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(30))
                .setReadTimeout(Duration.ofSeconds(30))
                .defaultHeader("User-Agent", "TariffApp/1.0")
                .build();
    }
}
