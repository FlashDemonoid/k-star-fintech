package com.kstar.nft.service;

import com.kstar.nft.document.NFT;
import com.kstar.nft.dto.MintRequest;
import com.kstar.nft.event.NFTTradeEvent;
import com.kstar.nft.repository.NFTRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NFTService {

    private final NFTRepository nftRepository;
    private final KafkaTemplate<String, NFTTradeEvent> kafkaTemplate;

    public NFT mint(MintRequest request, String username) {
        NFT nft = NFT.builder()
                .tokenId("TOKEN-" + UUID.randomUUID().toString().substring(0,8).toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .ownerUsername(username)
                .creatorUsername(username)
                .price(request.getInitialPrice())
                .currency("INR")
                .status(NFT.NFTStatus.MINTED)
                .mintedAt(LocalDateTime.now())
                .build();
        NFT saved = nftRepository.save(nft);
        publishEvent(saved, username, username, "MINTED");
        return saved;
    }

    public List<NFT> getMarketplace() {
        return nftRepository.findByStatus(NFT.NFTStatus.FOR_SALE);
    }

    public List<NFT> getByOwner(String username) {
        return nftRepository.findByOwnerUsername(username);
    }

    public NFT trade(String tokenId, String buyerUsername) {
        NFT nft = nftRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new RuntimeException("Item not found: " + tokenId));
        if (nft.getStatus() != NFT.NFTStatus.FOR_SALE) {
            throw new IllegalStateException("Item is not available for purchase");
        }
        String prevOwner = nft.getOwnerUsername();
        nft.setOwnerUsername(buyerUsername);
        nft.setStatus(NFT.NFTStatus.SOLD);
        nft.setUpdatedAt(LocalDateTime.now());
        NFT saved = nftRepository.save(nft);
        publishEvent(saved, prevOwner, buyerUsername, "TRADED");
        return saved;
    }

    private void publishEvent(NFT nft, String from, String to, String type) {
        try {
            kafkaTemplate.send("nft-trades", nft.getTokenId(),
                new NFTTradeEvent(nft.getTokenId(), from, to, nft.getPrice(), type, LocalDateTime.now()));
        } catch (Exception e) {
            log.debug("Kafka publish skipped: {}", e.getMessage());
        }
    }
}
