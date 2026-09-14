import Nav from "@/app/2026/_components/Nav";
import Footer from "@/app/2026/_components/Footer";
import BlueprintBackdrop from "@/app/2026/_components/BlueprintBackdrop";
import EggProvider from "@/app/2026/_components/eggs/EggProvider";

export default function Year2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EggProvider>
      <div className="flex min-h-screen flex-col">
        <BlueprintBackdrop />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </EggProvider>
  );
}
