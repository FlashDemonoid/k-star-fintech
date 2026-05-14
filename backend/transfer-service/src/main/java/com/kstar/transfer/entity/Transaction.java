package com.kstar.transfer.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true, length=50)
    private String transactionId;

    @Column(length=30)
    private String type;

    @Column(length=50)
    private String fromUpiId;

    @Column(length=50)
    private String toUpiId;

    @Column(nullable=false, precision=18, scale=2)
    private BigDecimal amount;

    @Column(length=10)
    private String currency;

    @Column(length=20)
    @Builder.Default
    private String status = "PENDING";

    @Column(length=255)
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime processedAt;
}
