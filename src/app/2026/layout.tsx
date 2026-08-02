import Nav from "@/app/2026/_components/Nav";
import Footer from "@/app/2026/_components/Footer";

export default function Year2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
