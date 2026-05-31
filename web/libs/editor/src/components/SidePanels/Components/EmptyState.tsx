import type React from "react";
import { IconExternal } from "@humansignal/ui";

interface EmptyStateProps {
  icon: React.ReactNode;
  header: string;
  description: React.ReactNode;
  learnMore?: {
    href: string;
    text: string;
    testId?: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, header, description, learnMore }) => {
  // White-label check for docs link hiding
  // @ts-ignore
  const isWhiteLabel = typeof window !== "undefined" && window.APP_SETTINGS?.whitelabel_is_active === true;

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 w-full" data-testid="empty-state">
      <div className="flex items-center justify-center bg-primary-background text-primary-icon rounded-full p-2 mb-2">
        {icon}
      </div>
      <div className="flex flex-col items-center w-full gap-1">
        <div
          className="font-medium text-body-medium leading-tight text-center text-neutral-content"
          data-testid="empty-state-header"
        >
          {header}
        </div>
        <div
          className="text-body-small text-neutral-content-subtler text-center w-full"
          data-testid="empty-state-description"
        >
          {description}
        </div>
      </div>
    </div>
  );
};
