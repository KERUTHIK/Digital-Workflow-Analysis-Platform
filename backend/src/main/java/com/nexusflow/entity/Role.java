package com.nexusflow.entity;

/**
 * Application roles for RBAC.
 * ADMIN     – full system access
 * MANAGER   – approves/rejects team projects
 * EMPLOYEE  – creates and manages own projects
 */
public enum Role {
    ADMIN,
    MANAGER,
    EMPLOYEE
}
