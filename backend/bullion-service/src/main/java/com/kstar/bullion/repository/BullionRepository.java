package com.kstar.bullion.repository;

import com.kstar.bullion.document.Bullion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BullionRepository extends MongoRepository<Bullion, String> {
    Optional<Bullion> findByTokenId(String tokenId);
    List<Bullion> findByOwnerUsername(String ownerUsername);
    List<Bullion> findByStatus(Bullion.BullionStatus status);
    List<Bullion> findByOwnerUsernameOrderByMintedAtDesc(String ownerUsername);
}
