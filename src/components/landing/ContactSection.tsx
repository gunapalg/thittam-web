import { useState } from 'react';
import { Mail, Copy, Check, MessageSquare, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ContactSectionProps {
  className?: string;
}

export function ContactSection({ className }: ContactSectionProps) {
  const [copied, setCopied] = useState(false);
  const supportEmail = 'support@thittam1hub.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = supportEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      className={`py-16 md:py-20 bg-background/95 border-t border-border/60 ${className ?? ''}`}
      aria-labelledby="contact-heading"
    >
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            id="contact-heading"
            className="text-2xl md:text-3xl font-semibold tracking-tight mb-4"
          >
            Get in Touch
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Email contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0 }}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Email Us</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drop us a line and we'll respond within 24 hours.
            </p>
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px]"
            >
              {supportEmail}
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </motion.div>

          {/* Help Center */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Help Center</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse guides, tutorials, and FAQs to get started.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/help">Visit Help Center</Link>
            </Button>
          </motion.div>

          {/* Live Chat / Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/50 text-secondary-foreground mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Feedback</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share your ideas or report issues to help us improve.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/help?intent=feedback">Send Feedback</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
