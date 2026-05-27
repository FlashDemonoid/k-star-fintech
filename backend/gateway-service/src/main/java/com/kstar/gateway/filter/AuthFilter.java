package com.kstar.gateway.filter;

import com.kstar.gateway.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class AuthFilter extends AbstractGatewayFilterFactory<AuthFilter.Config> {

    // These two don't need a token — everything else does
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register"
    );

    @Autowired
    private JwtUtil jwtUtil;

    public AuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getPath().toString();

            if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
                return chain.filter(exchange);
            }

            String authHeader = exchange.getRequest()
                    .getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.isTokenValid(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String username = jwtUtil.extractUsername(token);
            log.info("Authenticated user: {} accessing {}", username, path);

            // Pass username downstream so services don't have to re-parse the token
            var mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Name", username)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        };
    }

    public static class Config {}
}
