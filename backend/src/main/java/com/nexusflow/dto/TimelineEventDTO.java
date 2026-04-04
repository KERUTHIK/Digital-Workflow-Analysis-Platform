package com.nexusflow.dto;

import java.time.LocalDateTime;

public class TimelineEventDTO {
    private String id;
    private String action;
    private String actor;
    private String date;
    private String status;
    private String note;

    public TimelineEventDTO() {}

    public TimelineEventDTO(String id, String action, String actor, String date, String status, String note) {
        this.id = id;
        this.action = action;
        this.actor = actor;
        this.date = date;
        this.status = status;
        this.note = note;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
