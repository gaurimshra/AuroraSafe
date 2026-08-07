'use client'
import { motion } from 'framer-motion'
import { Shield, MapPin, Phone, MessageCircle, Navigation, Info } from 'lucide-react'

const ngos = [
  {
    name: "Hamari Pahchan NGO",
    email: ["pachhanhamari@gmail.com", "info@hamaripahchan.com"],
    phones: ["+919911173557", "+918882590888", "+917702050024"],
    whatsapp: "+917702050024",
    address: "H. No. 1121, Upper Ground Floor, Mahipalpur Bypass, Opposite Arjun Camp, New Delhi - 110037",
    lat: 28.545,
    lng: 77.124
  },
  {
    name: "Guild of Service",
    email: ["guildofserviceni@gmail.com"],
    phones: ["+911141013416", "+911141013417"],
    address: "C-25, Qutub Institutional Area, New Delhi - 110016",
    lat: 28.535,
    lng: 77.191
  },
  {
    name: "Centre for Holistic Development (CHD)",
    email: ["info@chdindia.org.in"],
    phones: ["+919811327037"],
    whatsapp: "+919811327037",
    address: "253, First Floor, Ch. Ishwar Singh Complex, Gora St, Shahpur Jat, Siri Fort, New Delhi, Delhi 110017",
    lat: 28.549,
    lng: 77.218 
  },
  {
    name: "Being A Woman NGO",
    email: ["contact@beingawoman.org"],
    phones: ["+919717560272"],
    whatsapp: "+919717560272",
    address: "F-69/301, Abul Fazal Enclave Part 1, Jamia Nagar, Okhla, New Delhi",
    lat: 28.562,
    lng: 77.291
  },
  {
    name: "Somi Foundation",
    email: ["info@somifoundation.org"],
    phones: ["+919582949414", "+919811560458"],
    whatsapp: "+919811560458",
    address: "New Delhi, Delhi",
    lat: 28.613,
    lng: 77.209
  }
]

export default function NGOsPage() {
  return (
    <div className="pt-24 min-h-screen px-6 max-w-7xl mx-auto pb-20">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-4 font-heading text-text tracking-tight flex items-center justify-center gap-3">
          <Shield className="w-10 h-10 text-primary" /> NGO Partners
        </h1>
        <p className="text-text-secondary">
          AuroraSafe works with verified, reputable NGOs across Delhi NCR. These organizations provide immediate counseling, legal aid, and secure shelter to women in need.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 gap-6">
        {ngos.map((ngo, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index}
            className="p-6 rounded-2xl glass-card border border-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-safe" />
                  {ngo.name}
                </h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start text-sm text-text-secondary">
                  <MapPin size={16} className="text-primary mt-0.5 mr-2 shrink-0" />
                  <span>{ngo.address}</span>
                </div>
                {ngo.email && ngo.email[0] && (
                  <div className="flex items-center text-sm text-text-secondary">
                    <Info size={16} className="text-primary mr-2 shrink-0" />
                    <span>{ngo.email.join(', ')}</span>
                  </div>
                )}
                {ngo.phones && ngo.phones.length > 0 && (
                  <div className="flex items-center text-sm font-semibold text-text">
                    <Phone size={16} className="text-primary mr-2 shrink-0" />
                    <span>{ngo.phones.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-auto">
              {ngo.phones && (
                <a href={`tel:${ngo.phones[0]}`} className="btn-primary flex-1 flex justify-center items-center gap-2 py-2 text-sm">
                  <Phone size={14} /> Call Now
                </a>
              )}
              {ngo.whatsapp && (
                <a href={`https://wa.me/${ngo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl text-sm font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {ngo.lat && (
                 <a href={`https://maps.google.com/?daddr=${ngo.lat},${ngo.lng}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl text-sm font-bold bg-accent-subtle text-accent hover:bg-accent hover:text-white transition-colors">
                  <Navigation size={14} /> Directions
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
