package com.kstar.bullion.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BullionTradeEvent {
    private String tokenId;
    private String fromUsername;
    private String toUsername;
    private BigDecimal price;
    private String metal;
    private String eventType;       // MINTED, TRADED, REDEEMED
    private LocalDateTime timestamp;
}
