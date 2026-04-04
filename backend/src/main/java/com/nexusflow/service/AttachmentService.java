package com.nexusflow.service;

import com.nexusflow.dto.AttachmentDTO;
import com.nexusflow.entity.Attachment;
import com.nexusflow.entity.Project;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ResourceNotFoundException;
import com.nexusflow.repository.AttachmentRepository;
import com.nexusflow.repository.ProjectRepository;
import com.nexusflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public AttachmentService(AttachmentRepository attachmentRepository, 
                             ProjectRepository projectRepository, 
                             UserRepository userRepository) {
        this.attachmentRepository = attachmentRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AttachmentDTO> getAttachmentsByProject(Long projectId) {
        return attachmentRepository.findByProjectId(projectId).stream()
                .map(a -> new AttachmentDTO(
                    a.getId(),
                    a.getFileName(),
                    a.getFileType(),
                    a.getFileSize(),
                    a.getUploadedBy().getName(),
                    a.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public AttachmentDTO addAttachment(Long projectId, Long userId, AttachmentDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Attachment attachment = new Attachment();
        attachment.setFileName(dto.getFileName());
        attachment.setFileType(dto.getFileType());
        attachment.setFileSize(dto.getFileSize());
        attachment.setProject(project);
        attachment.setUploadedBy(user);

        Attachment saved = attachmentRepository.save(attachment);
        return new AttachmentDTO(
            saved.getId(),
            saved.getFileName(),
            saved.getFileType(),
            saved.getFileSize(),
            user.getName(),
            saved.getCreatedAt()
        );
    }
}
