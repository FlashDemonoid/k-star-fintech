package com.kstar.exchange.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "conversion_history")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ConversionHistory {
    @Id private String id;
    private String username;
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal fromAmount;
    private BigDecimal toAmount;
    private BigDecimal rateUsed;
    private LocalDateTime convertedAt;
}
