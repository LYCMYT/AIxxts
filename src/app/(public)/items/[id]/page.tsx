import { ItemDetailPage } from "@/components/item-detail/item-detail-page";
import { getItemDetailById } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemDetailById(id);

  return <ItemDetailPage item={item} itemId={id} />;
}
