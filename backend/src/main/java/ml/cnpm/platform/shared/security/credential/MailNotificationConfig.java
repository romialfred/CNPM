package ml.cnpm.platform.shared.security.credential;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Active la liaison des propriétés {@code cnpm.mail.*} sur {@link CnpmMailProperties}. */
@Configuration
@EnableConfigurationProperties(CnpmMailProperties.class)
public class MailNotificationConfig {}
