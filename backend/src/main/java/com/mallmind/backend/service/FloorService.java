package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Facility;
import com.mallmind.backend.domain.entity.Floor;
import com.mallmind.backend.domain.entity.Mall;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.dto.floor.FacilityResponse;
import com.mallmind.backend.dto.floor.FloorMapResponse;
import com.mallmind.backend.dto.floor.FloorSummary;
import com.mallmind.backend.exception.InvalidFloorException;
import com.mallmind.backend.repository.FacilityRepository;
import com.mallmind.backend.repository.FloorRepository;
import com.mallmind.backend.repository.MallRepository;
import com.mallmind.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FloorService {

    private final FloorRepository floorRepository;
    private final MallRepository mallRepository;
    private final ShopRepository shopRepository;
    private final FacilityRepository facilityRepository;

    public List<FloorSummary> listFloors() {
        Mall mall = firstMall();
        return floorRepository.findByMallOrderByFloorNumberAsc(mall).stream()
                .map(f -> new FloorSummary(f.getId(), f.getFloorNumber(), f.getLabel(), f.getPlanWidth(), f.getPlanHeight()))
                .toList();
    }

    public FloorMapResponse getFloorMap(int floorNumber) {
        Mall mall = firstMall();
        Floor floor = floorRepository.findByMallAndFloorNumber(mall, floorNumber)
                .orElseThrow(() -> new InvalidFloorException(floorNumber));

        List<Shop> shops = shopRepository.findByFloorIdAndActiveTrue(floor.getId());
        List<Facility> facilities = facilityRepository.findByFloorId(floor.getId());

        return new FloorMapResponse(
                new FloorSummary(floor.getId(), floor.getFloorNumber(), floor.getLabel(), floor.getPlanWidth(), floor.getPlanHeight()),
                shops.stream().map(this::toShopResponse).toList(),
                facilities.stream().map(this::toFacilityResponse).toList());
    }

    private com.mallmind.backend.dto.shop.ShopResponse toShopResponse(Shop shop) {
        return new com.mallmind.backend.dto.shop.ShopResponse(
                shop.getId(), shop.getName(), shop.getCategory(), shop.getDescription(), shop.getLogoUrl(),
                shop.getFloor().getFloorNumber(), shop.getNavigationNode().getId(),
                shop.getNavigationNode().getX(), shop.getNavigationNode().getY());
    }

    private FacilityResponse toFacilityResponse(Facility facility) {
        return new FacilityResponse(
                facility.getId(), facility.getType(), facility.getLabel(), facility.getFloor().getFloorNumber(),
                facility.getNavigationNode().getX(), facility.getNavigationNode().getY(), facility.getNavigationNode().getId());
    }

    /** Phase 3's demo mall is single-mall; multi-mall selection is a Part 16 "advanced extension". */
    private Mall firstMall() {
        return mallRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No mall is seeded yet"));
    }
}
