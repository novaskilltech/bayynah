import { expect, test } from "@playwright/test";

type TelemetryBody = {
  eventType: string;
  resourceType: string;
  resourceId: string;
  pilotSessionId: string;
};

for (const locale of ["fr", "ar"] as const) {
  test(`pilot funnel smoke (${locale})`, async ({ page }) => {
    const events: TelemetryBody[] = [];
    const issuedSessionIds: string[] = [];

    await page.route(/\/api\/telemetry\/session$/, async (route) => {
      const response = await route.fetch();
      const payload = (await response.json()) as {
        session: { pilotSessionId: string; pilotSessionSignature: string; expiresAt: number };
      };
      expect(payload.session.pilotSessionId).toMatch(/^pilot_[0-9a-f]{32}$/);
      expect(payload.session.pilotSessionSignature).toMatch(/^[0-9a-f]{64}$/);
      expect(payload.session.expiresAt).toBeGreaterThan(Date.now());
      issuedSessionIds.push(payload.session.pilotSessionId);
      await route.fulfill({ response, json: payload });
    });

    await page.route(/\/api\/telemetry$/, async (route) => {
      events.push(route.request().postDataJSON() as TelemetryBody);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const eventCount = (eventType: string) =>
      events.filter((event) => event.eventType === eventType).length;

    await page.goto(`/${locale}/diagnostic`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect.poll(() => eventCount("DIAGNOSTIC_STARTED")).toBe(1);

    for (let question = 0; question < 14; question += 1) {
      await page.locator('[data-testid^="diagnostic-option-"]').first().click();
      await page.getByTestId("diagnostic-next").click();
    }
    await expect.poll(() => eventCount("DIAGNOSTIC_COMPLETED")).toBe(1);

    await page.goto(`/${locale}/ecoles/critique/critique-01-affirmation-vs-preuve`);
    await expect.poll(() => eventCount("LESSON_OPENED")).toBe(1);
    await page.getByTestId("lesson-quiz-0-option-1").click();
    await expect.poll(() => eventCount("LESSON_COMPLETED")).toBe(1);

    await page.goto(`/${locale}/laboratoire/ablutions-viande-chameau`);
    await expect.poll(() => eventCount("INQUIRY_STARTED")).toBe(1);
    for (let step = 0; step < 10; step += 1) {
      await page.getByTestId("inquiry-option-0").click();
      await expect.poll(() => eventCount("INQUIRY_STEP_ANSWERED")).toBe(step + 1);
      await page.getByTestId("inquiry-next").click();
    }
    await expect.poll(() => eventCount("INQUIRY_COMPLETED")).toBe(1);

    await page.goto(`/${locale}/lexique#dalala`);
    await expect(page.locator("#dalala")).toBeVisible();
    await expect.poll(() => eventCount("GLOSSARY_OPENED")).toBe(1);

    const optOutLabel =
      locale === "ar" ? "تعطيل القياس البيداغوجي" : "Désactiver la télémétrie pédagogique";
    const optOut = page.getByLabel(optOutLabel);
    await optOut.check();
    const eventsBeforeOptOutNavigation = events.length;
    const sessionsBeforeOptOutNavigation = issuedSessionIds.length;

    await page.goto(`/${locale}/ecoles/critique/critique-01-affirmation-vs-preuve?optout=1`);
    await page.waitForTimeout(300);
    expect(events).toHaveLength(eventsBeforeOptOutNavigation);
    expect(issuedSessionIds).toHaveLength(sessionsBeforeOptOutNavigation);

    await page.getByLabel(optOutLabel).uncheck();
    await page.goto(`/${locale}/diagnostic?optin=1`);
    await expect.poll(() => issuedSessionIds.length).toBe(sessionsBeforeOptOutNavigation + 1);
    await expect.poll(() => eventCount("DIAGNOSTIC_STARTED")).toBe(2);
    expect(issuedSessionIds.at(-1)).not.toBe(issuedSessionIds[0]);
    expect(events.at(-1)?.pilotSessionId).toBe(issuedSessionIds.at(-1));
  });
}
