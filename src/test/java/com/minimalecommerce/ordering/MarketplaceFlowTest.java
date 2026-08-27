package com.minimalecommerce.ordering;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minimalecommerce.MinimalecommerceApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = MinimalecommerceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketplaceFlowTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void buyerCompletesCheckoutWithCouponAndAtomicStock() throws Exception {
        String sellerToken = register("seller-" + UUID.randomUUID() + "@shop.test", "VENDEDOR");
        String buyerToken = register("buyer-" + UUID.randomUUID() + "@shop.test", "COMPRADOR");

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());

        String categoryId = json(postAuth(sellerToken, "/api/v1/categories", """
                {"name":"Gadgets-%s","description":"Test"}
                """.formatted(UUID.randomUUID().toString().substring(0, 8)))).get("id").asText();

        JsonNode product = json(postAuth(sellerToken, "/api/v1/products", """
                {"name":"Auriculares","description":"BT","price":100.00,"stock":2,"categoryId":"%s","preorder":false}
                """.formatted(categoryId)));
        String productId = product.get("id").asText();

        Instant starts = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant expires = Instant.now().plus(2, ChronoUnit.DAYS);
        postAuth(sellerToken, "/api/v1/coupons", """
                {"code":"SAVE10%s","type":"PORCENTAJE","value":10,"description":"10%%","startsAt":"%s","expiresAt":"%s","maxUses":5}
                """.formatted(UUID.randomUUID().toString().substring(0, 6).toUpperCase(), starts, expires));

        JsonNode coupon = json(mockMvc.perform(get("/api/v1/coupons/mine")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andReturn());
        String couponCode = coupon.get(0).get("code").asText();

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Hack","description":"x","price":1,"stock":1,"categoryId":"%s","preorder":false}
                                """.formatted(categoryId)))
                .andExpect(status().isForbidden());

        postAuth(buyerToken, "/api/v1/cart/items", """
                {"productId":"%s","quantity":2}
                """.formatted(productId));

        JsonNode order = json(mockMvc.perform(post("/api/v1/cart/checkout")
                        .header("Authorization", "Bearer " + buyerToken)
                        .header("Idempotency-Key", "checkout-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shippingAddress":"Calle 1 #2-3, Bogotá","couponCode":"%s"}
                                """.formatted(couponCode)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDIENTE")))
                .andExpect(jsonPath("$.subtotal", is(200.0)))
                .andExpect(jsonPath("$.discount", is(20.0)))
                .andExpect(jsonPath("$.total", is(180.0)))
                .andExpect(jsonPath("$.couponCode", is(couponCode)))
                .andReturn());

        String orderId = order.get("id").asText();

        mockMvc.perform(post("/api/v1/cart/checkout")
                        .header("Authorization", "Bearer " + buyerToken)
                        .header("Idempotency-Key", "checkout-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shippingAddress":"Calle 1 #2-3, Bogotá","couponCode":"%s"}
                                """.formatted(couponCode)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(orderId)));

        mockMvc.perform(get("/api/v1/products/" + productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock", is(0)));

        mockMvc.perform(post("/api/v1/cart/checkout")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shippingAddress":"Calle 1 #2-3, Bogotá"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("EMPTY_CART")));
    }

    @Test
    void rejectsInsufficientStockExpiredCouponAndPlainLogin() throws Exception {
        String sellerToken = register("seller2-" + UUID.randomUUID() + "@shop.test", "VENDEDOR");
        String buyerToken = register("buyer2-" + UUID.randomUUID() + "@shop.test", "COMPRADOR");

        String categoryId = json(postAuth(sellerToken, "/api/v1/categories", """
                {"name":"Hogar-%s","description":"Test"}
                """.formatted(UUID.randomUUID().toString().substring(0, 8)))).get("id").asText();

        String productId = json(postAuth(sellerToken, "/api/v1/products", """
                {"name":"Lámpara","description":"LED","price":50.00,"stock":1,"categoryId":"%s","preorder":false}
                """.formatted(categoryId))).get("id").asText();

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"%s","quantity":5}
                                """.formatted(productId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("STOCK_INSUFFICIENT")));

        Instant starts = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant expires = Instant.now().plus(10, ChronoUnit.DAYS);
        String code = "FUTURO" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        postAuth(sellerToken, "/api/v1/coupons", """
                {"code":"%s","type":"MONTO_FIJO","value":5,"description":"aún no","startsAt":"%s","expiresAt":"%s","maxUses":1}
                """.formatted(code, starts, expires));

        postAuth(buyerToken, "/api/v1/cart/items", """
                {"productId":"%s","quantity":1}
                """.formatted(productId));

        mockMvc.perform(post("/api/v1/cart/checkout")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shippingAddress":"Cra 7","couponCode":"%s"}
                                """.formatted(code)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("COUPON_INVALID")));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@shop.test","password":"wrongpass"}
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/v1/orders/" + UUID.randomUUID() + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CONFIRMADO"}
                                """))
                .andExpect(status().isForbidden());

        assertThat(buyerToken).isNotBlank();
        assertThat(sellerToken).isNotBlank();
    }

    private String register(String email, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Demo","email":"%s","password":"demo12345","role":"%s"}
                                """.formatted(email, role)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.email", is(email)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private MvcResult postAuth(String token, String path, String body) throws Exception {
        return mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
    }

    private JsonNode json(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
