package com.nexusflow.util;

import java.sql.*;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:mysql://127.0.0.1:3306/nexusflow";
        String user = "root";
        String password = "6125";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("--- DB CHECK START ---");
            checkTable(conn, "users");
            checkTable(conn, "workflow_templates");
            checkTable(conn, "workflow_stages");
            checkTable(conn, "projects");
            System.out.println("--- DB CHECK END ---");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private static void checkTable(Connection conn, String table) {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + table)) {
            if (rs.next()) {
                System.out.println("Table [" + table + "] count: " + rs.getInt(1));
            }
        } catch (SQLException e) {
            System.out.print("Table [" + table + "] check failed: ");
            if (e.getMessage().contains("doesn't exist")) {
                System.out.println("TABLE DOES NOT EXIST");
            } else {
                System.out.println(e.getMessage());
            }
        }
    }
}
