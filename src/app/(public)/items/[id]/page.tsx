import { ItemDetailPage } from "@/components/item-detail/item-detail-page";
import { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/server/auth/current-user";
import { getAdminTopicRows } from "@/server/admin/topics";
import { getItemDetailById } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, user] = await Promise.all([getItemDetailById(id), getCurrentUser()]);
  const canManageTopics = user?.role === UserRole.ADMIN;
  const topicOptions = canManageTopics ? await getAdminTopicRows() : [];

  return (
    <ItemDetailPage
      canManageTopics={canManageTopics}
      item={item}
      itemId={id}
      topicOptions={topicOptions}
    />
  );
}
