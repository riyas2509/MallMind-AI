package com.mallmind.backend.controller;

import com.mallmind.backend.dto.floor.FloorMapResponse;
import com.mallmind.backend.dto.floor.FloorSummary;
import com.mallmind.backend.service.FloorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
public class FloorController {

    private final FloorService floorService;

    @GetMapping
    public ResponseEntity<List<FloorSummary>> listFloors() {
        return ResponseEntity.ok(floorService.listFloors());
    }

    @GetMapping("/{floorNumber}/map")
    public ResponseEntity<FloorMapResponse> getFloorMap(@PathVariable int floorNumber) {
        return ResponseEntity.ok(floorService.getFloorMap(floorNumber));
    }
}
