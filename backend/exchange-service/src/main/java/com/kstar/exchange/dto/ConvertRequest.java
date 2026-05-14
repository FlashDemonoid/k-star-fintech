package com.kstar.exchange.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ConvertRequest {
    @NotBlank private String from;
    @NotBlank private String to;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
}
