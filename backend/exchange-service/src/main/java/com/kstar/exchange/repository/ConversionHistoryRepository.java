package com.kstar.exchange.repository;

import com.kstar.exchange.document.ConversionHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConversionHistoryRepository extends MongoRepository<ConversionHistory, String> {
    List<ConversionHistory> findByUsernameOrderByConvertedAtDesc(String username);
}
