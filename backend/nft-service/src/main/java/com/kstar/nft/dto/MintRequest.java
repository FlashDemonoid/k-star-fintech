package com.kstar.nft.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class MintRequest {
    @NotBlank private String name;
    private String description;
    private String imageUrl;
    @NotNull @DecimalMin("1.00") private BigDecimal initialPrice;
}
