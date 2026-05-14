package com.kstar.nacha.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NachaPaymentEvent {
    private String paymentId;
    private String username;
    private BigDecimal amount;
    private String status; // INITIATED, SUBMITTED, SETTLED, FAILED, RETURNED
    private LocalDateTime timestamp;
}
