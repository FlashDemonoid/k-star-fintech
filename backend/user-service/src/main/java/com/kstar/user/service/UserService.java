package com.kstar.user.service;

import com.kstar.user.dto.UserDto;
import com.kstar.user.dto.WalletDto;
import com.kstar.user.entity.User;
import com.kstar.user.entity.Wallet;
import com.kstar.user.repository.UserRepository;
import com.kstar.user.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository   userRepository;
    private final WalletRepository walletRepository;

    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return mapToDto(user);
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return mapToDto(user);
    }

    public List<WalletDto> getUserWallets(Long userId) {
        return walletRepository.findByUserId(userId).stream()
                .map(this::mapWalletToDto).collect(Collectors.toList());
    }

    @Transactional
    public WalletDto createWallet(Long userId, String currency) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        walletRepository.findByUserIdAndCurrency(userId, currency.toUpperCase())
                .ifPresent(w -> { throw new IllegalArgumentException("Wallet already exists for " + currency); });
        Wallet wallet = Wallet.builder()
                .user(user).currency(currency.toUpperCase())
                .balance(BigDecimal.ZERO).build();
        return mapWalletToDto(walletRepository.save(wallet));
    }

    /**
     * Adjust wallet by USERNAME — used by frontend direct calls.
     */
    @Transactional
    public WalletDto adjustWalletBalance(String username, String currency, BigDecimal amount) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return adjustWalletForUser(user, currency, amount);
    }

    /**
     * Adjust wallet by UPI ID — used by transfer-service (inter-service call).
     * UPI ID format: phone@kstar → look up wallet directly.
     */
    @Transactional
    public WalletDto adjustWalletByUpiId(String upiId, String currency, BigDecimal amount) {
        // Find wallet by UPI ID first (only INR wallet has UPI ID)
        Wallet inrWallet = walletRepository.findByUpiId(upiId)
                .orElseThrow(() -> new RuntimeException("No wallet found for UPI ID: " + upiId));
        User user = inrWallet.getUser();
        log.info("UPI wallet adjust: {} ({}) {} {}", upiId, user.getUsername(), currency, amount);
        return adjustWalletForUser(user, currency, amount);
    }

    /**
     * Validate UPI PIN: last 4 digits of phone number.
     */
    public boolean validateUpiPin(String upiId, String pin) {
        Wallet wallet = walletRepository.findByUpiId(upiId)
                .orElseThrow(() -> new RuntimeException("UPI ID not found: " + upiId));
        String phone = wallet.getUser().getPhone();
        String expectedPin = phone.length() >= 4
                ? phone.substring(phone.length() - 4) : phone;
        return expectedPin.equals(pin);
    }

    private WalletDto adjustWalletForUser(User user, String currency, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdAndCurrency(user.getId(), currency.toUpperCase())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(user).currency(currency.toUpperCase())
                            .balance(BigDecimal.ZERO).build();
                    return walletRepository.save(w);
                });
        BigDecimal newBalance = wallet.getBalance().add(amount);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient balance in " + currency + " wallet. Available: ₹" + wallet.getBalance());
        }
        wallet.setBalance(newBalance);
        return mapWalletToDto(walletRepository.save(wallet));
    }

    @Transactional
    public WalletDto getOrCreateWallet(String username, String currency) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        Wallet wallet = walletRepository.findByUserIdAndCurrency(user.getId(), currency.toUpperCase())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(user).currency(currency.toUpperCase())
                            .balance(BigDecimal.ZERO).build();
                    return walletRepository.save(w);
                });
        return mapWalletToDto(wallet);
    }

    public Map<String, String> getUpiInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String upiId  = user.getPhone() + "@kstar";
        String pinHint = "Last 4 digits of phone: " +
                user.getPhone().substring(Math.max(0, user.getPhone().length() - 4));
        return Map.of("upiId", upiId, "pinHint", pinHint,
                "phone", user.getPhone(), "username", user.getUsername());
    }

    public Double getTotalBalance(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return walletRepository.findByUserId(user.getId()).stream()
                .mapToDouble(w -> {
                    double bal = w.getBalance().doubleValue();
                    return switch (w.getCurrency()) {
                        case "USD" -> bal * 84.0;
                        case "EUR" -> bal * 90.0;
                        case "GBP" -> bal * 107.0;
                        case "JPY" -> bal * 0.56;
                        case "GOLD"   -> bal * 6250.0;
                        case "SILVER" -> bal * 74.0;
                        default -> bal;
                    };
                }).sum();
    }

    private UserDto mapToDto(User user) {
        List<WalletDto> wallets = walletRepository.findByUserId(user.getId())
                .stream().map(this::mapWalletToDto).collect(Collectors.toList());
        return UserDto.builder()
                .id(user.getId()).username(user.getUsername())
                .email(user.getEmail()).phone(user.getPhone())
                .role(user.getRole().name()).wallets(wallets)
                .createdAt(user.getCreatedAt()).build();
    }

    private WalletDto mapWalletToDto(Wallet wallet) {
        return WalletDto.builder()
                .id(wallet.getId()).currency(wallet.getCurrency())
                .balance(wallet.getBalance()).upiId(wallet.getUpiId()).build();
    }
}
