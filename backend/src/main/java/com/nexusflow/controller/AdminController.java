package com.nexusflow.controller;

import com.nexusflow.dto.PagedResponse;
import com.nexusflow.dto.ProjectRequest;
import com.nexusflow.dto.ProjectResponse;
import com.nexusflow.dto.RegisterRequest;
import com.nexusflow.dto.UserDTO;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.service.AuditLogService;
import com.nexusflow.service.AuthService;
import com.nexusflow.service.ProjectService;
import com.nexusflow.service.UserService;
import com.nexusflow.entity.AuditLog;
import com.nexusflow.entity.User;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only endpoints.
 * Access restricted to users with ROLE_ADMIN via method-level security.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final ProjectService projectService;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    public AdminController(UserService userService, ProjectService projectService, AuditLogService auditLogService, AuthService authService) {
        this.userService = userService;
        this.projectService = projectService;
        this.auditLogService = auditLogService;
        this.authService = authService;
    }

    /**
     * GET /api/admin/users
     * Returns all registered users in the system.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(), "Users retrieved successfully"));
    }

    /**
     * GET /api/admin/projects?page=0&size=10&sort=createdAt,desc
     * Returns all projects with pagination.
     */
    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.success(
                projectService.getAllProjects(pageable), "Projects retrieved successfully"));
    }

    /**
     * POST /api/admin/projects
     * Creates a new project in the system in DRAFT status – Admin only.
     */
    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(@Valid @RequestBody ProjectRequest request,
                                                                      @AuthenticationPrincipal User loggedInUser) {
        ProjectResponse response = projectService.createProject(request, loggedInUser.getId());
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Project created successfully"));
    }

    /**
     * DELETE /api/admin/user/{id}
     * Soft-deletes a user (sets active = false).
     */
    @DeleteMapping("/user/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated successfully"));
    }

    /**
     * POST /api/admin/user
     * Creates a new user in the system – Admin only.
     */
    @PostMapping("/user")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@RequestBody RegisterRequest request) {
        // Reuse registration logic but return DTO instead of AuthResponse
        authService.register(request); 
        // We could return the DTO directly if register returned it, but let's just fetch it back or assume success
        // Register returns AuthResponse which has the user details.
        return ResponseEntity.ok(ApiResponse.success(null, "User created successfully"));
    }

    /**
     * GET /api/admin/user/{id}
     * Returns a single user's profile.
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id), "User retrieved successfully"));
    }

    /**
     * GET /api/admin/audit-logs
     * Returns system-wide audit logs with pagination.
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AuditLog> logPage = auditLogService.getAllAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(logPage), "Audit logs retrieved successfully"));
    }
}
