-- Schema inicial del monolito modular. Tablas en inglés, IDs UUID (CHAR 36).

CREATE TABLE users (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20)  NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE addresses (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    user_id           CHAR(36)     NOT NULL,
    label             VARCHAR(100) NOT NULL,
    full_address      VARCHAR(400) NOT NULL,
    city              VARCHAR(100),
    postal_code       VARCHAR(20),
    phone             VARCHAR(20),
    primary_address   BOOLEAN      NOT NULL DEFAULT FALSE,
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_addresses_user ON addresses (user_id);

CREATE TABLE categories (
    id          CHAR(36)    NOT NULL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    CONSTRAINT uk_categories_name UNIQUE (name)
);

CREATE TABLE products (
    id          CHAR(36)       NOT NULL PRIMARY KEY,
    name        VARCHAR(150)   NOT NULL,
    description TEXT,
    price       DECIMAL(10, 2) NOT NULL,
    stock       INT            NOT NULL,
    image_url   VARCHAR(500),
    category_id CHAR(36)       NOT NULL,
    seller_id   CHAR(36)       NOT NULL,
    preorder    BOOLEAN        NOT NULL DEFAULT FALSE,
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    version     INT            NOT NULL DEFAULT 0,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users (id)
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_seller ON products (seller_id);
CREATE INDEX idx_products_active ON products (active);

CREATE TABLE cart_items (
    id          CHAR(36)       NOT NULL PRIMARY KEY,
    user_id     CHAR(36)       NOT NULL,
    product_id  CHAR(36)       NOT NULL,
    quantity    INT            NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    added_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cart_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE coupons (
    id           CHAR(36)       NOT NULL PRIMARY KEY,
    code         VARCHAR(50)    NOT NULL,
    coupon_type    VARCHAR(20)    NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    description  VARCHAR(500),
    starts_at    TIMESTAMP      NOT NULL,
    expires_at   TIMESTAMP      NOT NULL,
    max_uses     INT            NOT NULL,
    current_uses INT            NOT NULL DEFAULT 0,
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    creator_id   CHAR(36)       NOT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_coupons_code UNIQUE (code),
    CONSTRAINT fk_coupons_creator FOREIGN KEY (creator_id) REFERENCES users (id)
);

CREATE TABLE orders (
    id               CHAR(36)       NOT NULL PRIMARY KEY,
    buyer_id         CHAR(36)       NOT NULL,
    placed_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal         DECIMAL(10, 2) NOT NULL,
    discount         DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total            DECIMAL(10, 2) NOT NULL,
    status           VARCHAR(20)    NOT NULL,
    shipping_address VARCHAR(500)   NOT NULL,
    coupon_id        CHAR(36),
    coupon_code      VARCHAR(50),
    idempotency_key  VARCHAR(80),
    CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users (id),
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id)
);

CREATE UNIQUE INDEX uk_orders_idempotency ON orders (buyer_id, idempotency_key);
CREATE INDEX idx_orders_buyer ON orders (buyer_id);
CREATE INDEX idx_orders_status ON orders (status);

CREATE TABLE order_items (
    id          CHAR(36)       NOT NULL PRIMARY KEY,
    order_id    CHAR(36)       NOT NULL,
    product_id  CHAR(36)       NOT NULL,
    seller_id   CHAR(36)       NOT NULL,
    product_name VARCHAR(150)  NOT NULL,
    quantity    INT            NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_seller ON order_items (seller_id);

CREATE TABLE preorders (
    id                 CHAR(36)       NOT NULL PRIMARY KEY,
    user_id            CHAR(36)       NOT NULL,
    product_id         CHAR(36)       NOT NULL,
    quantity           INT            NOT NULL,
    preorder_price     DECIMAL(10, 2) NOT NULL,
    status             VARCHAR(20)    NOT NULL,
    notes              VARCHAR(500),
    estimated_delivery TIMESTAMP,
    created_at         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_preorders_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_preorders_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE reviews (
    id          CHAR(36)    NOT NULL PRIMARY KEY,
    author_id   CHAR(36)    NOT NULL,
    product_id  CHAR(36)    NOT NULL,
    seller_id   CHAR(36)    NOT NULL,
    rating      INT         NOT NULL,
    comment     TEXT,
    verified    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_reviews_author_product UNIQUE (author_id, product_id),
    CONSTRAINT fk_reviews_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE favorites (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    product_id    CHAR(36)  NOT NULL,
    notify_stock  BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_favorites_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE notifications (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    user_id    CHAR(36)     NOT NULL,
    sender_id  CHAR(36),
    type       VARCHAR(30)  NOT NULL,
    title      VARCHAR(150) NOT NULL,
    message    TEXT,
    read_flag  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_notifications_user ON notifications (user_id);

CREATE TABLE blog_posts (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    author_id    CHAR(36)     NOT NULL,
    category_id  CHAR(36),
    title        VARCHAR(250) NOT NULL,
    summary      VARCHAR(500),
    body         TEXT,
    image_url    VARCHAR(500),
    published    BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_blog_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_blog_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE events (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    organizer_id CHAR(36)    NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    starts_at   TIMESTAMP    NOT NULL,
    ends_at     TIMESTAMP,
    location    VARCHAR(300),
    image_url   VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users (id)
);

CREATE TABLE seller_metrics (
    id                 CHAR(36)       NOT NULL PRIMARY KEY,
    seller_id          CHAR(36)       NOT NULL,
    metric_date        DATE           NOT NULL,
    units_sold         INT            NOT NULL DEFAULT 0,
    sales_total        DECIMAL(12, 2) NOT NULL DEFAULT 0,
    orders_completed   INT            NOT NULL DEFAULT 0,
    updated_at         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_seller_metrics_day UNIQUE (seller_id, metric_date),
    CONSTRAINT fk_seller_metrics_seller FOREIGN KEY (seller_id) REFERENCES users (id)
);
