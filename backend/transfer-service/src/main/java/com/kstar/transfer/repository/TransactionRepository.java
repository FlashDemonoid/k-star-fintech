package com.kstar.transfer.repository;

import com.kstar.transfer.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByFromUpiIdOrToUpiIdOrderByCreatedAtDesc(String fromUpiId, String toUpiId);
    List<Transaction> findByFromUpiIdOrderByCreatedAtDesc(String fromUpiId);
}
