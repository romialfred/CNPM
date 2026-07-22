# syntax=docker/dockerfile:1
# Image du backend CNPM (Spring Boot 4.1, Java 25). Contexte de build : dossier backend/.
# Multi-etapes : compilation avec le JDK + wrapper Maven, execution sur un JRE mince.

# ---------- Etape 1 : build ----------
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src

# Wrapper + pom d'abord (couche stable), puis les sources.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
COPY src/ src/

# Compilation + packaging du jar executable (tests exclus : ils exigent Testcontainers/Docker).
# Le cache BuildKit du depot Maven evite de retelecharger les dependances a chaque build.
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp -DskipTests \
      -Dmaven.wagon.http.retryHandler.count=5 \
      -Dmaven.wagon.http.retryHandler.requestSentEnabled=true \
      -Dmaven.wagon.rto=60000 \
      clean package \
    && cp target/cnpm-platform-*.jar /app.jar

# ---------- Etape 2 : runtime ----------
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# Utilisateur non-root.
RUN useradd -r -u 10001 appuser
COPY --from=build /app.jar /app/app.jar
USER appuser

# Render fournit le port via $PORT ; l'app s'y lie. MaxRAMPercentage adapte le tas a
# la memoire reellement allouee au conteneur (instances Render).
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java -XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -jar /app/app.jar --server.port=${PORT:-8080}"]
