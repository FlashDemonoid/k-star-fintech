package com.kstar.exchange.repository;

import com.kstar.exchange.document.ExchangeRate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends MongoRepository<ExchangeRate, String> {
    Optional<ExchangeRate> findByBaseCurrencyAndTargetCurrency(String base, String target);
}
