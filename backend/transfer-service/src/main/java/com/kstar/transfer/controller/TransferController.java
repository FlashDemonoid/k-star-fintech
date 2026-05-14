package com.kstar.transfer.controller;

import com.kstar.transfer.dto.UpiTransferRequest;
import com.kstar.transfer.entity.Transaction;
import com.kstar.transfer.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/transfer")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping("/upi")
    public ResponseEntity<Transaction> transfer(
            @Valid @RequestBody UpiTransferRequest request,
            @RequestHeader(value="X-User-Name", defaultValue="anonymous") String username) {
        log.info("Transfer {} → {} ₹{}", request.getFromUpiId(), request.getToUpiId(), request.getAmount());
        return ResponseEntity.ok(transferService.initiateUpiTransfer(request, username));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Transaction>> getHistory(@RequestParam String upiId) {
        return ResponseEntity.ok(transferService.getHistory(upiId));
    }
}
