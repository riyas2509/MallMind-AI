package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Role;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.RoleName;
import com.mallmind.backend.dto.auth.AuthResponse;
import com.mallmind.backend.dto.auth.LoginRequest;
import com.mallmind.backend.dto.auth.RegisterRequest;
import com.mallmind.backend.repository.RoleRepository;
import com.mallmind.backend.repository.UserRepository;
import com.mallmind.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final com.mallmind.backend.security.CustomUserDetailsService userDetailsService;

    /** Self-registration only ever grants VISITOR or RETAILER; ADMIN accounts are seeded, never self-assigned. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        RoleName requested = parseSelfServiceRole(request.requestedRole());
        Role role = roleRepository.findByName(requested)
                .orElseThrow(() -> new IllegalStateException("Role " + requested + " is not seeded"));

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .roles(roles)
                .enabled(true)
                .build();

        userRepository.save(user);
        return toAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw e;
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        return toAuthResponse(user);
    }

    private RoleName parseSelfServiceRole(String requested) {
        if (requested == null || requested.isBlank()) {
            return RoleName.VISITOR;
        }
        RoleName parsed;
        try {
            parsed = RoleName.valueOf(requested.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown role: " + requested);
        }
        if (parsed == RoleName.ADMIN) {
            throw new IllegalArgumentException("ADMIN accounts cannot be self-registered");
        }
        return parsed;
    }

    private AuthResponse toAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);
        List<String> roles = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new AuthResponse(token, user.getEmail(), user.getFullName(), roles);
    }
}
