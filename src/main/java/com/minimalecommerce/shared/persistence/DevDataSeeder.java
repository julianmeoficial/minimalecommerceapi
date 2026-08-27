package com.minimalecommerce.shared.persistence;

import com.minimalecommerce.catalog.domain.Category;
import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.catalog.infrastructure.CategoryRepository;
import com.minimalecommerce.catalog.infrastructure.ProductRepository;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.identity.infrastructure.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@ConditionalOnProperty(name = "app.seed", havingValue = "true")
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final UserRepository users;
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(UserRepository users,
                         CategoryRepository categories,
                         ProductRepository products,
                         PasswordEncoder passwordEncoder) {
        this.users = users;
        this.categories = categories;
        this.products = products;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByEmailIgnoreCase("comprador@demo.com")) {
            return;
        }
        User buyer = user("Comprador Demo", "comprador@demo.com", UserRole.COMPRADOR);
        User seller = user("Vendedor Demo", "vendedor@demo.com", UserRole.VENDEDOR);
        users.save(buyer);
        users.save(seller);

        Category electronics = category("Electrónica", "Gadgets y dispositivos");
        Category home = category("Hogar", "Artículos para el hogar");
        categories.save(electronics);
        categories.save(home);

        products.save(product("Auriculares inalámbricos", "Bluetooth 5.3", "49.90", 25, electronics, seller));
        products.save(product("Lámpara de escritorio", "LED regulable", "19.50", 40, home, seller));

        log.info("Seed de desarrollo listo. Usuarios: comprador@demo.com / vendedor@demo.com (password: demo12345)");
    }

    private User user(String name, String email, UserRole role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("demo12345"));
        user.setRole(role);
        return user;
    }

    private Category category(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return category;
    }

    private Product product(String name, String description, String price, int stock, Category category, User seller) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(new BigDecimal(price));
        product.setStock(stock);
        product.setCategory(category);
        product.setSeller(seller);
        return product;
    }
}
