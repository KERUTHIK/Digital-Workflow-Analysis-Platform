package com.nexusflow.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Represents an application user.
 * Implements UserDetails for Spring Security integration.
 * Uses explicit getters/setters (no Lombok on entity) to avoid annotation
 * processing conflicts between Lombok, JPA, and UserDetails interface.
 */
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 100)
    private String department;

    @Column(length = 255)
    private String skills;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Constructors ─────────────────────────────────────────────────────────

    public User() {}

    public User(Long id, String name, String email, String password,
                Role role, User manager, Boolean active, String department, String skills, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.manager = manager;
        this.active = active;
        this.department = department;
        this.skills = skills;
        this.createdAt = createdAt;
    }

    // ── JPA Lifecycle ────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.active == null) this.active = true;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                         { return id; }
    public void setId(Long id)                  { this.id = id; }

    public String getName()                     { return name; }
    public void setName(String name)            { this.name = name; }

    public String getEmail()                    { return email; }
    public void setEmail(String email)          { this.email = email; }

    public Role getRole()                       { return role; }
    public void setRole(Role role)              { this.role = role; }

    public User getManager()                    { return manager; }
    public void setManager(User manager)        { this.manager = manager; }

    public Boolean getActive()                  { return active; }
    public void setActive(Boolean active)       { this.active = active; }

    public String getDepartment()               { return department; }
    public void setDepartment(String d)         { this.department = d; }

    public String getSkills()                   { return skills; }
    public void setSkills(String s)             { this.skills = s; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime t)   { this.createdAt = t; }

    // ── UserDetails contract ─────────────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() { return password; }

    public void setPassword(String password) { this.password = password; }

    @Override
    public String getUsername()               { return email; }

    @Override
    public boolean isAccountNonExpired()      { return true; }

    @Override
    public boolean isAccountNonLocked()       { return true; }

    @Override
    public boolean isCredentialsNonExpired()  { return true; }

    @Override
    public boolean isEnabled()                { return Boolean.TRUE.equals(active); }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String password;
        private Role role;
        private User manager;
        private Boolean active = true;
        private String department;
        private String skills;
        private LocalDateTime createdAt;

        public Builder id(Long id)                  { this.id = id; return this; }
        public Builder name(String name)            { this.name = name; return this; }
        public Builder email(String email)          { this.email = email; return this; }
        public Builder password(String password)    { this.password = password; return this; }
        public Builder role(Role role)              { this.role = role; return this; }
        public Builder manager(User manager)        { this.manager = manager; return this; }
        public Builder active(Boolean active)       { this.active = active; return this; }
        public Builder department(String d)         { this.department = d; return this; }
        public Builder skills(String s)             { this.skills = s; return this; }

        public User build() {
            User u = new User();
            u.id = this.id;
            u.name = this.name;
            u.email = this.email;
            u.password = this.password;
            u.role = this.role;
            u.manager = this.manager;
            u.active = this.active;
            u.department = this.department;
            u.skills = this.skills;
            return u;
        }
    }
}
