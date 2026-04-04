package com.nexusflow.service;

import com.nexusflow.dto.TeamDTO;
import com.nexusflow.dto.TeamRequestDTO;
import com.nexusflow.entity.Team;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ResourceNotFoundException;
import com.nexusflow.repository.TeamRepository;
import com.nexusflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public TeamService(TeamRepository teamRepository, UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(TeamDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamDTO createTeam(TeamRequestDTO request) {
        Team team = new Team();
        mapRequestToEntity(request, team);
        Team saved = teamRepository.save(team);
        return TeamDTO.from(saved);
    }

    @Transactional
    public TeamDTO updateTeam(Long id, TeamRequestDTO request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", id));
        mapRequestToEntity(request, team);
        Team saved = teamRepository.save(team);
        return TeamDTO.from(saved);
    }

    @Transactional
    public void deleteTeam(Long id) {
        if (!teamRepository.existsById(id)) {
            throw new ResourceNotFoundException("Team", id);
        }
        teamRepository.deleteById(id);
    }

    private void mapRequestToEntity(TeamRequestDTO request, Team team) {
        team.setName(request.getName());
        team.setDepartment(request.getDepartment());
        team.setColor(request.getColor());
        team.setDescription(request.getDescription());

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User (Manager)", request.getManagerId()));
            team.setManager(manager);
        }

        if (request.getMemberIds() != null) {
            List<User> members = userRepository.findAllById(request.getMemberIds());
            team.getMembers().clear();
            team.getMembers().addAll(members);
        }
    }
}
