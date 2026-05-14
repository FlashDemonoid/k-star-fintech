package com.kstar.nft.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NFTTradeEvent {
    private String tokenId;
    private String fromUsername;
    private String toUsername;
    private BigDecimal price;
    private String eventType; // MINTED, LISTED, TRADED, BURNED
    private LocalDateTime timestamp;
}
