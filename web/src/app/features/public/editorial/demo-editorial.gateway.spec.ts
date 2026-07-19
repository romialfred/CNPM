import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoEditorialGateway } from './demo-editorial.gateway';

describe('DemoEditorialGateway', () => {
  const gateway = new DemoEditorialGateway();

  it('n’expose que des publications explicitement fictives', async () => {
    const articles = await firstValueFrom(gateway.listArticles());
    expect(articles.length).toBeGreaterThan(0);
    expect(articles.every((article) => article.fictionalDemo)).toBe(true);
    expect(articles.every((article) => article.slug.length > 0)).toBe(true);
  });

  it('retourne null pour un article inconnu', async () => {
    await expect(firstValueFrom(gateway.findArticle('inconnu'))).resolves.toBeNull();
  });

  it('n’expose que des rendez-vous fictifs et sans lien d’inscription', async () => {
    const events = await firstValueFrom(gateway.listEvents());
    expect(events.every((event) => event.fictionalDemo)).toBe(true);
    expect(events.every((event) => !('registrationUrl' in event))).toBe(true);
  });
});
