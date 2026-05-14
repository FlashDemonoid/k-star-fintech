package com.kstar.exchange.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "exchange_rates")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@CompoundIndex(def = "{'baseCurrency':1,'targetCurrency':1}", unique = true)
public class ExchangeRate {
    @Id private String id;
    private String baseCurrency;
    private String targetCurrency;
    private BigDecimal rate;
    private LocalDateTime updatedAt;
}
