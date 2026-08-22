import { Button } from "@unsolo/ui";

/**
 * Placeholder home page.
 *
 * NOTE (Phase A — Foundation): This is not product UI. It exists only to
 * prove the monorepo wiring (Next.js app -> @unsolo/ui -> Tailwind preset
 * with Unsolo design tokens) builds and renders correctly.
 */
export default function Home() {
  return (
    <main className="bg-unsolo-neutral flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-unsolo-primary text-2xl font-semibold">Unsolo</h1>
      <p className="text-unsolo-primary/80">Foundation scaffold — no product UI yet.</p>
      <Button variant="accent">Design system check</Button>
    </main>
  );
}
