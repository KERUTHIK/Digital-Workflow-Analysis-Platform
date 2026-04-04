package com.nexusflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "workflow_stages")
public class WorkflowStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String role;

    @Column(name = "sla_hours", nullable = false)
    private int slaHours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    @JsonIgnore
    private WorkflowTemplate template;

    public WorkflowStage() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getSlaHours() { return slaHours; }
    public void setSlaHours(int slaHours) { this.slaHours = slaHours; }

    public WorkflowTemplate getTemplate() { return template; }
    public void setTemplate(WorkflowTemplate template) { this.template = template; }

    @Override
    public String toString() {
        return "WorkflowStage{" +
                "id=" + id +
                ", order=" + orderIndex +
                ", name='" + name + '\'' +
                ", role='" + role + '\'' +
                ", sla=" + slaHours +
                '}';
    }
}
