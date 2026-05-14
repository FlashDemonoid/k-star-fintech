package com.kstar.nacha;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NachaServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NachaServiceApplication.class, args);
    }
}
