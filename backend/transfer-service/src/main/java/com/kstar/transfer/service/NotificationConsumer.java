package com.kstar.transfer.service;

import com.kstar.transfer.event.TransferEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationConsumer {

    @KafkaListener(topics = "transfer-events", groupId = "transfer-service")
    public void onTransferEvent(TransferEvent event) {
        log.info("Transfer event received: {} → {} ₹{} [{}]",
                event.getFromUpiId(), event.getToUpiId(),
                event.getAmount(), event.getStatus());
        // TODO: hook this into push notifications, email, or SMS later
    }
}
