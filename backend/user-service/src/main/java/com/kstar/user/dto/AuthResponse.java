package com.kstar.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private Long   id;
    private String token;
    private String username;
    private String email;
    private String phone;
    private String role;
    private String upiId;
    private List<WalletDto> wallets;
}
