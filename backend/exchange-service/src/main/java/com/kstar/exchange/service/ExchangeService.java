package com.kstar.exchange.service;

import com.kstar.exchange.document.ConversionHistory;
import com.kstar.exchange.document.ExchangeRate;
import com.kstar.exchange.dto.ConvertRequest;
import com.kstar.exchange.dto.ConvertResponse;
import com.kstar.exchange.event.RateUpdateEvent;
import com.kstar.exchange.repository.ConversionHistoryRepository;
import com.kstar.exchange.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final ConversionHistoryRepository conversionHistoryRepository;
    private final KafkaTemplate<String, RateUpdateEvent> kafkaTemplate;

    private final Random random = new Random();

    /**
     * Base exchange rates — approximate real-world values as of late 2024.
     * Each conversion gets a small random fluctuation (±0.1%) to mimic
     * a live market feed without needing an actual API key.
     */
    private static final Map<String, Map<String, Double>> BASE_RATES = new HashMap<>();
    static {
        BASE_RATES.put("USD", Map.of("INR",84.12,"EUR",0.92,"GBP",0.79,"JPY",151.4,"USD",1.0));
        BASE_RATES.put("INR", Map.of("USD",0.0119,"EUR",0.0109,"GBP",0.0094,"JPY",1.80,"INR",1.0));
        BASE_RATES.put("EUR", Map.of("USD",1.087,"INR",91.6,"GBP",0.859,"JPY",164.5,"EUR",1.0));
        BASE_RATES.put("GBP", Map.of("USD",1.268,"INR",106.7,"EUR",1.164,"JPY",191.5,"GBP",1.0));
        BASE_RATES.put("JPY", Map.of("USD",0.0066,"INR",0.556,"EUR",0.0061,"GBP",0.0052,"JPY",1.0));
    }

    private double fluctuate(double base) {
        double pct = (random.nextDouble() - 0.5) * 0.002; // ±0.1% per call
        return Math.round(base * (1 + pct) * 1000000.0) / 1000000.0;
    }

    public ConvertResponse convert(ConvertRequest request, String username) {
        String from = request.getFrom().toUpperCase();
        String to   = request.getTo().toUpperCase();

        if (from.equals(to)) {
            return new ConvertResponse(from, to, request.getAmount(), request.getAmount(),
                    BigDecimal.ONE, LocalDateTime.now());
        }

        double baseRate = BASE_RATES.getOrDefault(from, Map.of()).getOrDefault(to, 1.0);
        double liveRate = fluctuate(baseRate);
        BigDecimal rate   = BigDecimal.valueOf(liveRate);
        BigDecimal result = request.getAmount().multiply(rate).setScale(6, RoundingMode.HALF_UP);

        // Save to conversion history — best-effort, don't fail the request if MongoDB is slow
        try {
            ConversionHistory history = ConversionHistory.builder()
                    .username(username)
                    .fromCurrency(from)
                    .toCurrency(to)
                    .fromAmount(request.getAmount())
                    .toAmount(result)
                    .rateUsed(rate)
                    .convertedAt(LocalDateTime.now())
                    .build();
            conversionHistoryRepository.save(history);
        } catch (Exception e) {
            log.warn("Could not save conversion history: {}", e.getMessage());
        }

        log.info("Converted {} {} → {} {} @ {} for {}", request.getAmount(), from, result, to, liveRate, username);
        return new ConvertResponse(from, to, request.getAmount(), result, rate, LocalDateTime.now());
    }

    public List<ExchangeRate> getAllRates() {
        return exchangeRateRepository.findAll();
    }

    public List<ConversionHistory> getUserHistory(String username) {
        return conversionHistoryRepository.findByUsernameOrderByConvertedAtDesc(username);
    }

    /** Refreshes all rates in MongoDB every 30 seconds and fires a Kafka event. */
    @Scheduled(fixedRate = 30000)
    public void updateRates() {
        BASE_RATES.forEach((from, targets) ->
            targets.forEach((to, baseRate) -> {
                if (!from.equals(to)) {
                    try {
                        ExchangeRate rate = ExchangeRate.builder()
                                .baseCurrency(from)
                                .targetCurrency(to)
                                .rate(BigDecimal.valueOf(fluctuate(baseRate)))
                                .updatedAt(LocalDateTime.now())
                                .build();
                        exchangeRateRepository.save(rate);
                    } catch (Exception e) {
                        log.debug("Rate update skipped: {}", e.getMessage());
                    }
                }
            })
        );
        try {
            kafkaTemplate.send("rate-updates", new RateUpdateEvent("ALL", LocalDateTime.now()));
        } catch (Exception e) {
            log.debug("Kafka rate event skipped");
        }
        log.debug("Exchange rates updated at {}", LocalDateTime.now());
    }
}
