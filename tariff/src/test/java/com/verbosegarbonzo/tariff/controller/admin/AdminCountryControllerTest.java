package com.verbosegarbonzo.tariff.controller.admin;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;


import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.service.UserInfoService;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN"
})
@DisplayName("Admin Country Controller Integration Tests")
class AdminCountryControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private UserInfoService userInfoService;

    @Autowired
    private JwtService jwtService;

    private String adminJwtToken;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        // Clean database before each test
        countryRepository.deleteAll();
        userInfoRepository.deleteAll();
        
        System.out.println(userInfoService.addUser(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN")));

        // Authenticate using the actual AuthController and get JWT token
        adminJwtToken = jwtService.generateToken("admin@email.com");
        System.out.println("Bearer: " + adminJwtToken);
    }

    @Test
    @DisplayName("Should create country if country does not exist")
    void createCountry_ShouldCreateCountryIfCountryDoesNotExist() {
        String newCountryJSON = """
                              {
                                "countryCode": "NGK",
                                "name": "Neghurtalia",
                                "numericCode": "067"
                              }
                              """;
        given()
            .auth()
            .oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(newCountryJSON)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(201)
            .contentType(ContentType.JSON)
            .body("numericCode", equalTo("067"))
            .body("countryCode", equalTo("NGK"))
            .body("name", equalTo("Neghurtalia"));

        // Assert
        var countries = countryRepository.findAll();
        assert countries.size() == 1;
        assert countries.get(0).getCountryCode().equals("NGK");
    }

    @Test
    @DisplayName("Should return 400 when creating country with invalid data")
    void createCountry_ShouldReturn400WhenDataIsInvalid() {
        String invalidCountryJSON = """
                              {
                                "countryCode": "",
                                "name": "",
                                "numericCode": "invalid"
                              }
                              """;
        given()
            .auth()
            .oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(invalidCountryJSON)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(400);
    }

    @Test
    @DisplayName("Should return 403 when token is missing")
    void createCountry_ShouldReturn403WhenTokenIsMissing() {
        String newCountryJSON = """
                              {
                                "countryCode": "NGK",
                                "name": "Neghurtalia",
                                "numericCode": "067"
                              }
                              """;
        given()
            .contentType(ContentType.JSON)
            .body(newCountryJSON)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(403);



        var countries = countryRepository.findAll();
        assert countries.size() == 0;
    }

    @Test
    @DisplayName("Should return 409 when creating country with duplicate numeric code")
    void createCountry_ShouldReturn409WhenNumericCodeDuplicate() {
        String firstCountry = """
                              {
                                "countryCode": "ABC",
                                "name": "Firstland",
                                "numericCode": "123"
                              }
                              """;
        String duplicateNumeric = """
                              {
                                "countryCode": "DEF",
                                "name": "Secondland",
                                "numericCode": "123"
                              }
                              """;

        // create first
        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(firstCountry)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(201);

        // attempt duplicate
        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(duplicateNumeric)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(409);

        var countries = countryRepository.findAll();
        assert countries.size() == 1;
    }

    @Test
    @DisplayName("Should get, update and delete a country")
    void getUpdateDeleteFlow() {
        String countryJson = """
                              {
                                "countryCode": "GHI",
                                "name": "Flowland",
                                "numericCode": "200"
                              }
                              """;

        // Create
        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(countryJson)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(201);

        // GET
        given()
            .auth().oauth2(adminJwtToken)
            .when()
            .get("/api/admin/countries/GHI")
        .then()
            .statusCode(200)
            .body("countryCode", equalTo("GHI"))
            .body("numericCode", equalTo("200"));

        // UPDATE
        String updated = """
                              {
                                "countryCode": "GHI",
                                "name": "Flowlandia",
                                "numericCode": "201"
                              }
                              """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(updated)
        .when()
            .put("/api/admin/countries/GHI")
        .then()
            .statusCode(200)
            .body("name", equalTo("Flowlandia"))
            .body("numericCode", equalTo("201"));

        // DELETE
        given()
            .auth().oauth2(adminJwtToken)
            .when()
            .delete("/api/admin/countries/GHI")
        .then()
            .statusCode(204);

        assert countryRepository.existsById("GHI") == false;
    }

    @Test
    @DisplayName("Should return 409 when updating country to a numeric code that already exists")
    void updateCountry_ShouldReturn409WhenNumericConflict() {
        // create two countries
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("AAA", "Aland", "111"));
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("BBB", "Bland", "222"));

        // try to update BBB to numericCode 111 which is used by AAA
        String updatePayload = """
                              {
                                "countryCode": "BBB",
                                "name": "BlandUpdated",
                                "numericCode": "111"
                              }
                              """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(updatePayload)
        .when()
            .put("/api/admin/countries/BBB")
        .then()
            .statusCode(409);
    }

    @Test
    @DisplayName("Delete non-existent country returns 404")
    void deleteCountry_ShouldReturn404WhenNotFound() {
        given()
            .auth().oauth2(adminJwtToken)
            .when()
            .delete("/api/admin/countries/NOPE")
        .then()
            .statusCode(404);
    }

}
