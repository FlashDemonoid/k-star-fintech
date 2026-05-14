package com.kstar.transfer.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpiTransferRequest {
    @NotBlank(message = "From UPI ID is required")
    private String fromUpiId;

    @NotBlank(message = "To UPI ID is required")
    private String toUpiId;

    @NotNull @DecimalMin(value="1.00", message="Minimum transfer is ₹1")
    private BigDecimal amount;

    @NotBlank @Size(min=4, max=4, message="UPI PIN must be 4 digits")
    @Pattern(regexp="\\d{4}", message="UPI PIN must be 4 digits")
    private String upiPin;

    private String description;
}
