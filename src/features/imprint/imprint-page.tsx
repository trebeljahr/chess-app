import { Link } from "react-router-dom";

export function ImprintPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="mb-6">
        <Link to="/" className="text-sm text-teal-700 hover:underline">
          &larr; Back to Chess
        </Link>
      </p>

      <h2 className="mb-6 text-3xl font-semibold">Legal Notice</h2>

      <p className="mb-6 text-sm text-slate-500">
        Information pursuant to § 5 DDG (German Digital Services Act) and
        § 18 (2) MStV (Interstate Media Treaty).
      </p>

      <section className="mb-6">
        <h3 className="mb-1 text-lg font-medium">Service Provider</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Rico Trebeljahr<br />
          c/o Block Services<br />
          Stuttgarter Str. 106<br />
          70736 Fellbach<br />
          Germany
        </p>
      </section>

      <section className="mb-6">
        <h3 className="mb-1 text-lg font-medium">Contact</h3>
        <p className="text-sm text-slate-600">
          Email:{" "}
          <a href="mailto:imprint+chess@trebeljahr.com" className="text-teal-700 hover:underline">
            imprint+chess@trebeljahr.com
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h3 className="mb-1 text-lg font-medium">
          Person Responsible for Content (§ 18 (2) MStV)
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Rico Trebeljahr<br />
          c/o Block Services<br />
          Stuttgarter Str. 106<br />
          70736 Fellbach<br />
          Germany
        </p>
      </section>

      <section className="mb-6">
        <h3 className="mb-1 text-lg font-medium">Liability for Content</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          As a service provider, I am responsible for my own content on
          these pages in accordance with § 7 (1) DDG and general laws.
          However, pursuant to §§ 8 to 10 DDG, I am not obligated as a
          service provider to monitor transmitted or stored third-party
          information or to investigate circumstances that indicate illegal
          activity.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="mb-1 text-lg font-medium">Liability for Links</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          This site contains links to external websites of third parties
          over whose content I have no influence. Therefore, I cannot
          assume any liability for these third-party contents.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg font-medium">Copyright</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          The content and works created by the site operator on these pages
          are subject to German copyright law.
        </p>
      </section>
    </main>
  );
}
