package com.verbosegarbonzo.tariff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.Setter;

/**
 * ML Model Configuration Properties.
 * Maps application.properties values into Java fields for ML model settings.
 * Keeps ML model configuration centralized and configurable, no hardcoding in code.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.ml")
public class MLModelProperties {

    private Model model = new Model();
    private Training training = new Training();

    @Getter
    @Setter
    public static class Model {
        private boolean enabled = true;
        private String path = "./models";
        private String version = "1.0.0";
        private int minTrainingSamples = 30;
    }

    @Getter
    @Setter
    public static class Training {
        private Schedule schedule = new Schedule();

        @Getter
        @Setter
        public static class Schedule {
            private String cron = "0 0 2 ? * SUN";
        }
    }
}
