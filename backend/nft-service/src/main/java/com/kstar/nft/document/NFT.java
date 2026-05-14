package com.kstar.nft.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "nfts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NFT {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenId;

    private String name;
    private String description;
    private String imageUrl;
    private String metadataUrl;

    @Indexed
    private String ownerUsername;
    private String creatorUsername;

    private BigDecimal price;
    private String currency;

    // MongoDB stores enums as String natively — @Enumerated (JPA) is NOT needed
    private NFTStatus status;

    private List<TradeHistory> tradeHistory;

    private LocalDateTime mintedAt;
    private LocalDateTime updatedAt;

    public enum NFTStatus {
        MINTED, FOR_SALE, SOLD, BURNED
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
