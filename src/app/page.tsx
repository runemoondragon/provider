/* eslint-disable react/no-unescaped-entities */
"use client";
import { useLaserEyes, LaserEyesLogo } from "@omnisat/lasereyes";
import ConnectWallet from "@/components/ConnectWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { fetchOrdAddress, RuneBalance } from "@/lib/runebalance";
import { BTC_MESSAGE_TO_SIGN, ACCESS_TOKENS, AccessToken } from "@/lib/const";
import { useRouter } from "next/navigation";
import { FiCopy, FiTwitter } from 'react-icons/fi';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/NavBar";
import * as Tooltip from '@radix-ui/react-tooltip';
import Image from "next/image";

const truncateAddress = (address: string) => {
  if (!address) return '';
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

export default function Home() {
  const { address, signMessage } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [runeBalances, setRuneBalances] = useState<RuneBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | JSX.Element>("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokenRequirements, setTokenRequirements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const getRuneBalances = async () => {
      if (!address) return;
      
      setIsLoading(true);
      try {
        const balances = await fetchOrdAddress(address);
        setRuneBalances(balances || []);
      } catch (error) {
        console.error("Error fetching rune balances:", error);
        setRuneBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    getRuneBalances();
  }, [address]);

  useEffect(() => {
    const checkAllTokens = async () => {
      if (!runeBalances.length) return;

      const requirements: Record<string, boolean> = {};
      
      for (const token of ACCESS_TOKENS) {
        try {
          const runeBalance = runeBalances.find(rune => rune.name === token.name);
          const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
          const requiredBalance = token.requiredBalance;

          console.log(`Checking ${token.name}:`, {
            currentBalance,
            requiredBalance,
            hasEnough: currentBalance >= requiredBalance
          });

          requirements[token.name] = currentBalance >= requiredBalance;
        } catch (error) {
          console.error(`Error checking token ${token.name}:`, error);
          requirements[token.name] = false;
        }
      }

      console.log('Final requirements:', requirements);
      setTokenRequirements(requirements);
    };

    if (address && runeBalances.length > 0) {
      checkAllTokens();
    }
  }, [address, runeBalances]);

  const handleAccessAttempt = async (token: AccessToken) => {
    if (!address || !signMessage) {
      setVerificationMessage("Please connect your wallet first");
      return;
    }

    setSelectedToken(token.name);
    setVerificationMessage("");
    setIsVerifying(true);

    const runeBalance = runeBalances.find(rune => rune.name === token.name);
    const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
    const hasAccess = currentBalance >= token.requiredBalance;

    console.log(`Access attempt for ${token.name}:`, {
      currentBalance,
      requiredBalance: token.requiredBalance,
      hasAccess
    });

    if (!hasAccess) {
      setVerificationMessage(
        <span>
          Access Denied: Insufficient {token.name} balance. You need {token.requiredBalance.toLocaleString()} tokens, you have {currentBalance.toLocaleString()}.{" "}
          <a 
            href={`https://luminex.io/rune/${encodeURIComponent(token.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            Get tokens
          </a>
        </span>
      );
      setIsVerifying(false);
      return;
    }

    try {
      const signature = await signMessage(BTC_MESSAGE_TO_SIGN);
      
      const payload = {
        address,
        signature,
        message: BTC_MESSAGE_TO_SIGN,
        tokenName: token.name
      };
      
      const response = await fetch('/api/auth', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.externalUrl) {
          window.open(data.externalUrl, '_blank');
          return;
        }

        setVerificationMessage(
          <span className="text-green-500">
            Access Granted: Welcome to the {token.name} Dashboard.
          </span>
        );
        router.push(token.dashboardPath);
      } else {
        setVerificationMessage(data.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationMessage("Failed to verify wallet ownership");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 text-white">
      <NavBar address={address} />
      
      {/* Hero Section */}
      <main className="min-h-[600px] relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-blue-900 to-blue-800"></div>

        {/* Content */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Left side - Text Content */}
            <div className="lg:w-1/2 space-y-8">
              <h1 className="text-6xl font-bold leading-tight">
              START ACCEPTING<br />
                <span>PAYMENTS in Bitcoin</span><br />
                <span>With zero Fees.</span>
            </h1>
              <div>
              <Link
                href="#subscription"
                className="inline-block px-12 py-4 text-lg font-semibold bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-lg hover:opacity-90 transition-opacity"
              >
                TRY IT
              </Link>
            </div>
          </div>

            {/* Right side - Illustration */}
          <div className="lg:w-1/2 relative">
              <Image
                src="/header-image-blue.png"
                alt="Bitcoin Payment Processing Illustration"
                width={600}
                height={400}
                className="w-full h-auto"
                priority
              />
                    </div>
                  </div>
                </div>
      </main>

      {/* Adding the "What is BTCPayProvider?" section */}
      <section className="bg-white text-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-blue-500 font-medium mb-4">WHAT IS BTCPAYPROVIDER?</h2>
          
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <h3 className="text-4xl font-bold text-blue-600">
                Hosting services provide users with easy access to BTCPayServer.
              </h3>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  BTCPayServer is a secure and censorship-resistant digital payment processor.
                </p>
                
                <p>
                  The service is non-custodial, meaning you have solo access to your funds and use any Bitcoin wallet to accept payments.
                </p>
                
                <p>
                  You can Accept Bitcoin Lightning Network payments. Seamlessly use your Strike Wallet for Lightning transactions on btcpayserver.
                </p>
                
                <p>
                  You have access to point-of-sale web application, easy tools for WooCommerce and Shopify, a billing system, a crowdfunding app, and more.
                </p>
                  </div>
                </div>

            <div className="lg:w-1/2 relative">
              <div className="bg-[#8CC63F] rounded-lg p-8">
                <h4 className="text-white text-2xl mb-4">
                  Become your own payment processor.
                </h4>
                <div className="relative aspect-video">
                  <Image
                    src="/btcpayserver.png"
                    alt="BTCPay Dashboard Preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-l-blue-500 border-t-transparent border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Duration Selection Section */}
      <section id="subscription" className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Duration</h2>
            <p className="text-gray-300">Select the subscription that best fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 30-Day Plan */}
            <div className="bg-blue-800/30 backdrop-blur-sm p-8 rounded-xl border border-blue-700/30">
              <h3 className="text-2xl font-bold text-white mb-2">30-Day</h3>
              <p className="text-cyan-400 mb-6">Save 0%</p>
              <p className="text-gray-300 mb-8">
                Ideal for short-term projects or trying out BTCPay Server.
              </p>
              <a
                href="https://bti.btcpayprovider.com/plugins/subscription/PrPxHuGYKCVE8dM3w1gQM13yeZR"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 rounded-lg border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-blue-900 transition-colors"
              >
                GET STARTED
              </a>
            </div>

            {/* 60-Day Plan */}
            <div className="bg-blue-800/30 backdrop-blur-sm p-8 rounded-xl border border-blue-700/30">
              <h3 className="text-2xl font-bold text-white mb-2">60-Day</h3>
              <p className="text-cyan-400 mb-6">Save 5%</p>
              <p className="text-gray-300 mb-8">
                A great option for businesses looking for extended uptime.
              </p>
              <a
                href="https://bti.btcpayprovider.com/plugins/subscription/SzhwXW2opbHMQkQMpe8fFqy9FzZ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 rounded-lg border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-blue-900 transition-colors"
              >
                GET STARTED
              </a>
            </div>

            {/* 90-Day Plan */}
            <div className="bg-blue-800/30 backdrop-blur-sm p-8 rounded-xl border border-blue-700/30">
              <h3 className="text-2xl font-bold text-white mb-2">90-Day</h3>
              <p className="text-cyan-400 mb-6">Save 10%</p>
              <p className="text-gray-300 mb-8">
                Best value for long-term users with uninterrupted service.
              </p>
              <a
                href="https://bti.btcpayprovider.com/plugins/subscription/4GjargCZ9txXBBkjixQd6w4Nc1B"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 rounded-lg border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-blue-900 transition-colors"
              >
                GET STARTED
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose BTCPayProvider Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-blue-600 text-center mb-16">
            Why Choose BTCPayProvider
          </h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Infrastructure */}
            <div className="text-center">
              <div className="mb-6 relative w-32 h-32 mx-auto">
                <Image
                  src="/features-icon-light-a.png"
                  alt="Infrastructure"
                  width={128}
                  height={128}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Infrastructure
              </h3>
              <p className="text-gray-600">
                BTCPayProvider gives you peace of mind by ensuring uninterrupted accessibility while you focus on building your business.
              </p>
            </div>

            {/* Reliable Service */}
            <div className="text-center">
              <div className="mb-6 relative w-32 h-32 mx-auto">
                <Image
                  src="/features-icon-light-c.png"
                  alt="Reliable Service"
                  width={128}
                  height={128}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Reliable Service
              </h3>
              <p className="text-gray-600">
                We have provided uninterrupted service with zero downtime to over 2,900 stores.
              </p>
            </div>

            {/* Flexible Options */}
            <div className="text-center">
              <div className="mb-6 relative w-32 h-32 mx-auto">
                <Image
                  src="/features-icon-light-b.png"
                  alt="Flexible Options"
                  width={128}
                  height={128}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Flexible Options
              </h3>
              <p className="text-gray-600">
                Pay only for the duration you need. You can suspend, restart, or extend your access as required.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-16">
            <a
              href="https://docs.btcpayserver.org/?"
              target="_blank"
              rel="noopener noreferrer"
              className="px-12 py-3 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              DOCS
            </a>
            <a
              href="https://bti.btcpayprovider.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-12 py-3 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              API
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h3 className="text-cyan-400 font-medium uppercase">CONTACT</h3>
          </div>
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Get In Touch
          </h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left Column - Contact Info */}
            <div className="space-y-8">
              <p className="text-gray-300 text-lg">
                Any question? Reach out to us and we'll get back to you shortly.
              </p>

              <div className="space-y-4">
                <a 
                  href="mailto:contact@btcpayprovider.com" 
                  className="flex items-center gap-4 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  contact@btcpayprovider.com
                </a>

                <a 
                  href="https://t.me/btcpayprovider" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  Join us on Telegram
                </a>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <form className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-lg bg-blue-800/30 border border-blue-700/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 rounded-lg bg-blue-800/30 border border-blue-700/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                />
              </div>
              <div>
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-blue-800/30 border border-blue-700/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-400 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                SUBMIT
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-lg mb-4">BTCPayProvider</h4>
              <p className="text-sm text-gray-400">
                Secure and reliable Bitcoin payment processing solutions for your business.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com/btcpayprovider" className="text-gray-400 hover:text-cyan-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://t.me/btcpayprovider" className="text-gray-400 hover:text-cyan-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.227-.535.227l.19-2.725 4.96-4.475c.215-.19-.047-.296-.335-.106l-6.13 3.862-2.633-.822c-.573-.18-.584-.573.12-.848l10.27-3.96c.475-.176.892.107.593 1.475z"/>
                  </svg>
                </a>
                <a href="https://github.com/btcpayprovider" className="text-gray-400 hover:text-cyan-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                <li><a href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="/docs" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
                <li><a href="/api" className="hover:text-cyan-400 transition-colors">API Reference</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="/faq" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
                <li><a href="/contact" className="hover:text-cyan-400 transition-colors">Contact Us</a></li>
                <li><a href="/status" className="hover:text-cyan-400 transition-colors">System Status</a></li>
                <li><a href="/blog" className="hover:text-cyan-400 transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
                <li><a href="/compliance" className="hover:text-cyan-400 transition-colors">Compliance</a></li>
                <li><a href="/security" className="hover:text-cyan-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 mt-8 border-t border-blue-900/50 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} BTCPayProvider. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
