// One-way NDA for the FAST Insights private preview.
//
// Port of Scout Quest's nda.html, re-papered for FAST Insights. Opened in a
// new tab from the signup form on /login — clicking the link there is what
// unlocks the "I agree" checkbox. Acceptance itself is recorded at signup in
// the append-only nda_acceptances table (see supabase/fastinsights_auth_setup.sql)
// with the person's legal name, email, this version number, and a server-side
// timestamp as the electronic signature.
//
// Bump NDA_VERSION in AuthPage.tsx if this text materially changes, so future
// acceptances are distinguishable from v1 ones.

export default function NDAPage() {
  return (
    <div className="fi-nda">
      <style>{NDA_CSS}</style>
      <div className="wrap">
        <a className="brand" href="https://fastinsights.io" aria-label="FAST Insights — home">
          <span className="mark">FI</span>
          <h1>
            FAST <em>Insights</em>
          </h1>
        </a>

        <a className="back" href="/login">
          ← Back to sign-up
        </a>

        <h2>One-Way Non-Disclosure Agreement</h2>
        <div className="co">FAST Insights</div>
        <div className="meta">Version v1 · Private preview · accepted electronically at sign-up</div>

        <p className="lead">
          This Non-Disclosure Agreement (the &ldquo;Agreement&rdquo;) is entered into as of the date
          you accept it below, by and between FAST Insights (&ldquo;Company&rdquo;), and you, the
          individual accepting it (&ldquo;Recipient&rdquo;). Company and Recipient are each a
          &ldquo;Party&rdquo; and together the &ldquo;Parties.&rdquo;
        </p>

        <p>
          <b>Purpose.</b> Recipient wishes to receive certain confidential information from Company
          in connection with evaluating a potential investment in, advisory relationship with, or
          product demonstration of Company&rsquo;s FAST Insights finance and accounting tools
          platform (the &ldquo;Purpose&rdquo;).
        </p>

        <h3>1. Confidential Information</h3>
        <p>
          &ldquo;Confidential Information&rdquo; means any non-public information disclosed by or on
          behalf of Company to Recipient, in any form, relating to the FAST Insights platform,
          including the software, source code, features, user experience, designs, product roadmap,
          calculation methodologies and workflows, business plans, financial information, metrics,
          pricing, customer and user data, and any information marked or identified as confidential
          or that a reasonable person would understand to be confidential given its nature or the
          circumstances of disclosure.
        </p>

        <h3>2. Obligations</h3>
        <p>
          Recipient shall: (a) hold all Confidential Information in strict confidence; (b) use it
          solely for the Purpose; (c) not copy, record, screenshot, screen-share, or otherwise
          reproduce any part of the platform or Confidential Information without Company&rsquo;s
          prior written consent; (d) not disclose it to any third party without Company&rsquo;s
          prior written consent; and (e) protect it using at least the same degree of care Recipient
          uses for its own confidential information, and no less than reasonable care.
        </p>

        <h3>3. Exclusions</h3>
        <p>
          Confidential Information does not include information that: (a) is or becomes publicly
          available through no breach by Recipient; (b) was rightfully known to Recipient before
          disclosure; (c) is rightfully received from a third party without a duty of
          confidentiality; or (d) is independently developed by Recipient without use of or
          reference to the Confidential Information.
        </p>

        <h3>4. Compelled Disclosure</h3>
        <p>
          If the Recipient is required by law or court order to disclose Confidential Information,
          the Recipient may do so only to the extent required, and shall, where legally permitted,
          give the Company prompt prior notice so the Company may seek a protective order.
        </p>

        <h3>5. No License or Ownership</h3>
        <p>
          All Confidential Information and all intellectual property rights in the FAST Insights
          platform remain the sole property of Company. Nothing in this Agreement grants Recipient
          any license or ownership right, by implication or otherwise.
        </p>

        <h3>6. No Obligation</h3>
        <p>
          Nothing in this Agreement obligates either Party to enter into any investment, advisory,
          business, or other transaction. Each Party may terminate discussions at any time.
        </p>

        <h3>7. No Warranty</h3>
        <p>
          All Confidential Information is provided &ldquo;AS IS&rdquo; for evaluation. The Company
          makes no warranties, express or implied, regarding its accuracy, completeness, or fitness
          for any purpose.
        </p>

        <h3>8. Term and Survival</h3>
        <p>
          This Agreement begins on the date above and continues while Confidential Information is
          disclosed. Recipient&rsquo;s confidentiality obligations survive for two (2) years after
          the last disclosure, except that Confidential Information constituting a trade secret
          remains protected for as long as it qualifies as a trade secret under applicable law.
        </p>

        <h3>9. Return or Destruction</h3>
        <p>
          Upon the Company&rsquo;s written request, the Recipient shall promptly return or destroy
          all Confidential Information in its possession and, if requested, certify such destruction
          in writing.
        </p>

        <h3>10. Remedies</h3>
        <p>
          Recipient acknowledges that unauthorized use or disclosure may cause irreparable harm for
          which monetary damages are inadequate. The Company is therefore entitled to seek
          injunctive relief, in addition to any other remedies available at law or in equity,
          without the requirement of posting a bond.
        </p>

        <h3>11. General</h3>
        <p>
          This Agreement is governed by the laws of the State of California, without regard to its
          conflict-of-laws rules. It constitutes the entire agreement between the Parties regarding
          its subject matter and supersedes all prior discussions. It may be amended only in writing
          signed by both Parties. If any provision is held unenforceable, the remaining provisions
          remain in effect. This Agreement may be signed in counterparts, including electronically.
        </p>

        <div className="accept">
          <h3>Electronic acceptance</h3>
          <p style={{ marginBottom: 0 }}>
            This Agreement is accepted electronically. By checking &ldquo;I have read and agree to
            the Non-Disclosure Agreement,&rdquo; confirming that the name you entered is your legal
            name, and creating your account, you sign this Agreement as the Recipient. Your first
            and last name, email address, this version number, and the date and time of acceptance
            are recorded as your electronic signature, which the Parties agree has the same legal
            effect as a handwritten signature and may be signed in counterparts.
          </p>
          <div className="sig">
            <b>Company:</b> FAST Insights
          </div>
        </div>

        <div className="foot">
          © 2026 FAST Insights. Questions:{' '}
          <a href="mailto:info@fastinsights.io">info@fastinsights.io</a>.
        </div>
      </div>
    </div>
  );
}

const NDA_CSS = `
.fi-nda{ min-height:100vh; color:var(--text-secondary); font-size:15px; line-height:1.62; padding:32px 20px 64px; }
.fi-nda .wrap{ max-width:760px; margin:0 auto; }
.fi-nda .brand{ display:flex; align-items:center; gap:11px; margin-bottom:20px; text-decoration:none; color:inherit; transition:opacity .15s ease; }
.fi-nda .brand:hover{ opacity:.85; }
.fi-nda .brand .mark{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:var(--accent-contrast); font-family:var(--font-mono); font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; flex:none; }
.fi-nda .brand h1{ font-size:19px; font-weight:600; color:var(--text-primary); margin:0; }
.fi-nda .brand h1 em{ font-style:italic; color:var(--accent); }
.fi-nda .back{ display:inline-block; margin-bottom:20px; color:var(--accent); text-decoration:none; font-size:13px; }
.fi-nda h2{ font-weight:600; color:var(--text-primary); font-size:26px; margin:0 0 2px; line-height:1.15; }
.fi-nda .co{ color:var(--accent); font-size:17px; font-weight:600; margin-bottom:6px; }
.fi-nda .meta{ color:var(--text-muted); font-size:12.5px; font-family:var(--font-mono); margin-bottom:24px; }
.fi-nda h3{ font-weight:700; color:var(--text-primary); font-size:15px; margin:22px 0 6px; }
.fi-nda p{ margin:0 0 12px; }
.fi-nda .lead{ margin-bottom:16px; }
.fi-nda a{ color:var(--accent); }
.fi-nda .accept{ margin-top:26px; padding:16px 18px; background:var(--accent-soft); border:1px solid var(--accent); border-radius:12px; }
.fi-nda .accept h3{ margin-top:0; color:var(--accent); }
.fi-nda .sig{ margin-top:14px; color:var(--text-tertiary); font-size:13.5px; }
.fi-nda .sig b{ color:var(--text-secondary); }
.fi-nda .foot{ margin-top:34px; padding-top:16px; border-top:1px solid var(--border); color:var(--text-muted); font-size:12.5px; }
`;
