import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out Lindle",
      features: [
        "2 contract reviews every month",
        "Basic clause summary",
        "Red flag detection",
        "Basic puschbacks",
        "Downloadable Lindle-branded PDF reports",
        "Dashboard access",
        "Community support"
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-gray-600 hover:bg-gray-700",
      popular: false
    },
    {
      name: "Companion",
      price: "$29",
      period: "/month",
      yearlyPrice: "$290/year",
      description: "Essential contract tools for growing professionals",
      features: [
        "Everything in Free",
        "Unlimited contract reviews and storage",
        "Advanced clause analysis and extraction",
        "Smart pushback suggestions",
        "AI live contract assistant",
        "Personal clause vault",
        "Reputation tracker",
        "Smart reminders and deadlines",
        "AI memory of past contracts",
        "White-label PDF reports",
        "Export with annotations",
        "Enhanced risk analysis",
        "Priority email support"
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "bg-blue-600 hover:bg-blue-700",
      popular: true
    },
    {
      name: "Teams",
      price: "$89",
      period: "/month (up to 3 users)",
      description: "Complete contract workflow for growing agencies & startups",
      features: [
        "Everything in Companion",
        "Version tracking & comparison",
        "Shared clause presets",
        "Team access",
        "Multi seat admin controls",
        "Advanced collaboration tools",
        "Dedicated support"
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "bg-blue-600 hover:bg-blue-700",
      popular: false
    }
  ];

  return (
    <div className="bg-white font-sans min-h-screen flex flex-col">
      {/* Navigation */}
      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 flex-grow">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Choose the perfect plan for your contract review needs. Start with our free plan and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-lg shadow-lg p-6 ${
                plan.popular 
                  ? 'border-2 border-blue-600 transform scale-105' 
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 text-gray-800">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                  {plan.yearlyPrice && (
                    <div className="text-sm text-gray-600 mt-1">or {plan.yearlyPrice}</div>
                  )}
                </div>
                <p className="text-gray-700 text-sm mb-6">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-700 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2 text-gray-800">What&apos;s included in the free plan?</h3>
              <p className="text-gray-700 text-sm">
                You get 2 complete contract reviews every 6 months, including clause summaries and red flag detection.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-800">Can I switch plans anytime?</h3>
              <p className="text-gray-700 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-800">What types of contracts can I analyze?</h3>
              <p className="text-gray-700 text-sm">
                All plans support freelance contracts, NDAs, service agreements, and most business contracts.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-800">Is my data secure?</h3>
              <p className="text-gray-700 text-sm">
                Absolutely. We use enterprise-grade encryption and never share your contract data with third parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 mt-auto">
        <p className="text-sm text-gray-600">
          © 2025 Lindle. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 
