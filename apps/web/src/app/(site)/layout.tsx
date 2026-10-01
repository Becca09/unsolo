import { Navbar } from "@/components/Navbar";

/**
 * Public/marketing shell — top navbar wraps every (site) route.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
