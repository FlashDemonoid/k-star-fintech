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
     * Initiate an ACH/NACHA payment.
     * Supports PPD (consumer), CCD (business), WEB (internet),
     * TEL (telephone), CTX (corporate trade exchange) SEC codes.
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
     * Return an ACH entry.
     * RDFI has 2 business days; ODFI has 60 days for unauthorized returns.
     * Updates the payment status to RETURNED and records the return reason.
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
