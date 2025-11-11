package com.verbosegarbonzo.tariff.model;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

/**
 * Custom JSON deserializer for ProfileType enum.
 * Handles case-insensitive deserialization to support both database values
 * (lowercase: "business_owner", "policy_analyst", "student") and enum constant names
 * (uppercase: "BUSINESS_OWNER", "POLICY_ANALYST", "STUDENT").
 */
public class ProfileTypeDeserializer extends JsonDeserializer<ProfileType> {

    @Override
    public ProfileType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();

        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        // Try to match by dbValue (lowercase from database)
        for (ProfileType profileType : ProfileType.values()) {
            if (profileType.getDbValue().equalsIgnoreCase(value)) {
                return profileType;
            }
        }

        // Try to match by enum constant name (case-insensitive)
        try {
            return ProfileType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // If no match found, default to BUSINESS_OWNER or throw error
            throw new RuntimeException("Unknown ProfileType value: " + value);
        }
    }
}
