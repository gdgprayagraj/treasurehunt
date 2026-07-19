import Link from "next/link";
import { Compass } from "lucide-react";
import { MessageScreen } from "@/components/message-screen";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center bg-muted/20">
      <div className="w-full">
        <MessageScreen
          icon={Compass}
          tone="blue"
          title="Page not found"
          description="The page you're looking for doesn't exist or may have moved."
        >
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        </MessageScreen>
      </div>
    </div>
  );
}
