package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Mall;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MallRepository extends JpaRepository<Mall, Long> {
}
