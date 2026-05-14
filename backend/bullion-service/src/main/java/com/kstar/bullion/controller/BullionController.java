package com.kstar.bullion.controller;

import com.kstar.bullion.document.Bullion;
import com.kstar.bullion.dto.MintRequest;
import com.kstar.bullion.service.BullionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/bullion")
@RequiredArgsConstructor
public class BullionController {

    private final BullionService bullionService;

    /**
     * Mint a new bullion holding (gold or silver).
     */
    @PostMapping("/mint")
    public ResponseEntity<Bullion> mint(
            @Valid @RequestBody MintRequest request,
            @RequestHeader(value = "X-User-Name", defaultValue = "anonymous") String username) {
        return ResponseEntity.ok(bullionService.mint(request, username));
    }

    /**
     * Get all bullion items listed for sale in the marketplace.
     */
    @GetMapping("/marketplace")
    public ResponseEntity<List<Bullion>> getMarketplace() {
        return ResponseEntity.ok(bullionService.getMarketplace());
    }

    /**
     * Trade / purchase a bullion item from the marketplace.
     */
    @PostMapping("/trade/{tokenId}")
    public ResponseEntity<Bullion> trade(
            @PathVariable String tokenId,
            @RequestHeader(value = "X-User-Name", defaultValue = "anonymous") String username) {
        return ResponseEntity.ok(bullionService.trade(tokenId, username));
    }

    /**
     * Get all bullion holdings of the logged-in user.
     */
    @GetMapping("/my")
    public ResponseEntity<List<Bullion>> getMyHoldings(
            @RequestHeader(value = "X-User-Name", defaultValue = "anonymous") String username) {
        return ResponseEntity.ok(bullionService.getByOwner(username));
    }
}
