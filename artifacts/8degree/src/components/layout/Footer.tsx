import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="font-serif text-3xl font-bold tracking-widest mb-6">
              8 DEGREE
            </div>
            <p className="text-background/70 text-sm leading-relaxed max-w-xs">
              Boutique Bali real estate advisory: precision over volume, clarity and structure for investors and homeowners.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold tracking-widest uppercase text-sm mb-6 text-primary">Portfolio</h4>
            <ul className="space-y-4 text-sm text-background/70">
              <li><Link href="/projects" className="hover:text-primary transition-colors">Current Projects</Link></li>
              <li><Link href="/projects/completed" className="hover:text-primary transition-colors">Completed Developments</Link></li>
              <li><Link href="/invest" className="hover:text-primary transition-colors">Investment Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-widest uppercase text-sm mb-6 text-primary">Company</h4>
            <ul className="space-y-4 text-sm text-background/70">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Journal</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-widest uppercase text-sm mb-6 text-primary">Connect</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-background/70 hover:text-primary transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-background/70 hover:text-primary transition-colors"><Linkedin size={20} /></a>
            </div>
            <p className="text-sm text-background/70">
              Ubud, Bali<br />
              Indonesia
            </p>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-background/50">
          <p>&copy; {new Date().getFullYear()} 8 Degree Real Estate. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
