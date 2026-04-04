package com.nexusflow;

import com.nexusflow.entity.WorkflowStage;
import com.nexusflow.entity.WorkflowTemplate;
import com.nexusflow.repository.WorkflowTemplateRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class WorkflowPersistenceTest {

    @Autowired
    private WorkflowTemplateRepository workflowTemplateRepository;

    @Test
    @Transactional
    void testSaveAndFetchWorkflow() {
        // 1. Create a new template
        WorkflowTemplate template = new WorkflowTemplate();
        template.setName("Test Persistence Workflow");
        template.setDescription("Verifying that workflows persist in the database");
        template.setStatus("Active");
        template.getStages().add(createStage(1, "Stage 1", "Admin", 24, template));
        
        // 2. Save
        WorkflowTemplate saved = workflowTemplateRepository.save(template);
        assertNotNull(saved.getId(), "Saved template should have an ID");
        
        // 3. Fetch
        Optional<WorkflowTemplate> fetched = workflowTemplateRepository.findById(saved.getId());
        assertTrue(fetched.isPresent(), "Should be able to fetch the saved template");
        assertEquals("Test Persistence Workflow", fetched.get().getName());
        assertEquals(1, fetched.get().getStages().size());
        assertEquals("Stage 1", fetched.get().getStages().get(0).getName());
        
        // 4. Update
        fetched.get().setName("Updated Workflow Name");
        fetched.get().getStages().get(0).setName("Updated Stage Name");
        workflowTemplateRepository.save(fetched.get());
        
        // 5. Verify Update
        WorkflowTemplate updated = workflowTemplateRepository.findById(saved.getId()).get();
        assertEquals("Updated Workflow Name", updated.getName());
        assertEquals("Updated Stage Name", updated.getStages().get(0).getName());
    }

    private WorkflowStage createStage(int order, String name, String role, int sla, WorkflowTemplate template) {
        WorkflowStage stage = new WorkflowStage();
        stage.setOrderIndex(order);
        stage.setName(name);
        stage.setRole(role);
        stage.setSlaHours(sla);
        stage.setTemplate(template);
        return stage;
    }
}
