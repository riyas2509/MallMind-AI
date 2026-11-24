package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.Role;
import com.mallmind.backend.domain.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
