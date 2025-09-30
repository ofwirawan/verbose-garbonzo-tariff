package com.verbosegarbonzo.tariff.exception;

public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String msg) {
        super(msg);
    }
}