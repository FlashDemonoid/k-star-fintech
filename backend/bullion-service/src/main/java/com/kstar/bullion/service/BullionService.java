package com.kstar.bullion.service;

import com.kstar.bullion.document.Bullion;
import com.kstar.bullion.dto.MintRequest;
import com.kstar.bullion.event.BullionTradeEvent;
import com.kstar.bullion.repository.BullionRepository;
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
public class BullionService {

    private final BullionRepository bullionRepository;
    private final KafkaTemplate<String, BullionTradeEvent> kafkaTemplate;

    public Bullion mint(MintRequest request, String username) {
        Bullion bullion = Bullion.builder()
                .tokenId("BULLION-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .metal(request.getMetal())
                .ownerUsername(username)
                .creatorUsername(username)
                .price(request.getInitialPrice())
                .currency("INR")
                .status(Bullion.BullionStatus.ACTIVE)
                .mintedAt(LocalDateTime.now())
                .build();

        Bullion saved = bullionRepository.save(bullion);
        publishEvent(saved, username, username, "MINTED");
        log.info("Bullion minted: {} {} by {}", saved.getMetal(), saved.getTokenId(), username);
        return saved;
    }

    public List<Bullion> getMarketplace() {
        return bullionRepository.findByStatus(Bullion.BullionStatus.FOR_SALE);
    }

    public List<Bullion> getByOwner(String username) {
        return bullionRepository.findByOwnerUsernameOrderByMintedAtDesc(username);
    }

    public Bullion trade(String tokenId, String buyerUsername) {
        Bullion bullion = bullionRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new RuntimeException("Bullion item not found: " + tokenId));

        if (bullion.getStatus() != Bullion.BullionStatus.FOR_SALE) {
            throw new IllegalStateException("Item is not available for purchase");
        }

        String prevOwner = bullion.getOwnerUsername();
        bullion.setOwnerUsername(buyerUsername);
        bullion.setStatus(Bullion.BullionStatus.SOLD);
        bullion.setUpdatedAt(LocalDateTime.now());

        Bullion saved = bullionRepository.save(bullion);
        publishEvent(saved, prevOwner, buyerUsername, "TRADED");
        log.info("Bullion traded: {} from {} to {}", tokenId, prevOwner, buyerUsername);
        return saved;
    }

    private void publishEvent(Bullion bullion, String from, String to, String type) {
        try {
            kafkaTemplate.send("bullion-trades", bullion.getTokenId(),
                new BullionTradeEvent(bullion.getTokenId(), from, to,
                        bullion.getPrice(), bullion.getMetal(), type, LocalDateTime.now()));
        } catch (Exception e) {
            log.debug("Kafka publish skipped: {}", e.getMessage());
        }
    }
}
