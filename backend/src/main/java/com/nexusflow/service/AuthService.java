package com.nexusflow.service;

import com.nexusflow.dto.AuthRequest;
import com.nexusflow.dto.AuthResponse;
import com.nexusflow.dto.RegisterRequest;
import com.nexusflow.entity.Role;
import com.nexusflow.entity.User;
import com.nexusflow.exception.BusinessException;
import com.nexusflow.exception.ResourceNotFoundException;
import com.nexusflow.repository.UserRepository;
import com.nexusflow.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles user registration and JWT-based authentication.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Registers a new user in the system.
     * - Validates email uniqueness
     * - Encodes password with BCrypt
     * - Associates manager if role is EMPLOYEE
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already registered: " + request.getEmail());
        }

        User.Builder builder = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(true)
                .department(request.getDepartment())
                .skills(request.getSkills());

        // Assign manager if registering as EMPLOYEE
        if (request.getRole() == Role.EMPLOYEE && request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager", request.getManagerId()));

            if (manager.getRole() != Role.MANAGER) {
                throw new BusinessException("Specified manager does not have the MANAGER role");
            }
            builder.manager(manager);
        }

        User saved = userRepository.save(builder.build());
        log.info("User registered: {} [{}]", saved.getEmail(), saved.getRole());

        String token = jwtUtil.generateToken(saved, saved.getId(), saved.getRole().name());
        return buildAuthResponse(saved, token);
    }

    /**
     * Authenticates a user and returns a JWT token.
     */
    public AuthResponse login(AuthRequest request) {
        // Throws BadCredentialsException if invalid – handled globally
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getEmail()));

        log.info("User logged in: {} [{}]", user.getEmail(), user.getRole());

        String token = jwtUtil.generateToken(user, user.getId(), user.getRole().name());
        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
