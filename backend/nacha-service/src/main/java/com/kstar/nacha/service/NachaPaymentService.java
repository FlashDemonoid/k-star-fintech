package com.kstar.nacha.service;

import com.kstar.nacha.dto.NachaPaymentRequest;
import com.kstar.nacha.dto.NachaPaymentResponse;
import com.kstar.nacha.entity.NachaPayment;
import com.kstar.nacha.event.NachaPaymentEvent;
import com.kstar.nacha.repository.NachaPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NachaPaymentService {

    private final NachaPaymentRepository paymentRepository;
    private final KafkaTemplate<String, NachaPaymentEvent> kafkaTemplate;

    private final Random random = new Random();

    @Transactional
    public NachaPaymentResponse initiatePayment(NachaPaymentRequest request, String username) {
        String paymentId   = generatePaymentId();
        String traceNumber = generateTraceNumber();
        String batchNumber = generateBatchNumber();

        NachaPayment payment = NachaPayment.builder()
                .paymentId(paymentId)
                .type(NachaPayment.PaymentType.valueOf(request.getType()))
                .secCode(request.getSecCode())
                .originatorName(request.getOriginatorName())
                .originatorRoutingNumber(request.getOriginatorRoutingNumber())
                .originatorAccountNumber(request.getOriginatorAccountNumber())
                .receiverName(request.getReceiverName())
                .receiverRoutingNumber(request.getReceiverRoutingNumber())
                .receiverAccountNumber(request.getReceiverAccountNumber())
                .accountType(request.getAccountType())
                .amount(request.getAmount())
                .currency("USD")
                .description(request.getDescription())
                .status(NachaPayment.PaymentStatus.PENDING)
                .traceNumber(traceNumber)
                .batchNumber(batchNumber)
                .initiatedBy(username)
                .effectiveDate(LocalDateTime.now().plusDays(1)) // T+1 settlement
                .build();

        NachaPayment saved = paymentRepository.save(payment);

        kafkaTemplate.send("nacha-payments", paymentId,
                new NachaPaymentEvent(paymentId, username, request.getAmount(),
                        "INITIATED", LocalDateTime.now()));

        log.info("NACHA payment initiated: {} by {} amount: ${}", paymentId, username, request.getAmount());

        processPaymentAsync(saved.getId());

        return toResponse(saved);
    }

    @Transactional
    public NachaPaymentResponse returnPayment(String paymentId, String returnCode, String reason, String username) {
        NachaPayment payment = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (payment.getStatus() == NachaPayment.PaymentStatus.RETURNED) {
            throw new RuntimeException("Payment " + paymentId + " is already returned");
        }

        payment.setStatus(NachaPayment.PaymentStatus.RETURNED);
        payment.setFailureReason(returnCode + (reason != null && !reason.isBlank() ? " — " + reason : ""));
        payment.setSettledAt(LocalDateTime.now());

        NachaPayment saved = paymentRepository.save(payment);

        kafkaTemplate.send("nacha-payments", paymentId,
                new NachaPaymentEvent(paymentId, username, payment.getAmount(),
                        "RETURNED", LocalDateTime.now()));

        log.info("NACHA payment returned: {} code={} by {}", paymentId, returnCode, username);
        return toResponse(saved);
    }

    @Async
    protected void processPaymentAsync(Long paymentId) {
        try {
            Thread.sleep(2000);
            paymentRepository.findById(paymentId).ifPresent(payment -> {
                boolean success = random.nextInt(100) < 95;
                payment.setStatus(success
                        ? NachaPayment.PaymentStatus.SUBMITTED
                        : NachaPayment.PaymentStatus.FAILED);
                if (!success) payment.setFailureReason("R01 - Insufficient Funds");
                payment.setSettledAt(success ? LocalDateTime.now().plusDays(1) : LocalDateTime.now());
                paymentRepository.save(payment);

                kafkaTemplate.send("nacha-payments", payment.getPaymentId(),
                        new NachaPaymentEvent(payment.getPaymentId(), payment.getInitiatedBy(),
                                payment.getAmount(), payment.getStatus().name(), LocalDateTime.now()));

                log.info("NACHA {} processed: {}", payment.getPaymentId(), payment.getStatus());
            });
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public List<NachaPaymentResponse> getUserPayments(String username) {
        return paymentRepository.findByInitiatedByOrderByCreatedAtDesc(username)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public NachaPaymentResponse getPayment(String paymentId) {
        NachaPayment p = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        return toResponse(p);
    }

    public List<NachaPaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private String generatePaymentId() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int seq = (int)(paymentRepository.count() + 1);
        return String.format("NACHA-%s-%06d", date, seq);
    }

    private String generateTraceNumber() {
        return "12345678" + String.format("%07d", random.nextInt(9999999));
    }

    private String generateBatchNumber() {
        return String.format("BATCH-%06d", random.nextInt(999999));
    }

    private NachaPaymentResponse toResponse(NachaPayment p) {
        return NachaPaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .type(p.getType().name())
                .secCode(p.getSecCode())
                .originatorName(p.getOriginatorName())
                .receiverName(p.getReceiverName())
                .receiverRoutingNumber(p.getReceiverRoutingNumber())
                .receiverAccountNumber(maskAccount(p.getReceiverAccountNumber()))
                .accountType(p.getAccountType())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .description(p.getDescription())
                .status(p.getStatus().name())
                .traceNumber(p.getTraceNumber())
                .batchNumber(p.getBatchNumber())
                .createdAt(p.getCreatedAt())
                .effectiveDate(p.getEffectiveDate())
                .settledAt(p.getSettledAt())
                .initiatedBy(p.getInitiatedBy())
                .failureReason(p.getFailureReason())
                .build();
    }

    private String maskAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) return accountNumber;
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }
}
