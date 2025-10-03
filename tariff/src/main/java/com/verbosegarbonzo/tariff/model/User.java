package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "\"user\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "uid", columnDefinition = "uuid")
    @NotNull
    private UUID uid;

    @Column(name = "email", nullable = false, unique = true)
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @Column(name = "pw_hash", nullable = false)
    @NotBlank(message = "Password hash is required")
    private String pwHash;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
