package com.minimalecommerce.app;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requiere MySQL local; este repo es una guía de núcleo, no un entorno de CI")
class MinimalecommerceApplicationTests {

    @Test
    void contextLoads() {
    }
}
