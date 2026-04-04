-- ============================================================
-- NexusFlow – MySQL Schema
-- Database: nexusflow
-- ============================================================

CREATE DATABASE IF NOT EXISTS nexusflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nexusflow;

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    role        ENUM('ADMIN','MANAGER','EMPLOYEE') NOT NULL,
    manager_id  BIGINT          NULL,
    active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT fk_users_manager
        FOREIGN KEY (manager_id) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Projects ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NULL,
    client_name     VARCHAR(150)    NULL,
    budget          DECIMAL(15,2)   NULL,
    status          ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    current_stage   VARCHAR(100)    NULL,
    created_by      BIGINT          NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_projects_created_by (created_by),
    INDEX idx_projects_status (status),
    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Approvals ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    project_id      BIGINT      NOT NULL,
    reviewer_id     BIGINT      NOT NULL,
    status          ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    comment         TEXT        NULL,
    action_time     DATETIME    NULL,
    sla_deadline    DATETIME    NULL,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_approvals_project  (project_id),
    INDEX idx_approvals_reviewer (reviewer_id),
    INDEX idx_approvals_status   (status),
    CONSTRAINT fk_approvals_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_approvals_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users (id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Audit Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    action      VARCHAR(100) NOT NULL,
    project_id  BIGINT      NULL,
    old_status  VARCHAR(20) NULL,
    new_status  VARCHAR(20) NULL,
    timestamp   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_audit_user    (user_id),
    INDEX idx_audit_project (project_id),
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_audit_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Sample seed data (optional – comment out for clean start)
-- Password for all = "password123" (BCrypt encoded)
-- ============================================================

INSERT INTO users (id, name, email, password, role, manager_id, active, created_at) VALUES
  (1, 'keruthik', 'admin@nexusflow.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'ADMIN', NULL, TRUE, CURRENT_TIMESTAMP),
  (2, 'Alice Manager', 'alice@nexusflow.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'MANAGER', NULL, TRUE, CURRENT_TIMESTAMP),
  (3, 'Bob Employee', 'bob@nexusflow.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', 2, TRUE, CURRENT_TIMESTAMP),
  (4, 'Kishore', 'kishore@gmail.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', NULL, TRUE, CURRENT_TIMESTAMP),
  (5, 'Sarah Jenkins', 'sarah@gmail.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'MANAGER', NULL, TRUE, CURRENT_TIMESTAMP),
  (6, 'Employee One', 'employee1@gmail.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', 5, TRUE, CURRENT_TIMESTAMP),
  (7, 'Employee Two', 'employee2@gmail.com',
   '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', NULL, TRUE, CURRENT_TIMESTAMP);

-- Add Sarah's team and assign employees
INSERT INTO teams (id, name, department, color, description, manager_id, created_at)
VALUES (1, 'Engineering Alpha', 'Engineering', 'blue', 'Main engineering team', 5, CURRENT_TIMESTAMP);

INSERT INTO team_members (team_id, user_id)
VALUES (1, 6), (1, 7);

-- Add some projects
INSERT INTO projects (id, title, description, client_name, budget, status, current_stage, created_by, assigned_team_id)
VALUES 
  (1, 'Alpha Rewrite', 'Rewriting legacy code', 'Internal', 50000.00, 'SUBMITTED', 'Tech Review', 6, 1),
  (2, 'Beta Launch', 'New feature launch', 'Acme Corp', 120000.00, 'APPROVED', 'Final Sign-off', 7, 1);

