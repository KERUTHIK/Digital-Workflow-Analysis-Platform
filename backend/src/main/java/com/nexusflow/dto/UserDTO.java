package com.nexusflow.dto;

import com.nexusflow.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;
import java.util.Collections;

public class UserDTO {

    private Long id;
    private String name;
    private String email;
    private String role;
    private Boolean active;
    private Long managerId;
    private String managerName;
    private String department;
    private java.util.List<String> skills;
    private LocalDateTime createdAt;

    public UserDTO() {}

    public UserDTO(Long id, String name, String email, String role, Boolean active,
                   Long managerId, String managerName, String department, java.util.List<String> skills, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.active = active;
        this.managerId = managerId;
        this.managerName = managerName;
        this.department = department;
        this.skills = skills;
        this.createdAt = createdAt;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public java.util.List<String> getSkills() { return skills; }
    public void setSkills(java.util.List<String> skills) { this.skills = skills; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // ── Static Factory ───────────────────────────────────────────────────────

    public static UserDTO from(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.getActive())
                .managerId(user.getManager() != null ? user.getManager().getId() : null)
                .managerName(user.getManager() != null ? user.getManager().getName() : null)
                .department(user.getDepartment())
                .skills(user.getSkills() != null 
                    ? java.util.Arrays.asList(user.getSkills().split("\\s*,\\s*")) 
                    : java.util.Collections.emptyList())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String role;
        private Boolean active;
        private Long managerId;
        private String managerName;
        private String department;
        private java.util.List<String> skills;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder managerId(Long id) { this.managerId = id; return this; }
        public Builder managerName(String name) { this.managerName = name; return this; }
        public Builder department(String d) { this.department = d; return this; }
        public Builder skills(java.util.List<String> s) { this.skills = s; return this; }
        public Builder createdAt(LocalDateTime t) { this.createdAt = t; return this; }

        public UserDTO build() {
            return new UserDTO(id, name, email, role, active, managerId, managerName, department, skills, createdAt);
        }
    }
}
