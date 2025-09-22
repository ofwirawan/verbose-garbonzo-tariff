package com.verbosegarbonzo.tariff.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    private final WitsProperties props;

    public WebClientConfig(WitsProperties props) {
        this.props = props;
    }

    @Bean
    public WebClient witsWebClient() {
        HttpClient httpClient = HttpClient.create()
                // connection timeout (5 seconds)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                // response timeout (5 seconds)
                .responseTimeout(Duration.ofSeconds(5))
                // read/write timeouts
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(5, TimeUnit.SECONDS))
                            .addHandlerLast(new WriteTimeoutHandler(5, TimeUnit.SECONDS))
                );

        return WebClient.builder()
                .baseUrl(props.getBaseUrl()) // from application.properties
                .defaultHeader("User-Agent", "TariffApp/1.0")
                .clientConnector(new ReactorClientHttpConnector(httpClient)) // ✅ correct class
                .build();
    }
}
