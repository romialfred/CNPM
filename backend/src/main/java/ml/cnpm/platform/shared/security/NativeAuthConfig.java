package ml.cnpm.platform.shared.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Beans de l'authentification native (AUTH-DEC-020). L'encodeur bcrypt vérifie le mot de
 * passe applicatif ; aucun mot de passe n'est jamais stocké ni journalisé en clair.
 */
@Configuration
public class NativeAuthConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
