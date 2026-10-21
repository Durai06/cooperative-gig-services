import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const section = segments[0] as string | undefined;
    const isPublic =
      !section || ["onboarding", "roles", "(auth)"].includes(section);
    if (!isPublic && !user) {
      router.replace("/");
      return;
    }
    if (
      section === "booking" &&
      segments[1] === "create" &&
      user?.role !== "customer"
    ) {
      router.replace("/");
      return;
    }
    if (
      section === "booking" &&
      ["workers", "confirmation"].includes(segments[1] as string) &&
      user?.role === "worker"
    ) {
      router.replace("/");
      return;
    }
    if (
      (section === "rating" || section === "complaint") &&
      user?.role !== "customer"
    ) {
      router.replace("/");
      return;
    }
  }, [user, isLoading, segments, router]);

  return <>{children}</>;
}
