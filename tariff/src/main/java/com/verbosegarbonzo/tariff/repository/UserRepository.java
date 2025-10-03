package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.User;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {}
