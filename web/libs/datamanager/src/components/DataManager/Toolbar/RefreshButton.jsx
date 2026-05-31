import { inject } from "mobx-react";
import { Button } from "@humansignal/ui";
import { RiRefreshLine } from "react-icons/ri";

const injector = inject(({ store }) => {
  return {
    store,
    needsDataFetch: store.needsDataFetch,
    projectFetch: store.projectFetch,
  };
});

export const RefreshButton = injector(({ store, needsDataFetch, projectFetch, size, style, ...rest }) => {
  return (
    <Button
      size={size ?? "small"}
      look={needsDataFetch ? "filled" : "outlined"}
      variant={needsDataFetch ? "primary" : "neutral"}
      waiting={projectFetch}
      aria-label="Refresh data"
      onClick={async () => {
        await store.fetchProject({ force: true, interaction: "refresh" });
        await store.currentView?.reload();
      }}
      style={{borderRadius: 20, width: 20, height: 20}}
    >
      <RiRefreshLine />
    </Button>
  );
});
