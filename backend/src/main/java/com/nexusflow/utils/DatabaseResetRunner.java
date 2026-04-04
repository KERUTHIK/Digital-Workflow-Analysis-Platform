package com.nexusflow.utils;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
// @Component intentionally disabled — was wiping all DB tables on every startup
// Re-enable only for local dev seed reset (and remove after use)
// @Component
public class DatabaseResetRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseResetRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("========== RUNNING DATABASE RESET ==========");
        
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        
        jdbcTemplate.execute("TRUNCATE TABLE users");
        jdbcTemplate.execute("TRUNCATE TABLE projects");
        jdbcTemplate.execute("TRUNCATE TABLE teams");
        jdbcTemplate.execute("TRUNCATE TABLE team_members");
        jdbcTemplate.execute("TRUNCATE TABLE approvals");
        jdbcTemplate.execute("TRUNCATE TABLE audit_logs");
        
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        // using "$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg." which is "123456" for ALL users
        jdbcTemplate.execute("INSERT INTO users (id, name, email, password, role, manager_id, active, created_at) VALUES " +
            "(1, 'keruthik', 'admin@nexusflow.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'ADMIN', NULL, TRUE, CURRENT_TIMESTAMP), " +
            "(2, 'Alice Manager', 'alice@nexusflow.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'MANAGER', NULL, TRUE, CURRENT_TIMESTAMP), " +
            "(3, 'Bob Employee', 'bob@nexusflow.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', 2, TRUE, CURRENT_TIMESTAMP), " +
            "(4, 'Kishore', 'kishore@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', NULL, TRUE, CURRENT_TIMESTAMP), " +
            "(5, 'Sarah Jenkins', 'sarah@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'MANAGER', NULL, TRUE, CURRENT_TIMESTAMP), " +
            "(6, 'Employee One', 'employee1@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', 5, TRUE, CURRENT_TIMESTAMP), " +
            "(7, 'Employee Two', 'employee2@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', NULL, TRUE, CURRENT_TIMESTAMP)");

        jdbcTemplate.execute("INSERT INTO teams (id, name, department, color, description, manager_id, created_at) VALUES " +
            "(1, 'Engineering Alpha', 'Engineering', 'blue', 'Main engineering team', 5, CURRENT_TIMESTAMP)");

        jdbcTemplate.execute("INSERT INTO team_members (team_id, user_id) VALUES (1, 6), (1, 7)");
        
        jdbcTemplate.execute("INSERT INTO projects (id, title, description, client_name, budget, status, current_stage, created_by, team_id, created_at) VALUES " +
            "(1, 'Alpha Rewrite', 'Rewriting legacy code', 'Internal', 50000.00, 'SUBMITTED', 'Tech Review', 6, 1, CURRENT_TIMESTAMP), " +
            "(2, 'Beta Launch', 'New feature launch', 'Acme Corp', 120000.00, 'APPROVED', 'Final Sign-off', 7, 1, CURRENT_TIMESTAMP)");

        System.out.println("========== DATABASE RESET COMPLETE ==========");
    }
}
