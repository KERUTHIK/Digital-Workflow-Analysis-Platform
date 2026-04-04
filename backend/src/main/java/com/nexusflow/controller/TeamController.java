package com.nexusflow.controller;

import com.nexusflow.dto.TeamDTO;
import com.nexusflow.dto.TeamRequestDTO;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamDTO>>> getAllTeams() {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams(), "Teams retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamDTO>> createTeam(@RequestBody TeamRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.createTeam(request), "Team created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDTO>> updateTeam(@PathVariable Long id, @RequestBody TeamRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.updateTeam(id, request), "Team updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Team deleted successfully"));
    }
}
