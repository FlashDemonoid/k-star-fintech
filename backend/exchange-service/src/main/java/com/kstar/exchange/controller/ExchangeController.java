package com.kstar.exchange.controller;

import com.kstar.exchange.document.ConversionHistory;
import com.kstar.exchange.document.ExchangeRate;
import com.kstar.exchange.dto.ConvertRequest;
import com.kstar.exchange.dto.ConvertResponse;
import com.kstar.exchange.service.ExchangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/exchange")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;

    @PostMapping("/convert")
    public ResponseEntity<ConvertResponse> convert(
            @Valid @RequestBody ConvertRequest request,
            @RequestHeader(value="X-User-Name", defaultValue="anonymous") String username) {
        return ResponseEntity.ok(exchangeService.convert(request, username));
    }

    @GetMapping("/rates")
    public ResponseEntity<List<ExchangeRate>> getAllRates() {
        return ResponseEntity.ok(exchangeService.getAllRates());
    }

    @GetMapping("/history")
    public ResponseEntity<List<ConversionHistory>> getHistory(
            @RequestHeader(value="X-User-Name", defaultValue="anonymous") String username) {
        return ResponseEntity.ok(exchangeService.getUserHistory(username));
    }
}
