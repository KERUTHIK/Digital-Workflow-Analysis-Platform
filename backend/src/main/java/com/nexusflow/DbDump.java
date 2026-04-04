package com.nexusflow;

import java.sql.*;

public class DbDump {
    public static void main(String[] args) {
        String url = "jdbc:mysql://127.0.0.1:3306/nexusflow?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = "6125";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connected to database.");
            
            System.out.println("\n--- Projects for Employee One (ID 6) ---");
            dumpQuery(conn, "SELECT id, title, status, created_at FROM projects WHERE created_by_id = 6");
            
            System.out.println("\n--- Task Assignments for Employee One (ID 6) ---");
            dumpQuery(conn, "SELECT id, project_id, title, status, submitted_at, reviewed_at FROM task_assignments WHERE assigned_to_id = 6");
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private static void dumpQuery(Connection conn, String query) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();
            while (rs.next()) {
                StringBuilder sb = new StringBuilder();
                for (int i = 1; i <= cols; i++) {
                    sb.append(meta.getColumnName(i)).append(": ").append(rs.getString(i)).append(" | ");
                }
                System.out.println(sb.toString());
            }
        }
    }
}
