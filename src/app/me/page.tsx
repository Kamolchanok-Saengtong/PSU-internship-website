import type { Metadata } from "next";
import { MyPlaces } from "@/components/my-places";

export const metadata: Metadata = { title: "My places" };

export default function MePage() {
  return <MyPlaces />;
}
