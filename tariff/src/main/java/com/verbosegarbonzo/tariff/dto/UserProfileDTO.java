package com.verbosegarbonzo.tariff.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private UUID uid;
    private String name;
    private String email;
    private String roles;
    private String profileType;
}
