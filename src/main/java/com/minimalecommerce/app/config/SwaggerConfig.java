package com.minimalecommerce.app.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MinimalEcommerce API")
                        .version("0.0.1-SNAPSHOT")
                        .description("Base de API REST. El dominio se reconstruye desde cero."));
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("minimalecommerce")
                .packagesToScan("com.minimalecommerce.app.controller")
                .build();
    }
}
