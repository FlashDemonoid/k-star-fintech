package com.kstar.user.service;

import com.kstar.user.dto.AuthRequest;
import com.kstar.user.dto.AuthResponse;
import com.kstar.user.dto.RegisterRequest;
import com.kstar.user.dto.WalletDto;
import com.kstar.user.entity.User;
import com.kstar.user.entity.Wallet;
import com.kstar.user.event.UserEvent;
import com.kstar.user.repository.UserRepository;
import com.kstar.user.repository.WalletRepository;
import com.kstar.user.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository   userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JwtUtil          jwtUtil;
    private final KafkaTemplate<String, UserEvent> kafkaTemplate;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken");
        if (userRepository.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already registered");
        if (userRepository.existsByPhone(request.getPhone()))
            throw new IllegalArgumentException("Phone number is already registered");

        User user = userRepository.save(User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.USER)
                .build());

        // INR wallet: ₹10,000 starter + UPI ID
        Wallet inrWallet = walletRepository.save(Wallet.builder()
                .user(user).currency("INR")
                .balance(new BigDecimal("10000.00"))
                .upiId(request.getPhone() + "@kstar")
                .build());

        // USD and EUR at zero
        List.of("USD", "EUR").forEach(c ->
            walletRepository.save(Wallet.builder()
                    .user(user).currency(c)
                    .balance(BigDecimal.ZERO).build()));

        // Kafka — non-blocking
        try {
            kafkaTemplate.send("user-events", String.valueOf(user.getId()),
                    new UserEvent(user.getId(), user.getUsername(), user.getEmail(), "USER_REGISTERED"));
        } catch (Exception e) {
            log.warn("Kafka event skipped: {}", e.getMessage());
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        log.info("Registered: {} | UPI: {}", user.getUsername(), inrWallet.getUpiId());

        List<WalletDto> wallets = walletRepository.findByUserId(user.getId()).stream()
                .map(this::toWalletDto).collect(Collectors.toList());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .upiId(inrWallet.getUpiId())
                .wallets(wallets)
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new BadCredentialsException("Invalid credentials");

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        List<WalletDto> wallets = walletRepository.findByUserId(user.getId()).stream()
                .map(this::toWalletDto).collect(Collectors.toList());

        String upiId = wallets.stream()
                .filter(w -> w.getUpiId() != null)
                .map(WalletDto::getUpiId)
                .findFirst().orElse(user.getPhone() + "@kstar");

        log.info("Login: {}", user.getUsername());
        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .upiId(upiId)
                .wallets(wallets)
                .build();
    }

    private WalletDto toWalletDto(Wallet w) {
        return WalletDto.builder()
                .id(w.getId()).currency(w.getCurrency())
                .balance(w.getBalance()).upiId(w.getUpiId()).build();
    }
}
