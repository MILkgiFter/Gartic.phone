import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card-bg rounded-2xl shadow-xl p-8 border border-black/5">
        <Link href="/" className="text-primary font-bold hover:underline mb-8 inline-block">
          ← Back to Game
        </Link>
        
        <h1 className="text-4xl font-black italic tracking-tighter text-primary mb-8">
          Privacy<span className="text-foreground"> Policy</span>
        </h1>

        <div className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base leading-relaxed">
          <p>
            The purpose of Gartic.phone policy is to respect your privacy concerning any information we may collect while you are playing. Consequently, we have developed this Privacy Policy to ensure that you know how we handle the data.
          </p>
          
          <p>
            In this Privacy Policy, &quot;data&quot; means any data that may identify you (alone or in combination with other data), such as your name, profile image, and data for analysis and attribution to the use of the services.
          </p>

          <section>
            <h2 className="text-xl font-bold mb-4">1. What data we are Processing</h2>
            <p className="mb-4">
              We collect data through a third-party account. If you do not authorize such data collection, please do not log in with a social network.
              Data we may collect when you use our service anonymously or when you are linked to a third party log-in:
            </p>
            <ul className="list-disc pl-6 space-y-2 opacity-80">
              <li>Data about your location, device type, operating system and platform, page load time, network, unique browser id, social network unique id, demographics, a chosen nickname, room number you have played, the reference origin, and the IP address.</li>
              <li>Profile picture link;</li>
              <li>How many times you visit the game;</li>
              <li>The amount of time you spend on the game;</li>
              <li>Text and words interactions in-game;</li>
              <li>Drawings;</li>
              <li>Custom themes.</li>
            </ul>
            <p className="mt-4 italic">
              When a user creates a theme and chooses to use it in a public room, the theme&apos;s author is shown to everyone who joins that room.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. The purpose of data collection</h2>
            <ul className="list-disc pl-6 space-y-2 opacity-80">
              <li>To improve our Services;</li>
              <li>To ensure you comply with our terms;</li>
              <li>To enhance the Services for analysis and reporting purposes and to provide technical support or answer your questions, including the data used to record any failures in our provision of the Services. Therefore, we can report such interruptions;</li>
              <li>To provide contextual advertisements that are of interest to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Legal bases</h2>
            <p className="mb-4">We consider the following legal bases for data processing:</p>
            <ul className="list-disc pl-6 space-y-2 opacity-80">
              <li>When the use of your data is required to execute our obligations under a contract with you. (e.g., to comply with our Service Terms);</li>
              <li>When the use of your data is necessary for our legitimate interests or the legitimate interests of others;</li>
              <li>When the use of your information is needed to comply with legal obligations or exercise rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. How we process data</h2>
            <p className="mb-4">
              The data we collect from you may be transferred and stored outside the United Kingdom or the European Economic Area (EEA), such as the USA. This transfer is required to host the Services, provide other supporting services, and allow you to use our Services deliberately.
            </p>
            <p className="mb-4">
              We use third parties to help us manage your information and services, customer service providers to host the game and database, and marketing companies to manage the advertising that appears to you.
              We may share non-personal information with third parties, such as aggregate user statistics, demographic data, and Usage Information.
            </p>
            <div className="bg-black/5 p-4 rounded-xl space-y-2">
              <p className="font-bold mb-2">Third-party processors:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <span>• Google Analytics</span>
                <span>• Cloud Flare</span>
                <span>• Linode</span>
                <span>• Adinplay</span>
                <span>• Firebase by Google</span>
                <span>• AdMob</span>
                <span>• Applovin</span>
                <span>• Chocolate Platform</span>
                <span>• Equativ</span>
                <span>• Index Exchange</span>
                <span>• InMobi</span>
                <span>• Liftoff</span>
                <span>• Mobfox</span>
                <span>• Pangle</span>
                <span>• Magnite</span>
                <span>• MediaNET</span>
                <span>• Openx</span>
                <span>• Smaato</span>
                <span>• Fluct</span>
                <span>• Triplelift</span>
                <span>• Digital Ocean</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Data for Advertising</h2>
            <p>
              We use third-party advertising companies to serve advertisements and provide collected data to help implement ads when you visit or use our Services. We also use analytical web tools such as Google Analytics and Firebase to interpret your use of our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">6. Personalized Advertising</h2>
            <p>
              You may be able to opt out of receiving personalized advertisements from other companies that are members of the Network Advertising Initiative or that are subscribed to the Digital Advertising Alliance&apos;s Self-Regulatory Principles for Online Behavioral Advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">7. Use of Cookies</h2>
            <p className="mb-4">
              We may use &quot;cookies&quot; to improve the user experience. Your web browser is responsible for controlling and sharing your information through cookies.
            </p>
            <p>
              Do Not Track (&quot;DNT&quot;) is a privacy preference that users can set in specific web browsers. Please note that we do not respond to or honor DNT signals or similar mechanisms transmitted by web browsers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">8. Storage</h2>
            <p>
              We will keep the data as long as it is relevant and valuable for its originally collected purpose and, otherwise, when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">9. Data protection</h2>
            <p>
              We are committed to the safety of your information. Measures we take include cryptography on server communication, highly safe server access architecture, and internal restriction policies.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}