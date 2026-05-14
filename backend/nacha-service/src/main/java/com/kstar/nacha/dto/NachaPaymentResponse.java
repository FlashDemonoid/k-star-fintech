package com.kstar.nacha.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class NachaPaymentResponse {
    private String paymentId;
    private String type;
    private String secCode;
    private String originatorName;
    private String receiverName;
    private String receiverRoutingNumber;
    private String receiverAccountNumber;
    private String accountType;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    private String traceNumber;
    private String batchNumber;
    private LocalDateTime createdAt;
    private LocalDateTime effectiveDate;
    private LocalDateTime settledAt;
    private String initiatedBy;
    private String failureReason;
}
