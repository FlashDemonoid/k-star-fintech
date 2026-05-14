package com.kstar.exchange.event;

import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor
public class RateUpdateEvent {
    private String currency;
    private LocalDateTime updatedAt;
}
