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
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold mb-2">We Use Cookies</h3>
                <button
                  onClick={handleAccept}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-2"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-base text-muted-foreground">
                <p className="mb-3">
                  We use essential cookies to provide a secure and functional
                  experience. By clicking "Accept All", you agree to our use of
                  cookies as described below.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Strictly Necessary
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0" />
                        <span>
                          <strong>access_token</strong>: Authenticates your
                          requests
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0" />
                        <span>
                          <strong>refresh_token</strong>: Maintains your session
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Learn More
                    </h4>
                    <p className="text-sm">
                      Review our{' '}
                      <Link
                        href="https://github.com/dann-huang/gonext"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        source code
                      </Link>{' '}
                      to see exactly how we handle your data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
