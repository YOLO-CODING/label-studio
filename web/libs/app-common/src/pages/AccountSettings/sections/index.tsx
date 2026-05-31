import { PersonalInfo } from "./PersonalInfo";
import { EmailPreferences } from "./EmailPreferences";
import { PersonalAccessToken, PersonalAccessTokenDescription } from "./PersonalAccessToken";
import { MembershipInfo } from "./MembershipInfo";
import { HotkeysManager } from "./Hotkeys";
import type React from "react";
import { PersonalJWTToken } from "./PersonalJWTToken";
import type { AuthTokenSettings } from "../types";
import { ff } from "@humansignal/core";
import { Badge } from "@humansignal/ui";

export type SectionType = {
  title: string | React.ReactNode;
  id: string;
  component: React.FC;
  description?: React.FC;
};

export const accountSettingsSections = (settings: AuthTokenSettings): SectionType[] => {
  return [
    {
      title: "个人信息",
      id: "personal-info",
      component: PersonalInfo,
    },
    {
      title: (
        <div className="flex items-center gap-tight">
          <span>快捷键</span>
          {/* <Badge variant="beta">Beta</Badge> */}
        </div>
      ),
      id: "hotkeys",
      component: HotkeysManager,
      description: () =>
        "定制你的键盘快捷键，加速工作流程。点击下方的任意快捷键，设置最适合你的新组合",
    },
    // {
    //   title: "Email Preferences",
    //   id: "email-preferences",
    //   component: EmailPreferences,
    // },
    {
      title: "团队信息",
      id: "membership-info",
      component: MembershipInfo,
    },
    settings.api_tokens_enabled &&
      ff.isActive(ff.FF_AUTH_TOKENS) && {
        title: "个人令牌",
        id: "personal-access-token",
        component: PersonalJWTToken,
        description: PersonalAccessTokenDescription,
      },
    settings.legacy_api_tokens_enabled && {
      title: ff.isActive(ff.FF_AUTH_TOKENS) ? "旧版令牌" : "访问令牌",
      id: "legacy-token",
      component: PersonalAccessToken,
      description: PersonalAccessTokenDescription,
    },
  ].filter(Boolean) as SectionType[];
};
