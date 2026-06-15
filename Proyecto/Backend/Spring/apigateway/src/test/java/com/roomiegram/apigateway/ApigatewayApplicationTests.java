package com.roomiegram.apigateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import com.roomiegram.apigateway.controller.FallbackController;

@ExtendWith(MockitoExtension.class)
class ApigatewayApplicationTests {

	@InjectMocks
	private FallbackController fallbackController;

	private WebTestClient client;

	@BeforeEach
	void setUp() {
		client = WebTestClient.bindToController(fallbackController).build();
	}

	@Test
	void contextLoads() {
	}

	@Test
	void fallbackReturnsServiceUnavailable() {
		client.get()
			.uri("/fallback")
			.accept(MediaType.APPLICATION_JSON)
			.exchange()
			.expectStatus().isEqualTo(503)
			.expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)
			.expectBody()
			.jsonPath("$.mensaje").isEqualTo("Servicio temporalmente no disponible. Intente en unos momentos.")
			.jsonPath("$.estado").isEqualTo("503");
	}

	@Test
	void fallbackReturnsJsonBody() {
		client.get()
			.uri("/fallback")
			.exchange()
			.expectBody()
			.jsonPath("$.mensaje").isNotEmpty()
			.jsonPath("$.estado").isEqualTo("503");
	}

}
