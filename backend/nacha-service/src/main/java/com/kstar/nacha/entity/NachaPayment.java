package com.kstar.nacha.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * NACHA (National Automated Clearing House Association) Payment Entity.
 * NACHA governs ACH (Automated Clearing House) electronic payments in the USA.
 * ACH is used for direct deposits, bill payments, payroll, etc.
 *
 * SEC Codes supported:
 * - PPD: Prearranged Payment and Deposit (consumer)
 * - CCD: Corporate Credit or Debit (business)
 * - WEB: Internet-initiated entries
 */
@Entity
@Table(name = "nacha_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NachaPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String paymentId; // e.g. NACHA-20240101-000001

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentType type; // CREDIT or DEBIT

    @Column(nullable = false, length = 10)
    private String secCode; // PPD, CCD, WEB

    // Originator (sender)
    @Column(nullable = false, length = 100)
    private String originatorName;
    @Column(nullable = false, length = 9)
    private String originatorRoutingNumber; // 9-digit ABA routing number
    @Column(nullable = false, length = 17)
    private String originatorAccountNumber;

    // Receiver (destination)
    @Column(nullable = false, length = 100)
    private String receiverName;
    @Column(nullable = false, length = 9)
    private String receiverRoutingNumber;
    @Column(nullable = false, length = 17)
    private String receiverAccountNumber;
    @Column(nullable = false, length = 10)
    private String accountType; // CHECKING or SAVINGS

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount; // in USD

    @Column(length = 10)
    private String currency = "USD";

    @Column(length = 255)
    private String description; // Individual entry description (max 10 chars in real NACHA)

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String traceNumber; // 15-digit NACHA trace number
    private String batchNumber; // NACHA batch control number
    private String failureReason;

    private String initiatedBy; // username

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime settledAt;
    private LocalDateTime effectiveDate; // when ACH clears (typically T+1)

    public enum PaymentType { CREDIT, DEBIT }

    public enum PaymentStatus {
        PENDING, SUBMITTED, PROCESSING, SETTLED, RETURNED, FAILED
    }
}
