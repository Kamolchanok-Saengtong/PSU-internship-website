import { PlaceDetail } from "@/components/place-detail";

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaceDetail id={id} />;
}
