package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
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
    private UUID uid;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "pw_hash", nullable = false)
    private String pwHash;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
