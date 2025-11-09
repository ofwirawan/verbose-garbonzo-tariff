package com.verbosegarbonzo.tariff.model;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(using = ProfileTypeDeserializer.class)
public enum ProfileType {
    BUSINESS_OWNER("business_owner"),
    POLICY_ANALYST("policy_analyst"),
    STUDENT("student");

    private final String dbValue;

    ProfileType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }
}
