import Image from "next/image";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t pt-16 pb-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="relative h-12 w-48">
          <Image
            src="/icons/logo-white-fill.png"
            alt="airdribble logo white"
            fill
            className="object-contain hidden dark:block"
            priority
          />
          <Image
            src="/icons/logo-black-fill.png"
            alt="airdribble logo black"
            fill
            className="object-contain block dark:hidden"
            priority
          />
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link href="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</Link>
        </div>

      </div>
    </footer>
  );
}
