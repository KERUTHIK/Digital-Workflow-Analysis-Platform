package com.nexusflow.util;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DbFix {
    public static void main(String[] args) {
        String url = "jdbc:mysql://127.0.0.1:3306/nexusflow";
        String user = "root";
        String password = "6125";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("--- DB FIX START ---");
            int updated = 0;
            String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            try (Statement stmt = conn.createStatement()) {
                updated = stmt.executeUpdate("UPDATE workflow_templates SET created_at = '" + now + "' WHERE created_at IS NULL");
                System.out.println("Updated " + updated + " rows in workflow_templates");
            } catch (SQLException e) {
                System.out.println("Error updating workflow_templates: " + e.getMessage());
            }

            System.out.println("--- DB FIX END ---");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
