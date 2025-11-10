package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for ProfileType enum.
 * Converts between database string values (case-insensitive) and ProfileType enum.
 * Handles both lowercase database values and uppercase enum constant names.
 */
@Converter(autoApply = true)
public class ProfileTypeConverter implements AttributeConverter<ProfileType, String> {

    /**
     * Converts ProfileType enum to database string value (lowercase).
     * @param attribute the ProfileType enum value
     * @return the lowercase database value (e.g., "business_owner")
     */
    @Override
    public String convertToDatabaseColumn(ProfileType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getDbValue();
    }

    /**
     * Converts database string value to ProfileType enum (case-insensitive).
     * @param dbData the string value from database
     * @return the corresponding ProfileType enum
     */
    @Override
    public ProfileType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        // Try to match by dbValue (lowercase from database)
        for (ProfileType profileType : ProfileType.values()) {
            if (profileType.getDbValue().equalsIgnoreCase(dbData)) {
                return profileType;
            }
        }

        // Try to match by enum constant name (case-insensitive)
        try {
            return ProfileType.valueOf(dbData.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Unknown ProfileType value in database: " + dbData);
        }
    }
}
