package com.nexusflow.controller;

import com.nexusflow.entity.WorkflowTemplate;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.repository.WorkflowTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class WorkflowController {
    private static final Logger log = LoggerFactory.getLogger(WorkflowController.class);

    private final WorkflowTemplateRepository workflowTemplateRepository;

    public WorkflowController(WorkflowTemplateRepository workflowTemplateRepository) {
        this.workflowTemplateRepository = workflowTemplateRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkflowTemplate>>> getAllWorkflows() {
        List<WorkflowTemplate> templates = workflowTemplateRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(templates, "Workflow templates retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkflowTemplate>> saveWorkflow(@RequestBody WorkflowTemplate template) {
        log.info("Received request to save workflow: {}", template.getName());
        log.debug("Workflow payload: {}", template);
        WorkflowTemplate toSave;
        if (template.getId() != null) {
            toSave = workflowTemplateRepository.findById(template.getId()).orElse(new WorkflowTemplate());
            toSave.setName(template.getName());
            toSave.setDescription(template.getDescription());
            toSave.setStatus(template.getStatus());
            toSave.setProjectCount(template.getProjectCount());
            toSave.setCreatedBy(template.getCreatedBy());

            // Handle stages merging or replacement
            if (template.getStages() != null) {
                // For simplicity, replace all stages. 
                // In a production app, we might merge by ID.
                toSave.getStages().clear();
                template.getStages().forEach(s -> {
                    s.setTemplate(toSave);
                    toSave.getStages().add(s);
                });
            }
        } else {
            toSave = template;
            if (toSave.getStages() != null) {
                toSave.getStages().forEach(s -> s.setTemplate(toSave));
            }
        }

        WorkflowTemplate saved = workflowTemplateRepository.save(toSave);
        return ResponseEntity.ok(ApiResponse.success(saved, "Workflow template saved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(@PathVariable Long id) {
        workflowTemplateRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow template deleted successfully"));
    }
}
