import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card-bg rounded-2xl shadow-xl p-8 border border-black/5">
        <Link href="/" className="text-primary font-bold hover:underline mb-8 inline-block">
          ← Back to Game
        </Link>
        
        <h1 className="text-4xl font-black italic tracking-tighter text-primary mb-8">
          Terms<span className="text-foreground"> and Conditions</span>
        </h1>

        <div className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-4">1. Terms and conditions</h2>
            <div className="space-y-4 opacity-80">
              <p>
                By accessing <code className="bg-black/5 px-1 rounded">http://gartic.phone</code>, you agree to be bound by these terms of service, all applicable laws, and regulations and agree that you are responsible for compliance with them. If you disagree, you are prohibited from entering this website and playing Gartic.
              </p>
              <p>
                We reserve the right to change the Terms and Conditions and the Privacy Policy at any time. Your continued use of the website after changes to this policy will be considered your acceptance of these changes.
              </p>
              <p>
                The materials on this site are protected by applicable copyright and trademark. Anyone under 16 years of age must obtain their legal guardian&apos;s consent to use the website and the Gartic game.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. License to use</h2>
            <p className="mb-4 opacity-80">
              Permission is granted to temporarily transfer a copy of the materials on the Gartic website for personal and non-commercial transient viewing. This is the granting of a license, not a transfer of title, and under this license, you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 opacity-80">
              <li>Attempting to decompile or reverse engineer any software contained on the Gartic website;</li>
              <li>Remove any copyrights or other proprietary notices of the materials; or</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
            </ul>
            <p className="mt-4 opacity-80">
              This license must end automatically if you violate any of these restrictions. Upon termination, you must destroy all materials in your possession, whether in electronic or printed form.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Intellectual property rights</h2>
            <div className="space-y-4 opacity-80">
              <p>
                Gartic is the owner of all of the Services&apos; contents, including logos, icons, trademarks, graphics, text, images, software, and domains (the &quot;Intellectual Property Rights&quot;).
              </p>
              <p>
                When you create drawings (&quot;User Generated Content&quot;), you grant us a perpetual, royalty-free, worldwide, exclusive license to use, process, access, modify, display, market, and copy such content.
              </p>
              <p>
                You are not permitted to commercialize User Generated Content that contains the Gartic logo, which is owned by us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. Commercial use</h2>
            <p className="mb-4 opacity-80">
              You are allowed to broadcast the game on live-streaming platforms and create videos, provided you commit to the following:
            </p>
            <ul className="list-disc pl-6 space-y-2 opacity-80">
              <li>Videos shall be available to consumers free of charge;</li>
              <li>Maintain Gartic&apos;s name in the title and include the game link in the description;</li>
              <li>Not include illegal, violent, offensive, or improper content;</li>
              <li>Not mislead viewers into believing Gartic endorses your personal opinions;</li>
              <li>Not sell physical copies of the videos (e.g., DVDs).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Feedback</h2>
            <p className="opacity-80">
              If you send us ideas or feedback, you agree that we may freely use or reference them without any payment or other obligation to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">6. Limitations</h2>
            <p className="opacity-80">
              In no event will Gartic or its suppliers be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the materials on Gartic&apos;s website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}