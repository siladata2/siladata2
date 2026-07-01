import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, CheckCircle2, Users, Download, Shield, MessageCircle, AlertCircle, Loader2, Sun, Moon } from 'lucide-react';
import { ApiService } from '../utils/api';
import WhatsAppPopup from './WhatsAppPopup';

export default function PublicLanding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ currentCounter: 0, downloadThreshold: 100 });
  const [whatsapp, setWhatsapp] = useState({ groupUrl: '', channelUrl: '' });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [logoTapCount, setLogoTapCount] = useState(0);
  
  // Popups control
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState("Join Our Community");

  const handleLogoTap = () => {
    setLogoTapCount((prev) => {
      const next = prev + 1;
      if (next >= 7) {
        window.history.pushState(null, '', '/admin');
        return 0;
      }
      return next;
    });
  };

  // Load public configurations on mount
  useEffect(() => {
    // Track site visit in MongoDB
    ApiService.trackVisit();

    // Fetch initial stats
    loadSettings();

    // Real-time synchronization: poll stats from MongoDB database every 3 seconds
    const intervalId = setInterval(() => {
      loadSettings();
    }, 3000);

    // Open initial popup with a 1-second delay
    const popupTimer = setTimeout(() => {
      setIsPopupOpen(true);
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(popupTimer);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await ApiService.getSettings();
      setStats({
        currentCounter: data.currentCounter,
        downloadThreshold: data.downloadThreshold
      });
      setWhatsapp({
        groupUrl: data.whatsappGroupUrl,
        channelUrl: data.whatsappChannelUrl
      });
    } catch (err) {
      console.error("Could not load setting counters:", err);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9+\s()]*$/.test(val)) {
      setPhone(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!name.trim()) {
      setError('Please enter your Full Name.');
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 8) {
      setError('Please enter a valid Phone Number (minimum 8 digits).');
      return;
    }

    setLoading(true);

    try {
      // API call to save contact to MongoDB
      const response = await ApiService.submitContact(name, phone);
      
      if (response.success) {
        setSuccess(true);
        setName('');
        setPhone('');
        
        // Refresh local counter stats immediately
        setStats({
          currentCounter: response.currentCounter,
          downloadThreshold: response.threshold
        });

        // Trigger automatic download if threshold is reached
        if (response.triggerDownload && response.vcfData) {
          triggerBrowserDownload(response.vcfData, response.vcfFilename);
        }

        // Open popup again upon successful submission
        setTimeout(() => {
          setPopupTitle("Awesome! Contact Submitted Successfully 🎉");
          setIsPopupOpen(true);
        }, 1800);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Browser download helper
  const triggerBrowserDownload = (vcfData: string, filename: string) => {
    try {
      const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'sila_contacts.vcf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Auto-download failed:', e);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col relative overflow-hidden ${isDarkMode ? 'bg-black text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic Ambient Blur Lights (Blue-in-Black feel) */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 ${isDarkMode ? 'bg-blue-600/15' : 'bg-blue-500/5'}`} />
      <div className={`absolute bottom-10 left-10 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/10' : 'bg-blue-200/20'}`} />

      {/* Header */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 backdrop-blur-md ${isDarkMode ? 'border-blue-950 bg-black/85' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            onClick={handleLogoTap}
            className="flex items-center gap-3 cursor-pointer select-none"
            title="SILA VCF"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <span className={`font-bold tracking-tight text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SILA VCF</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Brightness Light/Dark mode switcher */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition-colors duration-200 cursor-pointer ${isDarkMode ? 'text-blue-400 hover:text-white bg-blue-950/40 border-blue-900/60' : 'text-slate-700 hover:text-blue-600 bg-white border-slate-200'}`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a
              href={whatsapp.groupUrl || 'https://chat.whatsapp.com/IS276Wg9zcuCnJRiMDI64g'}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-2 text-xs transition-colors border px-3 py-1.5 rounded-lg ${isDarkMode ? 'text-blue-400 hover:text-white bg-blue-950/40 border-blue-900/60' : 'text-slate-700 hover:text-blue-600 bg-white border-slate-200'}`}
            >
              <MessageCircle className="h-4 w-4" />
              Community Group
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-4xl mx-auto w-full relative z-10">
        
        {/* Real-time Indicator banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-1.5 px-4 rounded-full border transition-colors ${isDarkMode ? 'border-blue-500/30 bg-blue-950/40 text-blue-400' : 'border-blue-500/20 bg-blue-500/5 text-blue-600'} text-xs font-semibold flex items-center gap-2 text-center`}
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
          Real-Time Contact Sync Active
        </motion.div>

        {/* Hero Section - Clean, no PRO PREMIUM branding */}
        <div className="text-center mb-8 max-w-xl">
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Boost Your WhatsApp <br />
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Status Views Instantly
            </span>
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Enter your details below to add your contact to the next VCF batch for simple, synchronized status saving and status views!
          </p>
        </div>

        {/* Submission Board - Gorgeous black-and-blue theme */}
        <div className={`w-full max-w-lg border rounded-3xl p-6 sm:p-8 transition-all duration-300 ${isDarkMode ? 'bg-[#080d1a] border-blue-900/40 text-slate-100 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]' : 'bg-white border-slate-200 text-slate-900 shadow-lg'} relative overflow-hidden`}>
          
          {/* Progress Section */}
          <div className="mb-6">
            <div className={`flex items-center justify-between text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                Live Batch Progress (MongoDB)
              </span>
              <span className="text-blue-400 font-bold tracking-wide">
                {stats.currentCounter} / {stats.downloadThreshold} Contacts
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className={`w-full h-3.5 rounded-full overflow-hidden border p-[2px] transition-colors ${isDarkMode ? 'bg-black border-blue-950' : 'bg-slate-100 border-slate-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.currentCounter / stats.downloadThreshold) * 100, 100)}%` }}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
              />
            </div>
            
            <p className={`text-[11px] mt-2 text-center italic transition-colors ${isDarkMode ? 'text-blue-400/70' : 'text-slate-500'}`}>
              VCF file auto-downloads and resets once we hit {stats.downloadThreshold} entries!
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name field */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400/80">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Richard Juma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${isDarkMode ? 'bg-black border-blue-900/35 text-white placeholder:text-slate-650' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`}
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400/80">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 255712345678"
                      value={phone}
                      onChange={handlePhoneChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${isDarkMode ? 'bg-black border-blue-900/35 text-white placeholder:text-slate-650' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Contact...
                    </>
                  ) : (
                    'Submit & Boost Views'
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 flex flex-col items-center"
              >
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 animate-bounce border ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-500/5 border-blue-500/10 text-blue-600'}`}>
                  <CheckCircle2 className={`h-10 w-10 ${isDarkMode ? 'fill-blue-500/10' : 'fill-blue-500/5'}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Submitted Successfully!</h3>
                <p className={`text-sm max-w-xs mb-6 ${isDarkMode ? 'text-slate-450' : 'text-slate-650'}`}>
                  Your contact was saved successfully in real-time. The WhatsApp communities popup will re-open shortly to complete your registration!
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className={`px-6 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${isDarkMode ? 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                >
                  Add Another Contact
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-12">
          <div className={`p-4 border rounded-2xl flex items-start gap-3 transition-colors ${isDarkMode ? 'bg-blue-950/10 border-blue-950/30' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/5 text-blue-600'}`}>
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Threshold Auto-Download</h4>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>VCF generates instantly on reaching the count, prompting auto-downloads.</p>
            </div>
          </div>

          <div className={`p-4 border rounded-2xl flex items-start gap-3 transition-colors ${isDarkMode ? 'bg-blue-950/10 border-blue-950/30' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/5 text-blue-600'}`}>
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Spam-Protected Sync</h4>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Strict real-time IP protections ensure all contact listings remain authentic.</p>
            </div>
          </div>

          <div className={`p-4 border rounded-2xl flex items-start gap-3 transition-colors ${isDarkMode ? 'bg-blue-950/10 border-blue-950/30' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/5 text-blue-600'}`}>
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Smart Status Sync</h4>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Allows fast saving of massive batches, boosting status views effortlessly.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Strictly clean with NO "All rights reserved." */}
      <footer className={`border-t py-6 mt-12 transition-colors duration-300 ${isDarkMode ? 'border-blue-950 bg-black' : 'border-slate-200 bg-slate-100'}`}>
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            &copy; {new Date().getFullYear()} SILA VCF.
          </div>
        </div>
      </footer>

      {/* Community Ad popup */}
      <WhatsAppPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        groupUrl={whatsapp.groupUrl}
        channelUrl={whatsapp.channelUrl}
        title={popupTitle}
      />
    </div>
  );
}
