package com.kstar.nft.controller;

import com.kstar.nft.document.NFT;
import com.kstar.nft.dto.MintRequest;
import com.kstar.nft.service.NFTService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/nft")
@RequiredArgsConstructor
public class NFTController {

    private final NFTService nftService;

    @PostMapping("/mint")
    public ResponseEntity<NFT> mint(
            @Valid @RequestBody MintRequest request,
            @RequestHeader(value="X-User-Name", defaultValue="anonymous") String username) {
        return ResponseEntity.ok(nftService.mint(request, username));
    }

    @GetMapping("/marketplace")
    public ResponseEntity<List<NFT>> getMarketplace() {
        return ResponseEntity.ok(nftService.getMarketplace());
    }

    @PostMapping("/trade/{tokenId}")
    public ResponseEntity<NFT> trade(
            @PathVariable String tokenId,
            @RequestHeader(value="X-User-Name", defaultValue="anonymous") String username) {
        return ResponseEntity.ok(nftService.trade(tokenId, username));
    }

    @GetMapping("/my")
    public ResponseEntity<List<NFT>> getMyNfts(
            @RequestHeader(value="X-User-Name", defaultValue="anonymous") String username) {
        return ResponseEntity.ok(nftService.getByOwner(username));
    }
}
