package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Floor;
import com.mallmind.backend.domain.entity.NavigationEdge;
import com.mallmind.backend.domain.entity.NavigationNode;
import com.mallmind.backend.domain.enums.NavigationNodeType;
import com.mallmind.backend.dto.navigation.GraphValidationReport;
import com.mallmind.backend.dto.navigation.RouteResponse;
import com.mallmind.backend.exception.RouteNotFoundException;
import com.mallmind.backend.repository.NavigationEdgeRepository;
import com.mallmind.backend.repository.NavigationNodeRepository;
import com.mallmind.backend.service.navigation.NavigationGraphService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NavigationGraphServiceTest {

    @Mock
    private NavigationEdgeRepository edgeRepository;

    @Mock
    private NavigationNodeRepository nodeRepository;

    private NavigationGraphService navigationGraphService;

    private Floor groundFloor;
    private Floor firstFloor;
    private NavigationNode nodeEntrance;
    private NavigationNode nodeCorridor;
    private NavigationNode nodeEscalatorG;
    private NavigationNode nodeEscalator1F;
    private NavigationNode nodeElevatorG;
    private NavigationNode nodeElevator1F;
    private NavigationNode nodeShop1F;

    @BeforeEach
    void setUp() {
        groundFloor = new Floor();
        groundFloor.setId(1L);
        groundFloor.setFloorNumber(0);
        groundFloor.setLabel("Ground Floor (G)");

        firstFloor = new Floor();
        firstFloor.setId(2L);
        firstFloor.setFloorNumber(1);
        firstFloor.setLabel("First Floor (1F)");

        nodeEntrance = createNode(10L, 100.0, 100.0, NavigationNodeType.ENTRANCE_EXIT, "Vastrapur Grand Entrance", groundFloor);
        nodeCorridor = createNode(11L, 200.0, 100.0, NavigationNodeType.CORRIDOR_JUNCTION, "Central Grand Atrium", groundFloor);
        nodeEscalatorG = createNode(12L, 300.0, 100.0, NavigationNodeType.ESCALATOR, "Central Escalator (G -> 1F)", groundFloor);
        nodeEscalator1F = createNode(20L, 300.0, 100.0, NavigationNodeType.ESCALATOR, "Central Escalator (1F Landing)", firstFloor);
        nodeElevatorG = createNode(13L, 250.0, 100.0, NavigationNodeType.ELEVATOR, "Glass Elevator A (Ground)", groundFloor);
        nodeElevator1F = createNode(22L, 250.0, 100.0, NavigationNodeType.ELEVATOR, "Glass Elevator A (1F)", firstFloor);
        nodeShop1F = createNode(21L, 400.0, 100.0, NavigationNodeType.SHOP_ENTRANCE, "Reliance Digital Entrance", firstFloor);

        NavigationEdge edge1 = createEdge(1L, nodeEntrance, nodeCorridor, 10.0, false);
        NavigationEdge edge2 = createEdge(2L, nodeCorridor, nodeEscalatorG, 10.0, false);
        NavigationEdge edge3 = createEdge(3L, nodeEscalatorG, nodeEscalator1F, 15.0, true); // escalator vertical
        NavigationEdge edge4 = createEdge(4L, nodeEscalator1F, nodeShop1F, 10.0, false);
        NavigationEdge edge5 = createEdge(5L, nodeCorridor, nodeElevatorG, 5.0, false);
        NavigationEdge edge6 = createEdge(6L, nodeElevatorG, nodeElevator1F, 25.0, true); // elevator vertical
        NavigationEdge edge7 = createEdge(7L, nodeElevator1F, nodeShop1F, 15.0, false);

        when(nodeRepository.findAllWithFloor()).thenReturn(List.of(
                nodeEntrance, nodeCorridor, nodeEscalatorG, nodeEscalator1F, nodeElevatorG, nodeElevator1F, nodeShop1F
        ));
        when(edgeRepository.findAllWithNodes()).thenReturn(List.of(
                edge1, edge2, edge3, edge4, edge5, edge6, edge7
        ));

        navigationGraphService = new NavigationGraphService(edgeRepository, nodeRepository);
        navigationGraphService.reload();
    }

    @Test
    @DisplayName("Dijkstra: calculates correct path and distance on same floor")
    void testSameFloorRoute() {
        RouteResponse route = navigationGraphService.findRoute(10L, 12L);

        assertThat(route).isNotNull();
        assertThat(route.fromNodeId()).isEqualTo(10L);
        assertThat(route.toNodeId()).isEqualTo(12L);
        assertThat(route.totalDistance()).isEqualTo(20.0);
        assertThat(route.steps()).hasSize(3);
        assertThat(route.spokenDirections()).isNotEmpty();
        assertThat(route.routeType()).isEqualTo("SAME_FLOOR");
        assertThat(route.floorTransitionsCount()).isEqualTo(0);
        assertThat(route.floorSequence()).containsExactly(0);
    }

    @Test
    @DisplayName("Dijkstra: calculates multi-floor route across escalators (fastest path)")
    void testMultiFloorRoute() {
        RouteResponse route = navigationGraphService.findRoute(10L, 21L);

        assertThat(route).isNotNull();
        assertThat(route.fromNodeId()).isEqualTo(10L);
        assertThat(route.toNodeId()).isEqualTo(21L);
        assertThat(route.totalDistance()).isEqualTo(45.0); // 10 + 10 + 15 + 10
        assertThat(route.steps()).hasSize(5);
        assertThat(route.spokenDirections()).isNotEmpty();
        assertThat(route.floorTransitionsCount()).isEqualTo(1);
        assertThat(route.floorSequence()).containsExactly(0, 1);
        assertThat(route.routeType()).isEqualTo("MULTI_FLOOR_ESCALATOR");
        assertThat(route.isEstimatedDistance()).isTrue();
        assertThat(route.estimatedDistanceMeters()).isGreaterThan(0.0);
    }

    @Test
    @DisplayName("Dijkstra: accessibleOnly preference routes exclusively through Elevator")
    void testAccessibleRoutePreference() {
        // Fast escalator route is 45.0, but elevator route is 10 + 5 + 25 + 15 = 55.0
        // When accessibleOnly is true, escalator MUST be skipped and elevator chosen
        RouteResponse route = navigationGraphService.findRoute(10L, 21L, true);

        assertThat(route).isNotNull();
        assertThat(route.routeType()).isEqualTo("MULTI_FLOOR_ACCESSIBLE_ELEVATOR");
        assertThat(route.steps()).extracting(s -> s.nodeId()).contains(13L, 22L); // elevator nodes
        assertThat(route.steps()).extracting(s -> s.nodeId()).doesNotContain(12L, 20L); // no escalators!
    }

    @Test
    @DisplayName("Dijkstra: same source and destination returns 0 distance")
    void testSourceEqualsDestination() {
        RouteResponse route = navigationGraphService.findRoute(10L, 10L);

        assertThat(route).isNotNull();
        assertThat(route.totalDistance()).isEqualTo(0.0);
        assertThat(route.estimatedDistanceMeters()).isEqualTo(0.0);
        assertThat(route.steps()).hasSize(1);
        assertThat(route.routeType()).isEqualTo("SAME_FLOOR");
    }

    @Test
    @DisplayName("Dijkstra: unknown node throws RouteNotFoundException")
    void testUnknownNodeThrowsException() {
        assertThatThrownBy(() -> navigationGraphService.findRoute(10L, 999L))
                .isInstanceOf(RouteNotFoundException.class);
    }

    @Test
    @DisplayName("Graph Validation: confirms digital twin connectivity and reachability")
    void testGraphValidation() {
        when(edgeRepository.findAll()).thenReturn(List.of(
                new NavigationEdge(), new NavigationEdge(), new NavigationEdge()
        ));
        GraphValidationReport report = navigationGraphService.validateGraph();

        assertThat(report).isNotNull();
        assertThat(report.totalNodes()).isEqualTo(7);
        assertThat(report.estimatedScaleFactorMetersPerUnit()).isEqualTo(0.25);
        assertThat(report.scaleFactorIsEstimated()).isTrue();
    }

    private NavigationNode createNode(Long id, double x, double y, NavigationNodeType type, String label, Floor floor) {
        NavigationNode node = new NavigationNode();
        node.setId(id);
        node.setX(x);
        node.setY(y);
        node.setType(type);
        node.setLabel(label);
        node.setFloor(floor);
        return node;
    }

    private NavigationEdge createEdge(Long id, NavigationNode from, NavigationNode to, double weight, boolean vertical) {
        NavigationEdge edge = new NavigationEdge();
        edge.setId(id);
        edge.setFromNode(from);
        edge.setToNode(to);
        edge.setWeight(weight);
        edge.setVerticalConnection(vertical);
        return edge;
    }
}
