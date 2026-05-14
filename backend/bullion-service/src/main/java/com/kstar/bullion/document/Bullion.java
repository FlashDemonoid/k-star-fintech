package com.kstar.bullion.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "bullion_holdings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bullion {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenId;

    private String name;
    private String description;
    private String metal;           // GOLD or SILVER

    @Indexed
    private String ownerUsername;
    private String creatorUsername;

    private BigDecimal price;
    private String currency;

    private BullionStatus status;

    private List<TradeHistory> tradeHistory;

    private LocalDateTime mintedAt;
    private LocalDateTime updatedAt;

    public enum BullionStatus {
        ACTIVE, FOR_SALE, SOLD, REDEEMED
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TradeHistory {
        private String fromUsername;
        private String toUsername;
        private BigDecimal price;
        private LocalDateTime tradedAt;
    }
}
