package com.kstar.nacha.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class NachaPaymentRequest {

    @NotBlank(message = "SEC code is required")
    @Pattern(regexp = "PPD|CCD|WEB|TEL|CTX", message = "SEC code must be PPD, CCD, WEB, TEL, or CTX")
    private String secCode;

    @NotBlank
    @Pattern(regexp = "CREDIT|DEBIT", message = "Type must be CREDIT or DEBIT")
    private String type;

    // Originator details
    @NotBlank private String originatorName;
    @NotBlank @Size(min = 9, max = 9, message = "Routing number must be exactly 9 digits")
    @Pattern(regexp = "\\d{9}") private String originatorRoutingNumber;
    @NotBlank @Size(max = 17) private String originatorAccountNumber;

    // Receiver details
    @NotBlank private String receiverName;
    @NotBlank @Size(min = 9, max = 9)
    @Pattern(regexp = "\\d{9}") private String receiverRoutingNumber;
    @NotBlank @Size(max = 17) private String receiverAccountNumber;

    @NotBlank
    @Pattern(regexp = "CHECKING|SAVINGS") private String accountType;

    @NotNull @DecimalMin("0.01") @DecimalMax("1000000.00")
    private BigDecimal amount;

    // Optional — max 10 chars (NACHA standard Individual Entry Description field)
    @Size(max = 10) private String description;
}
