'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Link from 'next/link';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'gonext-cookie-consent';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === null) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    document.body.style.overflow = 'unset';
    setIsVisible(false);
  };

  if (!isVisible || !isMounted) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={handleAccept}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="container mx-auto max-w-6xl p-6">
          <h3 className="text-xl font-semibold mb-2">We May Use Cookies</h3>

          <p>
            We are cookie-free to start, however some parts of the website (board games, live chat, etc) require log in.
          </p>
          <p className="mb-3">
            If you log in as guest or create an account, we will use cookies to remember your session.
          </p>
          <h4 className="font-medium text-foreground mb-1">
            Strictly Necessary
          </h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0" />
              <span>
                <strong>access_token</strong>: Authenticates your requests
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0" />
              <span>
                <strong>refresh_token</strong>: Maintains your session
              </span>
            </li>
          </ul>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-5">
            <Button
              onClick={handleAccept}
              className="flex-1 sm:max-w-[200px]"
              variant="primary"
              size="lg"
            >
              Got it
            </Button>
            <Link
              href="https://github.com/dann-huang/gonext"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:max-w-[200px]"
            >
              <Button variant="secondary" size="lg" className="w-full">
                View source
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
