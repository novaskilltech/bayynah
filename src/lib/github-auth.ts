/**
 * Authentification GitHub (GitHub App / Token)
 * TABAYYUN — Gouvernance Scientifique
 */

import crypto from "crypto";

export async function getGitHubAuthHeader(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (appId && privateKey && installationId) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 600,
      iss: appId,
    };

    const formattedKey = privateKey.replace(/\\n/g, "\n");
    const header = { alg: "RS256", typ: "JWT" };
    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signInput = `${b64Header}.${b64Payload}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signInput);
    const signature = signer.sign(formattedKey, "base64url");
    const jwt = `${signInput}.${signature}`;

    const tokenRes = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!tokenRes.ok) {
      throw new Error(`Échec génération token GitHub App : ${tokenRes.status} ${tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();
    return `Bearer ${tokenData.token}`;
  }

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    return `Bearer ${token}`;
  }

  return "";
}
