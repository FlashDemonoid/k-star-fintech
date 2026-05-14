package com.kstar.nft.repository;

import com.kstar.nft.document.NFT;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NFTRepository extends MongoRepository<NFT, String> {
    Optional<NFT> findByTokenId(String tokenId);
    List<NFT> findByOwnerUsername(String ownerUsername);
    List<NFT> findByStatus(NFT.NFTStatus status);
}
