package com.kstar.user.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private String role;
    private List<WalletDto> wallets;
    private LocalDateTime createdAt;
}
