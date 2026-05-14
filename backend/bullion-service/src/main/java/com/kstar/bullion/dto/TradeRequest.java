package com.kstar.bullion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TradeRequest {
    @NotBlank private String tokenId;
}
