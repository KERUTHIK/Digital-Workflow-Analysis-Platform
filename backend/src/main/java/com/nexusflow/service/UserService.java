package com.nexusflow.service;

import com.nexusflow.dto.UserDTO;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ResourceNotFoundException;
import com.nexusflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for user management (Admin and Manager use cases).
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns all registered users – Admin only.
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Soft-deletes a user by marking them inactive – Admin only.
     * Prevents deletion of the last ADMIN in the system.
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setActive(false);
        userRepository.save(user);
        log.info("User soft-deleted: {} [id={}]", user.getEmail(), user.getId());
    }

    /**
     * Returns all employees whose manager_id = managerId OR who are in a team managed by managerId.
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getTeam(Long managerId) {
        return userRepository.findByManagerIdOrTeamManagerId(managerId)
                .stream()
                .map(UserDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Returns a specific user's profile.
     */
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return UserDTO.from(user);
    }
}
