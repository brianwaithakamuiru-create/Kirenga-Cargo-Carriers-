import React from 'react';
import {
  Truck,
  Globe2,
  Container,
  PackageSearch,
  Warehouse,
  Radio,
  BarChart3,
  FileCheck2,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAnimations } from '../../context/AnimationContext';

interface ServicesSectionProps {
  onNavigate: (view: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigate }) => {
  const { scrollAnimationsEnabled, reducedMotion } = useAnimations();

  // The exact 8 services requested by the specification
  const services = [
    {
      id: 'cargo-transportation',
      title: 'Cargo Transportation',
      icon: Truck,
      color: 'from-blue-600 to-cyan-500',
      tag: 'Core Fleet Haulage',
      desc: 'High-capacity heavy freight transportation with dedicated multi-axle trucks, drop-deck lowbeds, and refrigerated haulage units operating across domestic and regional trunk roads.',
      features: ['Up to 60-Ton Gross Capacity', 'Pre-Trip Road Safety Audits', 'Driver Craftsmanship & Telemetry'],
      action: 'book',
      badge: 'HIGH DEMAND',
    },
    {
      id: 'cross-border-transport',
      title: 'Cross-Border Transport',
      icon: Globe2,
      color: 'from-cyan-600 to-teal-500',
      tag: 'Northern & Central Corridors',
      desc: 'Seamless international cargo movement between Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, and DR Congo under COMESA cross-border customs bond frameworks.',
      features: ['Single-Window Customs Clearing', 'Expedited Border Passage', 'Multi-Country Transit Permits'],
      action: 'book',
      badge: 'REGIONAL',
    },
    {
      id: 'container-transportation',
      title: 'Container Transportation',
      icon: Container,
      color: 'from-blue-500 to-indigo-600',
      tag: 'Mombasa & Dar Port Corridors',
      desc: 'Port haulage and intermodal transport for 20ft and 40ft standard, high-cube, open-top, and reefer containers direct from ocean ports to inland container depots (ICDs) and manufacturing yards.',
      features: ['Port Direct Dispatch', 'Twist-Lock Safety Chassis', 'Demurrage Minimization'],
      action: 'quote',
    },
    {
      id: 'freight-services',
      title: 'Freight Services',
      icon: PackageSearch,
      color: 'from-indigo-600 to-cyan-600',
      tag: 'FCL & Consolidated LCL',
      desc: 'Comprehensive dry-bulk, palletized goods, industrial equipment, civil project cargo, and agricultural commodity logistics with guaranteed transit scheduling.',
      features: ['Full & Partial Truckloads', 'Rigid Cargo Securing', 'Commercial Tariff Optimization'],
      action: 'quote',
    },
    {
      id: 'warehousing',
      title: 'Warehousing',
      icon: Warehouse,
      color: 'from-teal-500 to-blue-600',
      tag: 'Bonded & Dry Storage',
      desc: 'Strategically located transit warehouses across East African logistics hubs featuring 24/7 CCTV surveillance, climate-controlled bays, forklift handling, and inventory ledger controls.',
      features: ['Cross-Docking Facilities', 'Pallet Racking & Forklifts', 'Secure Bonded Quarantine'],
      action: 'quote',
    },
    {
      id: 'cargo-tracking',
      title: 'Cargo Tracking',
      icon: Radio,
      color: 'from-cyan-500 to-blue-500',
      tag: 'Satellite Telematics',
      desc: 'Real-time GPS telematics, tamper-evident electronic seals, continuous speed and geofence monitoring, and transparent client waybill corridor milestone tracking.',
      features: ['Electronic Cargo Seal Monitoring', 'Live Route Corridor Updates', 'Instant Waybill Status'],
      action: 'track',
      badge: 'LIVE 24/7',
    },
    {
      id: 'logistics-management',
      title: 'Logistics Management',
      icon: BarChart3,
      color: 'from-blue-600 to-cyan-400',
      tag: 'Enterprise Supply Chain',
      desc: 'Integrated end-to-end supply chain planning, route optimization, carrier coordination, return-haul load matching, and consolidated billing for enterprise shippers.',
      features: ['Key Account Dispatch Desk', 'KPI & Delivery Compliance SLA', 'Digital POD Archival'],
      action: 'contact',
    },
    {
      id: 'customs-checkpoint',
      title: 'Customs/Checkpoint Coordination',
      icon: FileCheck2,
      color: 'from-emerald-500 to-cyan-500',
      tag: 'Regulatory Compliance',
      desc: 'Complete border checkpoint clearance, COMESA transit customs declarations, axle-load compliance checks, and regulatory documentation processing without transit delays.',
      features: ['Single Customs Territory (SCT)', 'Axle Weight Optimization', 'Zero Border Dwell Protocol'],
      action: 'contact',
    },
  ];

  const shouldAnimate = scrollAnimationsEnabled && !reducedMotion;

  return (
    <section id="services" className="py-20 md:py-28 bg-[#060B18] text-[#F8FAFC] relative overflow-hidden border-t border-slate-800">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Integrated Freight & Supply Chain Solutions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
            Specialized Logistics <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Services</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-light font-['Poppins']">
            Engineered for speed, cargo integrity, and compliance across East Africa's most demanding transit corridors.
          </p>
        </div>

        {/* 8 Animated Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className={`group relative p-6 rounded-2xl bg-[#0A1024]/80 border border-slate-800 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-950/40 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1.5 backdrop-blur-md ${
                  shouldAnimate ? 'animate-fadeIn' : ''
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Subtle top edge glow on hover */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-400 transition-all duration-500 rounded-t-2xl" />

                {/* Badge if present */}
                {service.badge && (
                  <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                    {service.badge}
                  </div>
                )}

                <div>
                  {/* Animated Icon with gradient container and hover glow */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} p-0.5 mb-5 shadow-lg group-hover:scale-105 group-hover:shadow-cyan-500/30 transition-all duration-300`}
                  >
                    <div className="w-full h-full bg-[#0A1024] rounded-[10px] flex items-center justify-center text-cyan-300 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6 transform group-hover:rotate-6 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className="text-[10px] font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                    {service.tag}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white font-['Montserrat'] mb-2.5 group-hover:text-cyan-300 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-light mb-4 line-clamp-3">
                    {service.desc}
                  </p>

                  {/* Bullet features */}
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3 mb-5">
                    {service.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Link */}
                <button
                  onClick={() => onNavigate(service.action)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold flex items-center justify-between transition-all group/btn"
                >
                  <span>Select Capability</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
