'use client'
import { motion } from 'framer-motion'
import { Briefcase, Key, Users, Building, Shield, Landmark, Map, Zap, CheckCircle, TrendingUp, AlertTriangle, ChevronRight, Lock } from 'lucide-react'

export default function BusinessModelPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  }

  const streams = [
    {
      phase: '01',
      title: 'B2B API Licensing',
      who: 'Cab Aggregators, Transport Vendors',
      example: 'CityCabs pays ₹1–2/API call or ₹50,000/month flat',
      why: 'Liability reduction + safety as a marketing differentiator.',
      icon: <Key size={24} className="text-primary" />,
      color: 'border-primary/40',
      bgType: 'bg-primary/10'
    },
    {
      phase: '02',
      title: 'B2B2C Corporate Subscriptions',
      who: 'BPOs, IT Parks, Hospitals',
      example: '500 employees × ₹80/month = ₹40,000/month',
      why: 'POSH Act / duty-of-care compliance, cheaper than dedicated corporate cabs.',
      icon: <Building size={24} className="text-[#3b82f6]" />,
      color: 'border-[#3b82f6]/40',
      bgType: 'bg-[#3b82f6]/10'
    },
    {
      phase: '03',
      title: 'CSR Partnerships',
      who: 'Large Corporations (CSR Budgets)',
      example: 'GlowCo pays ₹15 lakh/year for city-wide free public access',
      why: 'Legal 2% net-profit CSR obligation (Companies Act) needs an impactful home.',
      icon: <Users size={24} className="text-accent" />,
      color: 'border-accent/40',
      bgType: 'bg-accent/10'
    },
    {
      phase: '04',
      title: 'Freemium Consumer Tier',
      who: 'Individual Users',
      example: '₹49–99/month for "Walk-With-Me" / Stealth Mode features',
      why: 'Low-friction, guilt-free spend for extreme reassurance (Secondary revenue).',
      icon: <Lock size={24} className="text-warning" />,
      color: 'border-warning/40',
      bgType: 'bg-warning/10'
    },
    {
      phase: '05',
      title: 'B2G Dashboard Subscriptions',
      who: 'Police, Smart City Municipalities',
      example: '₹8–15 lakh/year per district pilot',
      why: 'Data-driven policing is a priority (e.g., UP Dial 100). Needs reference clients first.',
      icon: <Landmark size={24} className="text-safe" />,
      color: 'border-safe/40',
      bgType: 'bg-safe/10'
    }
  ]

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-sm mb-6 uppercase tracking-wider shadow-[0_0_15px_rgba(236,72,153,0.3)]">
          <Briefcase size={16} /> Monetization Strategy
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight" style={{ color: 'var(--text)' }}>
          The Business of <span style={{ color: 'var(--primary)', textShadow: '0 0 20px rgba(236,72,153,0.4)' }}>Safety</span>
        </h1>
        <p className="text-xl text-text-secondary max-w-3xl mx-auto font-medium leading-relaxed">
          The woman using AuroraSafe rarely pays directly. Instead, <strong className="text-text">whoever is already responsible for her safety pays</strong> — her employer, a cab platform, a CSR budget, or eventually the city.
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Core Principle Card */}
        <motion.div variants={itemVariants} className="glass-card p-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 opacity-50 z-0" />
          <div className="relative z-10 bg-[var(--card)] m-1 rounded-2xl p-8 md:p-10 border border-[var(--border)] shadow-xl">
            <div className="flex items-start md:items-center gap-6 flex-col md:flex-row">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-[var(--border)] flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                <Shield size={32} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-[var(--heading-font)] mb-3 flex items-center gap-2">
                  The Core Principle
                </h2>
                <p className="text-text-secondary text-lg leading-relaxed">
                  We don't charge the scared user directly — free, trusted government alternatives like <code className="text-xs px-2 py-1 bg-surface border border-[var(--border)] rounded mx-1">112</code> and <code className="text-xs px-2 py-1 bg-surface border border-[var(--border)] rounded mx-1">Himmat</code> already exist. 
                  Our revenue is generated by shifting the financial burden to institutional stakeholders who use our <strong>predictive intelligence API</strong> to reduce their own liabilities.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 5 Revenue Streams */}
        <div>
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-primary" />
            <h2 className="text-2xl font-bold">Execution Pipeline: The 5 Revenue Streams</h2>
            <div className="h-px bg-border flex-1 ml-4" />
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="glass-card relative overflow-hidden transition-all hover:scale-[1.02] hover:-translate-y-1 duration-300 group"
                style={{
                  borderTop: `4px solid ${stream.color.split('-')[1].split('/')[0]}`, 
                  borderColor: `var(--${stream.color.split('-')[1].split('/')[0].replace('[','').replace(']','')})`
                }}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${stream.bgType} blur-3xl opacity-50 block`} />
                <div className="p-6 relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-surface border border-[var(--border)] rounded-xl shadow-md">
                      {stream.icon}
                    </div>
                    <span className="text-4xl font-extrabold text-border/40 font-mono tracking-tighter mix-blend-plus-lighter">{stream.phase}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{stream.title}</h3>
                  <div className="text-xs font-bold uppercase tracking-wider text-text-3 mb-4 flex items-center gap-1.5">
                    <Building size={12} /> {stream.who}
                  </div>
                  
                  <div className="space-y-4 mt-auto">
                    <div className="p-3 bg-surface/50 border border-[var(--border)] rounded-lg">
                      <div className="text-xs text-text-3 font-semibold mb-1 uppercase tracking-wide">Example Transaction</div>
                      <div className="text-sm font-medium text-text">{stream.example}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-text-3 font-semibold mb-1 flex items-center gap-1">
                        <CheckCircle size={12} className="text-safe" /> Why they pay
                      </div>
                      <div className="text-sm text-text-secondary leading-snug">
                        {stream.why}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center text-sm font-medium text-text-3 gap-3 opacity-70">
            <span>Fastest closing & highly defensible</span>
            <ChevronRight size={16} />
            <ChevronRight size={16} className="-ml-4 opacity-50" />
            <ChevronRight size={16} className="-ml-4 opacity-25" />
            <span>Slower sales cycle (B2G requires reference customers)</span>
          </div>
        </div>

        {/* The Defensibility Moat (Honest Risk) */}
        <motion.div variants={itemVariants} className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-danger/10 via-warning/10 to-transparent rounded-2xl blur-xl -z-10" />
          <div className="glass-card p-8 md:p-10 border border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 pointer-events-none">
              <Zap size={200} />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-danger/10 rounded-lg text-danger">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-2xl font-bold">The Honest Risk & The Defensive Moat</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-text-3 uppercase tracking-wider mb-2">The Obvious Threat</h3>
                <p className="text-text-secondary leading-relaxed p-4 bg-surface/50 border border-[var(--border)] rounded-xl">
                  Free government apps are heavily funded and trusted. If our only feature is an "SOS Button", we will fail against state-sponsored alternatives. No one pays just for a panic button.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-px bg-border hidden md:block" />
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">The Defensive Moat</h3>
                <p className="text-text leading-relaxed p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-[inset_0_0_20px_rgba(236,72,153,0.05)]">
                  Our moat isn't reactive dispatch. It is <strong className="text-primary">Predictive Avoidance</strong>. We don't just react; we predict, re-route, and escalate dynamically using live ML models for micro-regions that legacy apps are too slow to map. Combined with our physical phone-snatch/impact failsafe, it's an intelligence capability the state doesn't have yet.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
