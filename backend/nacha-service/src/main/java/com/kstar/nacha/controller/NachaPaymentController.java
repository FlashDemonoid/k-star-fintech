package com.kstar.nacha.controller;

import com.kstar.nacha.dto.NachaPaymentRequest;
import com.kstar.nacha.dto.NachaPaymentResponse;
import com.kstar.nacha.service.NachaPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/nacha")
@RequiredArgsConstructor
public class NachaPaymentController {

    private final NachaPaymentService nachaPaymentService;

    /**
     * Initiates an ACH payment.
     * Supported SEC codes: PPD (consumer), CCD (business), WEB (internet), TEL, CTX.
     * Status starts as PENDING, moves to SUBMITTED after async processing (~2s).
     */
    @PostMapping("/payments")
    public ResponseEntity<NachaPaymentResponse> initiatePayment(
            @Valid @RequestBody NachaPaymentRequest request,
            @RequestHeader("X-User-Name") String username) {
        log.info("NACHA payment request: {} {} ${} by {}",
                request.getSecCode(), request.getType(), request.getAmount(), username);
        return ResponseEntity.ok(nachaPaymentService.initiatePayment(request, username));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<NachaPaymentResponse>> getMyPayments(
            @RequestHeader("X-User-Name") String username) {
        return ResponseEntity.ok(nachaPaymentService.getUserPayments(username));
    }

    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<NachaPaymentResponse> getPayment(@PathVariable String paymentId) {
        return ResponseEntity.ok(nachaPaymentService.getPayment(paymentId));
    }

    /**
     * Return (reverse) an ACH entry.
     * In real NACHA: RDFI has 2 business days, ODFI has 60 days for unauthorized returns.
     * Here it's simplified — any payment can be returned with a return code (e.g. R02).
     */
    @PostMapping("/payments/{paymentId}/return")
    public ResponseEntity<NachaPaymentResponse> returnPayment(
            @PathVariable String paymentId,
            @RequestParam String returnCode,
            @RequestParam(required = false) String reason,
            @RequestHeader("X-User-Name") String username) {
        log.info("NACHA return request: {} code={} by {}", paymentId, returnCode, username);
        return ResponseEntity.ok(nachaPaymentService.returnPayment(paymentId, returnCode, reason, username));
    }

    @GetMapping("/admin/payments")
    public ResponseEntity<List<NachaPaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(nachaPaymentService.getAllPayments());
    }
}
