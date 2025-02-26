"use client";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white mb-8">
            Terms and Conditions
          </h1>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                1. Capper Eligibility
              </h2>
              <p className="mb-4">
                To be eligible as a capper on our platform, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 21 years of age</li>
                <li>
                  Have a verifiable track record of sports betting success
                </li>
                <li>
                  Provide accurate and truthful information in your application
                </li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                2. Content Guidelines
              </h2>
              <p className="mb-4">As a capper, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide honest and accurate betting analysis</li>
                <li>Not guarantee or promise specific outcomes</li>
                <li>Maintain professional conduct in all interactions</li>
                <li>Not engage in harassment or discriminatory behavior</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                3. Performance Monitoring
              </h2>
              <p>
                We reserve the right to monitor capper performance and may
                terminate accounts that:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Consistently provide poor quality analysis</li>
                <li>Engage in deceptive practices</li>
                <li>Violate our community guidelines</li>
                <li>Fail to maintain minimum success rates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                4. Revenue Sharing
              </h2>
              <p>Cappers will receive compensation based on:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Subscription revenue from followers</li>
                <li>Performance-based bonuses</li>
                <li>Special promotions and incentives</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                5. Account Termination
              </h2>
              <p>
                We reserve the right to terminate capper accounts for violations
                of these terms, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Providing false information</li>
                <li>Engaging in fraudulent activities</li>
                <li>Violating community guidelines</li>
                <li>Failing to maintain professional standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                6. Disclaimer
              </h2>
              <p className="mb-4">Cappers acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Past performance does not guarantee future results</li>
                <li>All analysis and predictions are opinions only</li>
                <li>Users are responsible for their own betting decisions</li>
                <li>
                  Compliance with local gambling laws is user responsibility
                </li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-gray-700/30 rounded-lg">
              <p className="text-sm text-gray-400">
                By applying to become a capper, you acknowledge that you have
                read, understood, and agree to these terms and conditions. These
                terms may be updated periodically, and continued use of the
                platform constitutes acceptance of any changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
