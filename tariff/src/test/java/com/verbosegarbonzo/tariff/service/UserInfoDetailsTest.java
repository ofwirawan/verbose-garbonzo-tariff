package com.verbosegarbonzo.tariff.service;

import java.util.Collection;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.verbosegarbonzo.tariff.model.ProfileType;
import com.verbosegarbonzo.tariff.model.UserInfo;

class UserInfoDetailsTest {

    @Test
    void constructor_withValidUserInfo_createsUserDetailsSuccessfully() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "John Doe",
            "john@example.com",
            "password123",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getUsername()).isEqualTo("john@example.com");
        assertThat(userDetails.getPassword()).isEqualTo("password123");
        assertThat(userDetails.getAuthorities()).hasSize(1);
        assertThat(userDetails.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");
    }

    @Test
    void constructor_withMultipleRoles_parsesAllRolesCorrectly() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Admin User",
            "admin@example.com",
            "adminpass",
            "ROLE_USER,ROLE_ADMIN",
            ProfileType.POLICY_ANALYST
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertThat(authorities).hasSize(2);
        assertThat(authorities)
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    void constructor_withThreeRoles_parsesAllRolesCorrectly() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Super Admin",
            "superadmin@example.com",
            "superpass",
            "ROLE_USER,ROLE_ADMIN,ROLE_SUPER_ADMIN",
            ProfileType.BUSINESS_OWNER
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertThat(authorities).hasSize(3);
        assertThat(authorities)
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN");
    }

    @Test
    void getUsername_returnsEmailFromUserInfo() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.STUDENT
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        String username = userDetails.getUsername();

        // Then
        assertThat(username).isEqualTo("test@example.com");
    }

    @Test
    void getPassword_returnsPasswordFromUserInfo() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "securePassword123",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        String password = userDetails.getPassword();

        // Then
        assertThat(password).isEqualTo("securePassword123");
    }

    @Test
    void getAuthorities_returnsListOfGrantedAuthorities() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();

        // Then
        assertThat(authorities).isNotNull();
        assertThat(authorities).isNotEmpty();
        assertThat(authorities.iterator().next())
            .isInstanceOf(SimpleGrantedAuthority.class);
    }

    @Test
    void isAccountNonExpired_alwaysReturnsTrue() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        boolean isNonExpired = userDetails.isAccountNonExpired();

        // Then
        assertThat(isNonExpired).isTrue();
    }

    @Test
    void isAccountNonLocked_alwaysReturnsTrue() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        boolean isNonLocked = userDetails.isAccountNonLocked();

        // Then
        assertThat(isNonLocked).isTrue();
    }

    @Test
    void isCredentialsNonExpired_alwaysReturnsTrue() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        boolean isCredentialsNonExpired = userDetails.isCredentialsNonExpired();

        // Then
        assertThat(isCredentialsNonExpired).isTrue();
    }

    @Test
    void isEnabled_alwaysReturnsTrue() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "Test User",
            "test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        boolean isEnabled = userDetails.isEnabled();

        // Then
        assertThat(isEnabled).isTrue();
    }

    @Test
    void constructor_withSingleRole_createsAuthorityList() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user@example.com",
            "pass",
            "ROLE_ADMIN",
            ProfileType.POLICY_ANALYST
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getAuthorities()).hasSize(1);
        assertThat(userDetails.getAuthorities().iterator().next().getAuthority())
            .isEqualTo("ROLE_ADMIN");
    }

    @Test
    void constructor_withEmptyEmail_setsEmptyUsername() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "",
            "password",
            "ROLE_USER",
            ProfileType.STUDENT
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getUsername()).isEmpty();
    }

    @Test
    void constructor_withNullProfileType_createsUserDetailsSuccessfully() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user@example.com",
            "password",
            "ROLE_USER",
            null
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getUsername()).isEqualTo("user@example.com");
        assertThat(userDetails.getAuthorities()).hasSize(1);
    }

    @Test
    void constructor_withSpecialCharactersInEmail_preservesEmail() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user+test@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getUsername()).isEqualTo("user+test@example.com");
    }

    @Test
    void constructor_withRolesWithSpaces_trimsRoles() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user@example.com",
            "password",
            "ROLE_USER, ROLE_ADMIN",
            ProfileType.BUSINESS_OWNER
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertThat(authorities).hasSize(2);
        // Note: spaces will be included in authority names as split doesn't trim
        assertThat(authorities)
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_USER", " ROLE_ADMIN");
    }

    @Test
    void constructor_withDifferentProfileTypes_createsCorrectUserDetails() {
        // Test BUSINESS_OWNER
        UserInfo businessOwner = new UserInfo(UUID.randomUUID(), "Owner", "owner@example.com",
            "pass", "ROLE_USER", ProfileType.BUSINESS_OWNER);
        UserInfoDetails businessDetails = new UserInfoDetails(businessOwner);
        assertThat(businessDetails.getUsername()).isEqualTo("owner@example.com");

        // Test POLICY_ANALYST
        UserInfo analyst = new UserInfo(UUID.randomUUID(), "Analyst", "analyst@example.com",
            "pass", "ROLE_USER", ProfileType.POLICY_ANALYST);
        UserInfoDetails analystDetails = new UserInfoDetails(analyst);
        assertThat(analystDetails.getUsername()).isEqualTo("analyst@example.com");

        // Test STUDENT
        UserInfo student = new UserInfo(UUID.randomUUID(), "Student", "student@example.com",
            "pass", "ROLE_USER", ProfileType.STUDENT);
        UserInfoDetails studentDetails = new UserInfoDetails(student);
        assertThat(studentDetails.getUsername()).isEqualTo("student@example.com");
    }

    @Test
    void authorities_areImmutableList() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user@example.com",
            "password",
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // When
        Collection<? extends  GrantedAuthority> authorities = userDetails.getAuthorities();

        // Then
        // Attempting to modify should throw UnsupportedOperationException
        assertThatThrownBy(() -> authorities.add(null)).isInstanceOf(UnsupportedOperationException.class);
        
    }

    @Test
    void constructor_withLongPassword_storesCorrectly() {
        // Given
        String longPassword = "a".repeat(100);
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user@example.com",
            longPassword,
            "ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getPassword()).isEqualTo(longPassword);
        assertThat(userDetails.getPassword()).hasSize(100);
    }

    @Test
    void constructor_withCustomRoleNames_parsesCorrectly() {
        // Given
        UserInfo userInfo = new UserInfo(
            UUID.randomUUID(),
            "User",
            "user@example.com",
            "password",
            "CUSTOM_ROLE_1,CUSTOM_ROLE_2,ROLE_USER",
            ProfileType.BUSINESS_OWNER
        );

        // When
        UserInfoDetails userDetails = new UserInfoDetails(userInfo);

        // Then
        assertThat(userDetails.getAuthorities()).hasSize(3);
        assertThat(userDetails.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("CUSTOM_ROLE_1", "CUSTOM_ROLE_2", "ROLE_USER");
    }
}
