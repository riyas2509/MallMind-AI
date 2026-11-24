package com.mallmind.backend.dto.auth;

import java.util.List;

public record AuthResponse(String token, String email, String fullName, List<String> roles) {
}
