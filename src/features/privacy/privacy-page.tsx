import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// What the app stores and sends, in plain words. Keep it in step with the
// code: the "Error reports" section restates src/shared/error-scrub.ts,
// src/lib/error-reporting/scrub.ts and scrubServerEvent in
// src/server/instrument.ts. Change the date when the content changes.

const CONTACT = "imprint+chess@trebeljahr.com";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-teal-700 hover:underline">
      {CONTACT}
    </a>
  );
}

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="mb-6">
        <Link to="/" className="text-sm text-teal-700 hover:underline">
          &larr; Back to Chess
        </Link>
      </p>

      <h2 className="mb-2 text-3xl font-semibold">Privacy Policy</h2>
      <p className="mb-8 text-sm text-slate-500">Last updated: 19 October 2026</p>

      <Section title="1. Who is responsible for your data">
        <p>
          Rico Trebeljahr runs Online Chess at chess.trebeljahr.com and is the controller under the
          GDPR:
        </p>
        <p>
          Rico Trebeljahr
          <br />
          c/o Block Services
          <br />
          Stuttgarter Str. 106
          <br />
          70736 Fellbach
          <br />
          Germany
        </p>
        <p>
          For privacy questions, or to use your rights, email <Mail />.
        </p>
      </Section>

      <Section title="2. What the app stores">
        <p>
          The app asks for a username and a password. It never asks for your email address or your
          real name.
        </p>
        <List>
          <li>
            Account: your username, your password as a bcrypt hash, your rating, your number of
            games, wins, losses and draws, and the date you registered.
          </li>
          <li>
            Session: a cookie named <code>chess_app_session</code> that holds a random ID. It keeps
            you signed in for 30 days. Signing out deletes the session.
          </li>
          <li>
            Games: the game name, the usernames of the players, every move, the clocks, the chat
            messages, and when each player was last active in the game. Every signed-in player can
            open any game and read its chat.
          </li>
          <li>
            Browser storage: your board theme, whether sound is on, and the time you last came back
            from the donation page. These values stay in your browser. The app never sends them to
            the server.
          </li>
          <li>
            Sign-in attempts: the chess server counts sign-in and registration attempts per network
            connection to slow down password guessing. It keeps the count in memory for one minute.
          </li>
        </List>
      </Section>

      <Section title="3. Error reports">
        <p>
          When the app or the chess server hits an error it did not expect, it sends an error report
          to GlitchTip. GlitchTip is an error tracker that I run on my own server. With no error,
          nothing is sent.
        </p>
        <p>An error report contains:</p>
        <List>
          <li>the error message and the place in the code where the error happened</li>
          <li>
            the address of the page or request, with everything after the question mark removed
          </li>
          <li>the version of the app, and whether the error came from the browser or the server</li>
          <li>
            from the browser: the names of your browser and operating system, and the address,
            method and status of the last requests the app made
          </li>
          <li>from the server: the name of the server function that failed, never its input</li>
        </List>
        <p>An error report never contains:</p>
        <List>
          <li>your user ID, your username or an email address</li>
          <li>your cookies or any other header of your requests</li>
          <li>anything you typed, or the content of any request</li>
          <li>what the app wrote to the browser console</li>
          <li>a recording or a picture of your screen</li>
        </List>
        <p>
          The app replaces email addresses and access tokens inside an error message before the
          report leaves it. Your browser sends its error reports to the chess server, and the chess
          server passes them on to GlitchTip. So GlitchTip receives the IP address of the chess
          server, not yours.
        </p>
      </Section>

      <Section title="4. Usage statistics">
        <p>
          The app counts page views with Plausible Analytics. I run Plausible on my own server at
          plausible.trebeljahr.com. Plausible sets no cookies and builds no profile.
        </p>
        <p>
          It records the page address, the referring site, your browser, operating system, device
          type and country. It also counts clicks on links that leave the app. Plausible uses your
          IP address only to derive your country and an anonymous daily visitor count. It never
          stores your IP address.
        </p>
      </Section>

      <Section title="5. Who else receives data">
        <List>
          <li>
            Cloudflare, Inc. (San Francisco, USA) serves the web app and passes every request to the
            chess server. Cloudflare sees your IP address and each request.
          </li>
          <li>
            Hetzner Online GmbH (Nuremberg, Germany) hosts the servers I run: the chess server and
            its database, GlitchTip and Plausible.
          </li>
        </List>
        <p>
          No other company receives your data. The app shows no ads and sells no data. The donation
          link opens ricos.site, which is not part of this app.
        </p>
      </Section>

      <Section title="6. Legal basis">
        <List>
          <li>
            Contract (Art. 6(1)(b) GDPR): your account, your sessions and your games. Without them
            the app cannot work.
          </li>
          <li>
            Legitimate interest (Art. 6(1)(f) GDPR): the count of sign-in attempts, error reports,
            usage statistics and delivery through Cloudflare. They keep the app secure and working.
            You can object at any time.
          </li>
        </List>
      </Section>

      <Section title="7. How long data is kept">
        <List>
          <li>Your account and your games stay until you ask me to delete them.</li>
          <li>
            A session ends after 30 days or when you sign out. The server deletes ended sessions.
          </li>
          <li>The count of sign-in attempts ends after one minute.</li>
          <li>GlitchTip deletes error reports after 90 days.</li>
          <li>
            Plausible keeps only totals. It discards the daily visitor identifier after 24 hours.
          </li>
        </List>
      </Section>

      <Section title="8. Your rights">
        <p>Under the GDPR you have the right to:</p>
        <List>
          <li>get a copy of the data I hold about you</li>
          <li>have wrong data corrected</li>
          <li>have your data deleted</li>
          <li>limit how I process your data</li>
          <li>receive your data in a machine-readable format</li>
          <li>object to processing based on legitimate interest</li>
          <li>
            complain to a data protection authority. The authority responsible for me is Die
            Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg,
            Stahnsdorfer Damm 77, 14532 Kleinmachnow, Germany.
          </li>
        </List>
        <p>
          The app has no button to delete your account yet. Email <Mail /> with your username. I
          then delete your account, your sessions and the games you created, and I reply within 30
          days.
        </p>
      </Section>

      <Section title="9. Changes">
        <p>When this policy changes, I update the date at the top of this page.</p>
      </Section>
    </main>
  );
}
