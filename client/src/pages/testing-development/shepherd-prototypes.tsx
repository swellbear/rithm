import starterTierSvg from "../assets/shepherd-starter-tier.svg";
import businessTierSvg from "../assets/shepherd-business-tier.svg";
import professionalTierSvg from "../assets/shepherd-professional-tier.svg";
import advancedTierSvg from "../assets/shepherd-advanced-tier.svg";
import enterpriseTierSvg from "../assets/shepherd-enterprise-tier.svg";

export default function ShepHerdPrototypes() {
  const prototypes = [
    {
      tier: "Starter",
      price: "$695",
      capacity: "10-50 Animals",
      size: "4ft x 6ft",
      image: starterTierSvg,
      features: [
        "100-gallon water tank",
        "400W solar system",
        "Basic GPS movement",
        "Simple feed dispenser"
      ]
    },
    {
      tier: "Business", 
      price: "$1,485",
      capacity: "50-150 Animals",
      size: "6ft x 8ft",
      image: businessTierSvg,
      features: [
        "Dual 200-gallon tanks",
        "800W solar system", 
        "Enhanced feed system",
        "Basic shade structure"
      ]
    },
    {
      tier: "Professional",
      price: "$2,850", 
      capacity: "150-300 Animals",
      size: "8ft x 12ft",
      image: professionalTierSvg,
      features: [
        "Triple 500-gallon tanks",
        "1200W solar array",
        "AI control system",
        "Predator protection"
      ]
    },
    {
      tier: "Advanced",
      price: "$4,495",
      capacity: "300-750 Animals", 
      size: "10ft x 14ft",
      image: advancedTierSvg,
      features: [
        "Quad 750-gallon tanks",
        "1600W solar array",
        "Central AI tower",
        "Weather station & shelter"
      ]
    },
    {
      tier: "Enterprise",
      price: "$7,995",
      capacity: "750+ Animals",
      size: "12ft x 16ft", 
      image: enterpriseTierSvg,
      features: [
        "Five 1000+ gallon tanks",
        "2000W+ solar array",
        "Command center",
        "Industrial systems"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ShepHerd™ Platform Prototypes
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionary autonomous livestock management platforms designed for attraction-based grazing. 
            Five tiers engineered to scale from small hobby farms to large commercial enterprises.
          </p>
        </div>

        <div className="grid gap-8 lg:gap-12">
          {prototypes.map((prototype, index) => (
            <div 
              key={prototype.tier}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Image */}
                  <div className="flex-1 flex justify-center">
                    <img 
                      src={prototype.image} 
                      alt={`${prototype.tier} Tier Platform`}
                      className="max-w-full h-auto"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="mb-4">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {prototype.tier} Tier
                      </h2>
                      <p className="text-4xl font-bold text-green-600 mb-2">
                        {prototype.price}
                      </p>
                      <p className="text-lg text-gray-600 mb-1">
                        {prototype.capacity}
                      </p>
                      <p className="text-lg text-gray-600">
                        {prototype.size} Platform
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Key Features:
                      </h3>
                      {prototype.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-center lg:justify-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            SmartWeigh Pro™ Ear Tag Integration
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Platform-Only Capability
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 3-acre minimum grazing area</li>
                <li>• 95% livestock retention through attraction</li>
                <li>• Natural animal behavior patterns</li>
                <li>• Zero physical infrastructure required</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                With Ear Tag Precision
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 0.25-acre precision grazing strips</li>
                <li>• 99.8% livestock retention rate</li>
                <li>• Continuous health monitoring</li>
                <li>• GPS virtual boundary system</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Prototype visualizations showing relative scale and feature progression across all five platform tiers.
            All specifications subject to final engineering optimization.
          </p>
        </div>
      </div>
    </div>
  );
}