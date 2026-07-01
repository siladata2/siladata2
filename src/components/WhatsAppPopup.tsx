import { AnimatePresence, motion } from 'motion/react';
import { X, MessageSquare, Bell, ArrowUpRight } from 'lucide-react';

interface WhatsAppPopupProps {
  isOpen: boolean;
  onClose: () => void;
  groupUrl: string;
  channelUrl: string;
  title?: string;
}

export default function WhatsAppPopup({
  isOpen,
  onClose,
  groupUrl,
  channelUrl,
  title = "Join Our Community"
}: WhatsAppPopupProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-950/75 backdrop-blur-sm"
        />

        {/* Modal body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-blue-500/20 bg-neutral-900 p-6 text-neutral-100 shadow-2xl shadow-blue-950/20"
        >
          {/* Subtle blue ambient light */}
          <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-100 transition-colors p-1 hover:bg-neutral-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
              <MessageSquare className="h-7 w-7 fill-blue-400/10" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-neutral-400 max-w-xs mx-auto">
              Stay connected with SILA VCF updates and fresh contacts list batches!
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3.5">
            {/* WhatsApp Group */}
            <a
              href={groupUrl || 'https://chat.whatsapp.com/IS276Wg9zcuCnJRiMDI64g'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    Join WhatsApp Group
                  </div>
                  <div className="text-xs text-neutral-400">
                    Interact, chat and share with members
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
            </a>

            {/* WhatsApp Channel */}
            <a
              href={channelUrl || 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    Follow WhatsApp Channel
                  </div>
                  <div className="text-xs text-neutral-400">
                    Get instant channel broadcasts
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
            </a>
          </div>

          {/* Close CTA */}
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            I have joined both! Continue
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
