package com.kstar.transfer.event;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor
public class TransferEvent {
    private String transactionId;
    private String fromUpiId;
    private String toUpiId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private LocalDateTime timestamp;
}
