package com.minimalecommerce.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private String uploadDir = "./uploads";
    private Cors cors = new Cors();
    private boolean seed = false;

    public Jwt getJwt() { return jwt; }
    public void setJwt(Jwt jwt) { this.jwt = jwt; }
    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }
    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }
    public boolean isSeed() { return seed; }
    public void setSeed(boolean seed) { this.seed = seed; }

    public static class Jwt {
        private String secret = "dev-only-change-me-to-a-long-random-secret-key";
        private long expirationMs = 86_400_000L;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }

    public static class Cors {
        private String origins = "http://localhost:3000";

        public String getOrigins() { return origins; }
        public void setOrigins(String origins) { this.origins = origins; }
    }
}
