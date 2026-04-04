package com.nexusflow.dto;

public class ApprovalActionRequest {

    /** Optional reviewer comment for approve/reject actions */
    private String comment;

    public ApprovalActionRequest() {}

    public ApprovalActionRequest(String comment) {
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
