export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/70 bg-white/80">
      <div className="page-shell grid gap-6 py-10 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg">Little Sparks Gym</h3>
          <p className="mt-2 text-sm text-ink/70">
            Building confidence and coordination through joyful movement.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">Studio</h4>
          <p className="mt-3 text-sm text-ink/70">Dubai Marina, UAE</p>
          <p className="text-sm text-ink/70">hello@littlesparks.ae</p>
          <p className="mt-2 text-sm text-ink/70">+971 4 385 5100</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">Hours</h4>
          <p className="mt-3 text-sm text-ink/70">Mon - Fri: 9am to 7pm</p>
          <p className="text-sm text-ink/70">Sat - Sun: 9am to 3pm</p>
          <p className="mt-2 text-sm text-ink/70">Family lounge · Free parking</p>
        </div>
      </div>
      <div className="border-t border-ink/5">
        <div className="page-shell flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-ink/60">
          <span>© 2026 Little Sparks Gym. All rights reserved.</span>
          <span>Instagram · WhatsApp · FAQ</span>
        </div>
      </div>
    </footer>
  );
}
