"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [router, user, loading]);

  if (loading || !user) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "transparent",
      }}
    >
      <Navbar />
      <div style={{ paddingBottom: "0" }}>{children}</div>
      <Footer />
    </div>
  );
}
