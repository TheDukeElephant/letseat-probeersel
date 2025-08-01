'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import logo from '@/assets/logo-full-color.svg';

export default function Footer() {
  return (
    <footer className="bg-transparent">
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 items-center px-8 py-12 gap-4 lg:gap-0">
        {/* Logo */}
        <Image
          src={logo}
          alt="SimplyMeals Logo"
          className="h-16 w-auto order-4 md:order-1 justify-self-center lg:justify-self-start"
        />

        {/* Contact */}
        <div className="flex flex-col gap-4 justify-self-center order-3 lg:order-2 text-center md:text-left">
          <p className="flex flex-col md:grid grid-cols-2 gap-1">
            <span>Tel & WhatsApp:</span>
            <a href="tel:+31854016012" className="hover:underline">
              +31 085 4016012
            </a>
          </p>
          <p className="flex flex-col md:grid grid-cols-2 gap-1">
            <span>E-mail:</span>
            <a href="mailto:info@simplymeals.nl" className="hover:underline">
              info@simplymeals.nl
            </a>
          </p>
        </div>

        {/* Legal Links */}
        <div className="flex flex-col gap-4 justify-self-center order-3 md:order-4 lg:order-3 text-center md:text-left">
          <Link href="/algemene-voorwaarden" className="hover:underline">
            Algemene voorwaarden
          </Link>
          <Link href="/privacy-policy" className="hover:underline">
            Privacy policy
          </Link>
        </div>

        {/* Socials */}
        <div className="flex flex-row items-center gap-8 order-1 md:order-2 lg:order-4 justify-self-center lg:justify-self-end py-4">
          <a
            aria-label="Facebook"
            href="https://www.facebook.com/simplymeals"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-turquoise"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a
            aria-label="Instagram"
            href="https://www.instagram.com/simplymeals.nl"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-turquoise"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            aria-label="LinkedIn"
            href="https://www.linkedin.com/company/simplymeals"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-turquoise"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}
