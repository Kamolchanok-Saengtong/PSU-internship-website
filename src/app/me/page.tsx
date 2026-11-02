import type { Metadata } from "next";
import { MyPlaces } from "@/components/my-places";

export const metadata: Metadata = { title: "My page" };

export default function MePage() {
  return <MyPlaces />;
}
