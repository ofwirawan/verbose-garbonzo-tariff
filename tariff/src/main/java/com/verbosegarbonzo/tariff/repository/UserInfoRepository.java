package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.UserInfo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;



public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {
    Optional<UserInfo> findByEmail(String email); // Use 'email' if that is the correct field for login
}