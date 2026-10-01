import Image from "next/image";
import Link from "next/link";
import { GeometryNetwork } from "@/components/GeometryNetwork";

const travelers = [
  { title: "Create your profile", text: "Tell us your style, destinations, and travel mood." },
  { title: "Find or post a trip", text: "Browse open trips or share your own adventure." },
  { title: "Meet your people", text: "Connect with travelers going your way." },
  { title: "Go together", text: "Pack your bags. Your crew is ready." },
];

const planners = [
  { title: "Build your profile", text: "Show your trips, reviews, and specialties." },
  { title: "List trips", text: "Publish group trips with your pricing and style." },
  { title: "Grow community", text: "Travelers follow, book, and return with friends." },
];

const businesses = [
  { title: "Create a listing", text: "Hostels, tours, guides, restaurants, rentals." },
  { title: "Get found", text: "Show up in front of travelers already planning." },
  { title: "Earn trust", text: "Build reviews from real travel experiences." },
];

const reasons = [
  { title: "Real connections", text: "Matched with people who fit your vibe." },
  { title: "Modern travel", text: "Social, flexible, community first." },
  { title: "One platform", text: "Travelers, planners, and businesses together." },
  { title: "Global and personal", text: "From Lagos to Lisbon and everywhere between." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-unsolo-primary relative min-h-screen overflow-hidden">
        <div className="bg-unsolo-primary absolute inset-0">
          <GeometryNetwork />
        </div>
        <div className="from-unsolo-primary via-unsolo-primary/80 to-unsolo-primary/40 absolute inset-0 bg-gradient-to-t" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-start justify-end px-6 pb-24 pt-40 sm:pb-32 sm:pt-48">
          <div className="max-w-2xl">
            <p className="text-unsolo-sage mb-6 text-sm font-semibold uppercase tracking-widest">
              Travel the world, never alone
            </p>
            <h1 className="text-unsolo-neutral text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Travel is better
              <br />
              when you are not
              <br />
              doing it alone.
            </h1>
            <p className="text-unsolo-neutral/70 mt-6 max-w-md text-base leading-relaxed sm:text-lg">
              UNSOLO connects you with real people who want to go where you want to go.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="bg-unsolo-accent inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              >
                Find Your Crew
              </Link>
              <a
                href="#trips"
                className="text-unsolo-neutral text-sm font-medium underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Discover Trips
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Trips */}
      <section
        id="trips"
        className="border-unsolo-border bg-unsolo-surface border-t py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="text-unsolo-accent mb-4 text-xs font-semibold uppercase tracking-widest">
              Discover Trips
            </p>
            <h2 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">For travelers</h2>
            <p className="text-unsolo-muted mt-4">Find your crew in four simple steps.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {travelers.map((item, i) => (
              <div key={item.title} className="card p-6">
                <span className="text-unsolo-accent text-sm font-bold">0{i + 1}</span>
                <h3 className="text-unsolo-primary mt-4 text-base font-bold">{item.title}</h3>
                <p className="text-unsolo-muted mt-2 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a
              href="/trips"
              className="bg-unsolo-primary text-unsolo-neutral inline-block rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-85"
            >
              View all trips
            </a>
          </div>
        </div>
      </section>

      {/* Discover Planners */}
      <section id="planner" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="text-unsolo-accent mb-4 text-xs font-semibold uppercase tracking-widest">
              Discover Planners
            </p>
            <h2 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">
              For trip planners
            </h2>
            <p className="text-unsolo-muted mt-4">Turn your travel expertise into a business.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {planners.map((item, i) => (
              <div key={item.title} className="card p-6">
                <span className="text-unsolo-accent text-sm font-bold">0{i + 1}</span>
                <h3 className="text-unsolo-primary mt-4 text-base font-bold">{item.title}</h3>
                <p className="text-unsolo-muted mt-2 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a
              href="/planners"
              className="bg-unsolo-primary text-unsolo-neutral inline-block rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-85"
            >
              View all planners
            </a>
          </div>
        </div>
      </section>

      {/* Discover Businesses */}
      <section
        id="business"
        className="border-unsolo-border bg-unsolo-surface border-t py-24 sm:py-32"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="text-unsolo-accent mb-4 text-xs font-semibold uppercase tracking-widest">
              Discover Businesses
            </p>
            <h2 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">
              For travel businesses
            </h2>
            <p className="text-unsolo-muted mt-4">
              Get in front of travelers who are ready to book.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {businesses.map((item, i) => (
              <div key={item.title} className="card p-6">
                <span className="text-unsolo-accent text-sm font-bold">0{i + 1}</span>
                <h3 className="text-unsolo-primary mt-4 text-base font-bold">{item.title}</h3>
                <p className="text-unsolo-muted mt-2 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a
              href="/businesses"
              className="bg-unsolo-primary text-unsolo-neutral inline-block rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-85"
            >
              View all businesses
            </a>
          </div>
        </div>
      </section>

      {/* Why UNSOLO */}
      <section id="why" className="border-unsolo-border bg-unsolo-surface border-t py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <p className="text-unsolo-accent mb-4 text-xs font-semibold uppercase tracking-widest">
              Why UNSOLO
            </p>
            <h2 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">Why this works</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="card p-6">
                <h3 className="text-unsolo-primary text-base font-bold">{reason.title}</h3>
                <p className="text-unsolo-muted mt-2 text-sm leading-relaxed">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="join" className="bg-unsolo-primary py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-unsolo-neutral text-3xl font-bold sm:text-4xl">
            Your next trip is waiting.
          </h2>
          <p className="text-unsolo-neutral/70 mx-auto mt-5 max-w-md text-base sm:text-lg">
            Stop waiting for someone to say yes. The people who want to go are already here.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="bg-unsolo-accent inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            >
              Join UNSOLO Free
            </Link>
            <a
              href="#business"
              className="text-unsolo-neutral/70 hover:text-unsolo-neutral text-sm underline-offset-4 transition-colors hover:underline"
            >
              List Your Business
            </a>
            <a
              href="#planner"
              className="text-unsolo-neutral/70 hover:text-unsolo-neutral text-sm underline-offset-4 transition-colors hover:underline"
            >
              Join as a Planner
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-unsolo-border bg-unsolo-surface border-t py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/unsolo-8.png"
                alt="Unsolo"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-unsolo-primary text-sm font-bold">UNSOLO</span>
            </div>
            <p className="text-unsolo-muted text-xs">
              &copy; {new Date().getFullYear()} Unsolo. Travel the world, never alone.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
