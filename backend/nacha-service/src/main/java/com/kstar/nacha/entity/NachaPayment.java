package com.kstar.nacha.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a single ACH/NACHA payment entry.
 *
 * NACHA (National Automated Clearing House Association) sets the rules for ACH
 * electronic payments in the US — think direct deposits, payroll, bill payments.
 *
 * SEC codes tell you what kind of transaction it is:
 *   PPD — Prearranged Payment and Deposit (personal accounts, most common)
 *   CCD — Corporate Credit or Debit (business-to-business)
 *   WEB — Initiated over the internet
 *
 * Settlement is T+1 — the ACH network clears next business day.
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
    private String paymentId;           // e.g. NACHA-20240101-000001

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentType type;           // CREDIT or DEBIT

    @Column(nullable = false, length = 10)
    private String secCode;             // PPD, CCD, WEB

    // Originator (the one sending the money)
    @Column(nullable = false, length = 100)
    private String originatorName;
    @Column(nullable = false, length = 9)
    private String originatorRoutingNumber;   // 9-digit ABA routing number
    @Column(nullable = false, length = 17)
    private String originatorAccountNumber;

    // Receiver (destination bank account)
    @Column(nullable = false, length = 100)
    private String receiverName;
    @Column(nullable = false, length = 9)
    private String receiverRoutingNumber;
    @Column(nullable = false, length = 17)
    private String receiverAccountNumber;
    @Column(nullable = false, length = 10)
    private String accountType;               // CHECKING or SAVINGS

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;                // always USD

    @Column(length = 10)
    private String currency = "USD";

    @Column(length = 255)
    private String description;               // max 10 chars in real NACHA, relaxed here for readability

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String traceNumber;               // 15-digit NACHA trace number
    private String batchNumber;
    private String failureReason;             // populated on RETURNED or FAILED

    private String initiatedBy;               // username of the logged-in user

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime settledAt;
    private LocalDateTime effectiveDate;      // T+1 — when the ACH entry actually clears

    public enum PaymentType { CREDIT, DEBIT }

    public enum PaymentStatus {
        PENDING, SUBMITTED, PROCESSING, SETTLED, RETURNED, FAILED
    }
}
