import { ProjectsPage } from "./Projects/Projects";
import { HomePage } from "./Home/HomePage";
import { OrganizationPage } from "./Organization";
import { PlansPage } from "./Plans/Plans"
import { PlanDetailPage } from "./Plans/PlanDetailPage"
import { ModelsPage } from "./Organization/Models/ModelsPage";
import { TrainedModelsPage } from "./TrainingOutputs/Models"
import { FF_HOMEPAGE, isFF } from "../utils/feature-flags";
import { pages } from "@humansignal/app-common";
import { ff } from "@humansignal/core";

export const Pages = [
  isFF(FF_HOMEPAGE) && HomePage,
  ProjectsPage,
  OrganizationPage,
  PlansPage,
  PlanDetailPage,
  TrainedModelsPage,
  ModelsPage,
  ff.isFF(ff.FF_AUTH_TOKENS) && pages.AccountSettingsPage,
].filter(Boolean);
