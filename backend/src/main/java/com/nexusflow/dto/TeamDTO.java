package com.nexusflow.dto;

import com.nexusflow.entity.Team;
import com.nexusflow.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class TeamDTO {
    private Long id;
    private String name;
    private String department;
    private String color;
    private String description;
    private Long managerId;
    private String managerName;
    private List<Long> memberIds;
    private LocalDateTime createdAt;

    public TeamDTO() {}

    public TeamDTO(Long id, String name, String department, String color, String description,
                   Long managerId, String managerName, List<Long> memberIds, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.color = color;
        this.description = description;
        this.managerId = managerId;
        this.managerName = managerName;
        this.memberIds = memberIds;
        this.createdAt = createdAt;
    }

    // Static Factory
    public static TeamDTO from(Team team) {
        return new TeamDTO(
            team.getId(),
            team.getName(),
            team.getDepartment(),
            team.getColor(),
            team.getDescription(),
            team.getManager() != null ? team.getManager().getId() : null,
            team.getManager() != null ? team.getManager().getName() : null,
            team.getMembers().stream().map(User::getId).collect(Collectors.toList()),
            team.getCreatedAt()
        );
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }

    public List<Long> getMemberIds() { return memberIds; }
    public void setMemberIds(List<Long> memberIds) { this.memberIds = memberIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
