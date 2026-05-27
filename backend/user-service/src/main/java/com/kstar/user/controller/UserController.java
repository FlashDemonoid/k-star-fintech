package com.kstar.user.controller;

import com.kstar.user.dto.UserDto;
import com.kstar.user.dto.WalletDto;
import com.kstar.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getProfile(
            @RequestHeader("X-User-Name") String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }

    @GetMapping("/me/wallets")
    public ResponseEntity<List<WalletDto>> getMyWallets(
            @RequestHeader("X-User-Name") String username) {
        UserDto user = userService.getUserByUsername(username);
        return ResponseEntity.ok(user.getWallets());
    }

    @GetMapping("/{id}/wallets")
    public ResponseEntity<List<WalletDto>> getUserWallets(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserWallets(id));
    }

    @PostMapping("/{id}/wallets")
    public ResponseEntity<WalletDto> createWallet(
            @PathVariable Long id, @RequestParam String currency) {
        return ResponseEntity.ok(userService.createWallet(id, currency));
    }

    @GetMapping("/me/balance")
    public ResponseEntity<Double> getTotalBalance(
            @RequestHeader("X-User-Name") String username) {
        return ResponseEntity.ok(userService.getTotalBalance(username));
    }

    @GetMapping("/me/upi")
    public ResponseEntity<Map<String,String>> getUpiInfo(
            @RequestHeader("X-User-Name") String username) {
        return ResponseEntity.ok(userService.getUpiInfo(username));
    }

    @GetMapping("/me/wallets/{currency}")
    public ResponseEntity<WalletDto> getWalletByCurrency(
            @RequestHeader("X-User-Name") String username,
            @PathVariable String currency) {
        return ResponseEntity.ok(userService.getOrCreateWallet(username, currency));
    }

    /**
     * Frontend uses this for Add Money, deductions, etc.
     * Positive amount = credit, negative = debit.
     */
    @PostMapping("/me/wallets/adjust")
    public ResponseEntity<WalletDto> adjustMyWallet(
            @RequestHeader("X-User-Name") String username,
            @RequestBody Map<String, Object> body) {
        String currency   = (String) body.get("currency");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        log.info("Wallet adjust (me): {} {} {}", username, currency, amount);
        return ResponseEntity.ok(userService.adjustWalletBalance(username, currency, amount));
    }

    /**
     * Internal endpoint — called by transfer-service, not directly from frontend.
     * Identifies the wallet via UPI ID since that's what transfer-service works with.
     */
    @PostMapping("/wallet/adjust-by-upi")
    public ResponseEntity<WalletDto> adjustByUpi(
            @RequestBody Map<String, Object> body) {
        String upiId      = (String) body.get("upiId");
        String currency   = (String) body.get("currency");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        log.info("Wallet adjust (upi): {} {} {}", upiId, currency, amount);
        return ResponseEntity.ok(userService.adjustWalletByUpiId(upiId, currency, amount));
    }

    /**
     * Internal endpoint — transfer-service calls this before processing a transfer
     * to check the UPI PIN.
     */
    @PostMapping("/wallet/validate-upi")
    public ResponseEntity<Map<String,Boolean>> validateUpi(
            @RequestBody Map<String, String> body) {
        String upiId = body.get("upiId");
        String pin   = body.get("pin");
        boolean valid = userService.validateUpiPin(upiId, pin);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    /** Frontend sometimes uses /me/wallets to create a new wallet instead of /{id}/wallets. */
    @PostMapping("/me/wallets")
    public ResponseEntity<WalletDto> createMyWallet(
            @RequestHeader("X-User-Name") String username,
            @RequestParam String currency) {
        UserDto user = userService.getUserByUsername(username);
        return ResponseEntity.ok(userService.createWallet(user.getId(), currency));
    }
}
