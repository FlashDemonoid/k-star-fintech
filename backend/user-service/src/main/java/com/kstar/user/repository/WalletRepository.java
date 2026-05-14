package com.kstar.user.repository;

import com.kstar.user.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);
    Optional<Wallet> findByUpiId(String upiId);
    Optional<Wallet> findByUserIdAndCurrency(Long userId, String currency);
}
