import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('frontend login fallback', () => {
  it('logs in the demo super admin when the live API rejects the email', async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK = 'true';

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    try {
      const { getCurrentUser, login } = await import('../src/lib/api');

      const response = await login('ayushgarg.official07@gmail.com', 'workpulse-dev-pass');
      assert.equal(response.user.email, 'ayushgarg.official07@gmail.com');
      assert.equal(response.user.roles[0]?.name, 'SUPER_ADMIN');

      const restoredUser = await getCurrentUser(response.accessToken);
      assert.equal(restoredUser.email, 'ayushgarg.official07@gmail.com');
      assert.equal(restoredUser.roles[0]?.name, 'SUPER_ADMIN');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
