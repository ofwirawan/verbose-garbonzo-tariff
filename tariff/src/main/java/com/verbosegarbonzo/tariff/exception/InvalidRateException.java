package com.verbosegarbonzo.tariff.exception;

public class InvalidRateException extends RuntimeException {

    public InvalidRateException(String msg) {
        super(msg);
    }
}