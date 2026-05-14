package com.kstar.bullion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class MintRequest {
    @NotBlank private String name;
    private String description;

    @NotBlank
    @Pattern(regexp = "GOLD|SILVER", message = "Metal must be GOLD or SILVER")
    private String metal;

    @NotNull @DecimalMin("0.001") private BigDecimal initialPrice;
}
