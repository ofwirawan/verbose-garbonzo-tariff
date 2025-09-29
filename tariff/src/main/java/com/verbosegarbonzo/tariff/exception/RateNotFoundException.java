package com.verbosegarbonzo.tariff.exception;

public class RateNotFoundException extends RuntimeException {
    public RateNotFoundException(String msg) {
        super(msg);
    }
}