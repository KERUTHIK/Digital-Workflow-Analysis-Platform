package com.nexusflow.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class ResetDB {
    public static void main(String[] args) {
        String url = "jdbc:mysql://127.0.0.1:3306/nexusflow?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        String user = "root";
        String pass = "6125";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Disabling foreign key checks...");
            stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
            
            System.out.println("Truncating tables...");
            stmt.execute("TRUNCATE TABLE users");
            stmt.execute("TRUNCATE TABLE projects");
            stmt.execute("TRUNCATE TABLE teams");
            stmt.execute("TRUNCATE TABLE team_members");
            stmt.execute("TRUNCATE TABLE approvals");
            stmt.execute("TRUNCATE TABLE audit_logs");
            
            System.out.println("Re-enabling foreign key checks...");
            stmt.execute("SET FOREIGN_KEY_CHECKS = 1");

            System.out.println("Inserting seeds...");
            stmt.execute("INSERT INTO users (id, name, email, password, role, manager_id, active, created_at) VALUES " +
                "(1, 'keruthik', 'admin@nexusflow.com', '$2a$12$7xNYB6c5e9KEyxFRR6VL7.B4KrFrGcPXxGr8Pq4E6SjGhA.bqb26', 'ADMIN', NULL, TRUE, CURRENT_TIMESTAMP), " +
                "(2, 'Alice Manager', 'alice@nexusflow.com', '$2a$12$7xNYB6c5e9KEyxFRR6VL7.B4KrFrGcPXxGr8Pq4E6SjGhA.bqb26', 'MANAGER', NULL, TRUE, CURRENT_TIMESTAMP), " +
                "(3, 'Bob Employee', 'bob@nexusflow.com', '$2a$12$7xNYB6c5e9KEyxFRR6VL7.B4KrFrGcPXxGr8Pq4E6SjGhA.bqb26', 'EMPLOYEE', 2, TRUE, CURRENT_TIMESTAMP), " +
                "(4, 'Kishore', 'kishore@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', NULL, TRUE, CURRENT_TIMESTAMP), " +
                "(5, 'Sarah Jenkins', 'sarah@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'MANAGER', NULL, TRUE, CURRENT_TIMESTAMP), " +
                "(6, 'Employee One', 'employee1@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', 5, TRUE, CURRENT_TIMESTAMP), " +
                "(7, 'Employee Two', 'employee2@gmail.com', '$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.', 'EMPLOYEE', NULL, TRUE, CURRENT_TIMESTAMP)");

            stmt.execute("INSERT INTO teams (id, name, department, color, description, manager_id, created_at) VALUES " +
                "(1, 'Engineering Alpha', 'Engineering', 'blue', 'Main engineering team', 5, CURRENT_TIMESTAMP)");

            stmt.execute("INSERT INTO team_members (team_id, user_id) VALUES (1, 6), (1, 7)");
            
            stmt.execute("INSERT INTO projects (id, title, description, client_name, budget, status, current_stage, created_by, assigned_team_id) VALUES " +
                "(1, 'Alpha Rewrite', 'Rewriting legacy code', 'Internal', 50000.00, 'SUBMITTED', 'Tech Review', 6, 1), " +
                "(2, 'Beta Launch', 'New feature launch', 'Acme Corp', 120000.00, 'APPROVED', 'Final Sign-off', 7, 1)");

            System.out.println("Done!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
