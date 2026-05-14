package com.kstar.nacha.repository;

import com.kstar.nacha.entity.NachaPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NachaPaymentRepository extends JpaRepository<NachaPayment, Long> {
    Optional<NachaPayment> findByPaymentId(String paymentId);
    List<NachaPayment> findByInitiatedByOrderByCreatedAtDesc(String username);
    List<NachaPayment> findByStatusOrderByCreatedAtDesc(NachaPayment.PaymentStatus status);

    @Query("SELECT n FROM NachaPayment n WHERE n.initiatedBy = :username ORDER BY n.createdAt DESC")
    List<NachaPayment> findUserHistory(String username);
}
