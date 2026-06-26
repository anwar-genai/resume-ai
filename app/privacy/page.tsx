import GlassCard from "@/app/components/ui/GlassCard";

export const metadata = {
  title: "Privacy Policy — resume-ai",
};

// NOTE: This is a plain-language starting template, not legal advice. Review and
// adapt it (especially the contact details and your legal jurisdiction) before
// relying on it in production.
export default function PrivacyPage() {
  const updated = "June 2026";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <GlassCard className="p-8" hover={false}>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last updated: {updated}</p>

        <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">What we collect</h2>
            <p>
              Your email address and password (stored only as a salted bcrypt hash), and the content
              you create or upload — resumes, cover letters, Upwork proposals, and any job/project
              descriptions you paste. We also store usage counters and subscription/billing status.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">How we use it</h2>
            <p>
              To provide the service: authenticate you, generate and store your documents, enforce
              plan limits, and process subscription payments. We do not sell your data or use your
              documents to train our own models.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Third-party processors</h2>
            <p>We share data with these providers only as needed to run the service:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>OpenAI</strong> — receives the resume/job text you submit to generate documents.</li>
              <li><strong>Polar</strong> — our Merchant of Record; processes subscription payments.</li>
              <li><strong>Resend</strong> — sends transactional email (verification, password reset).</li>
              <li><strong>Upstash</strong> — rate-limiting counters (your IP address, transiently).</li>
              <li><strong>Our database host</strong> — stores your account and documents.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Your rights</h2>
            <p>
              You can <strong>export</strong> all of your data or <strong>permanently delete</strong>{" "}
              your account and documents at any time from{" "}
              <a className="underline hover:text-indigo-600" href="/settings">Account Settings</a>.
              Deletion is immediate and irreversible.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Data retention</h2>
            <p>
              We keep your data while your account is active. When you delete your account, your
              documents and personal data are removed from our database. Backups, if any, are rotated
              out on a rolling basis.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Security</h2>
            <p>
              Passwords are hashed with bcrypt; password-reset tokens are stored hashed. Access to
              your documents requires authentication. No system is perfectly secure, but we take
              reasonable measures to protect your data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Contact</h2>
            <p>
              Questions about your data or this policy? Contact us at{" "}
              <span className="font-medium">[your support email]</span>.
            </p>
          </section>
        </div>
      </GlassCard>
    </div>
  );
}
