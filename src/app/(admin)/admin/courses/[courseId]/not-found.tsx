import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
export default function NotFound() {
  return (
    <EmptyState
      title="Курс табылмады"
      description="Мәлімет жойылған немесе оны көруге рұқсат жоқ."
      action={<ButtonLink href="/admin/courses">Тізімге оралу</ButtonLink>}
    />
  );
}
