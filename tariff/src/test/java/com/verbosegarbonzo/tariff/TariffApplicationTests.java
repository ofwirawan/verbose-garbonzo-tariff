package com.verbosegarbonzo.tariff;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "spring.jackson.serialization.write-dates-as-timestamps=false",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
class TariffApplicationTests {

	@Test
	void contextLoads() {
	}

}
