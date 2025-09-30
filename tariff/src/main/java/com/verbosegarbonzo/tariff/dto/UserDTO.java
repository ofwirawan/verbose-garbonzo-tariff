package com.verbosegarbonzo.tariff.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID uid;
    private String email;
    private String pwHash;
    private OffsetDateTime createdAt;
}
