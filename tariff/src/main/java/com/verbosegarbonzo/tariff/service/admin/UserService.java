package com.verbosegarbonzo.tariff.service.admin;

import com.verbosegarbonzo.tariff.model.User;
import com.verbosegarbonzo.tariff.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Create new User
    @Transactional
    public User create(User user) {
        return userRepository.save(user);
    }

    // Get all Users (paginated)
    @Transactional(readOnly = true)
    public Page<User> getAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    // Get User by ID
    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id " + id));
    }

    // Update User by ID
    @Transactional
    public User update(UUID id, User updatedUser) {
        User user = getById(id);
        user.setEmail(updatedUser.getEmail());
        user.setPwHash(updatedUser.getPwHash());
        user.setCreatedAt(updatedUser.getCreatedAt());
        return userRepository.save(user);
    }

    // Delete User by ID
    @Transactional
    public void deleteById(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new NoSuchElementException("User not found with id " + id);
        }
        userRepository.deleteById(id);
    }
}
