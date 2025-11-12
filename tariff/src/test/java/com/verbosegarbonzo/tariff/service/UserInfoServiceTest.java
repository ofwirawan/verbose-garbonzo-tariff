package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
class UserInfoServiceTest {
    @Mock
    private UserInfoRepository userInfoRepository;

    @Mock
    private PasswordEncoder encoder;

    private UserInfoService service;

    @BeforeEach
    void setup() {
        service = new UserInfoService(userInfoRepository, encoder);
    }

    @Test
    void loadUserByUsername_userFound_returnsUserDetails() {
        UserInfo u = new UserInfo();
        u.setUid(UUID.randomUUID());
        u.setEmail("a@example.com");
        u.setPassword("hashed");
        u.setRoles("ROLE_USER,ROLE_ADMIN");
        when(userInfoRepository.findByEmail("a@example.com")).thenReturn(Optional.of(u));

        var details = service.loadUserByUsername("a@example.com");
        assertEquals("a@example.com", details.getUsername());
        assertEquals("hashed", details.getPassword());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void loadUserByUsername_missing_throws() {
        when(userInfoRepository.findByEmail("none@example.com")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("none@example.com"));
    }

    @Test
    void addUser_encodesPassword_andSaves() {
        UserInfo u = new UserInfo();
        u.setEmail("b@example.com");
        u.setPassword("plain");

        when(encoder.encode("plain")).thenReturn("ENCODED");

        String msg = service.addUser(u);
        assertEquals("User added successfully!", msg);

        ArgumentCaptor<UserInfo> captor = ArgumentCaptor.forClass(UserInfo.class);
        verify(userInfoRepository, times(1)).save(captor.capture());
        assertEquals("ENCODED", captor.getValue().getPassword());
    }
}


