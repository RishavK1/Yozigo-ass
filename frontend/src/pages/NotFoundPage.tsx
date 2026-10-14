import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-extrabold text-brand-500">404</h1>
      <p className="mt-3 text-ink-600">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </PageContainer>
  );
}
