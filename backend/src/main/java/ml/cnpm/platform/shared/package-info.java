/**
 * Noyau partagé : infrastructure transverse (corrélation, réponses d'erreur
 * normalisées, sécurité, empreintes) consommée par tous les modules métier.
 *
 * <p>Module Spring Modulith déclaré {@code OPEN} : contrairement à un module métier
 * fermé, un noyau partagé expose délibérément ses types à tous les autres modules. La
 * garde de frontières ({@code ModularityTest}) continue d'interdire à un module métier
 * de lire les internes d'un <em>autre module métier</em> ; elle n'a pas à traiter cette
 * infrastructure commune comme une frontière à franchir.
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package ml.cnpm.platform.shared;
