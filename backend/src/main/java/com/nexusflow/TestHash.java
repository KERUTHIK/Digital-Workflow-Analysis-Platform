package com.nexusflow;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String hashA = "$2a$12$7xNYB6c5e9KEyxFRR6VL7.B4KrFrGcPXxGr8Pq4E6SjGhA.bqb26";
        String hashB = "$2a$12$dC/m5iGE8RpOue2dp1MUUe5AvM.UBJDgqKtTwesr5kgMRb5YLzRg.";
        
        System.out.println("Hash A matches 'password123'? " + encoder.matches("password123", hashA));
        System.out.println("Hash A matches '123456'? " + encoder.matches("123456", hashA));
        
        System.out.println("Hash B matches 'password123'? " + encoder.matches("password123", hashB));
        System.out.println("Hash B matches '123456'? " + encoder.matches("123456", hashB));
    }
}
