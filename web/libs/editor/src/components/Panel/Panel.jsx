import { observer } from "mobx-react";
import { Button } from "@humansignal/ui";
import {
  PiArrowsOutSimple,
  PiArrowsInSimple,
  PiArrowCounterClockwise,
  PiArrowClockwise,
  PiArrowUUpLeft,
  PiGear,
} from "react-icons/pi";

import styles from "./Panel.module.scss";
import Hint from "../Hint/Hint";

/**
 * Panel component with buttons:
 * Undo
 * Redo
 * Reset
 * Show Instructions
 * Settings
 */
export default observer(({ store }) => {
  const annotation = store.annotationStore.selected;
  const { history } = annotation;
  const classname = [styles.block, styles.block__controls, store.annotationStore.viewingAll ? styles.hidden : ""]
    .filter(Boolean)
    .join(" ");
  const panelClassName = cn("panel").toClassName();

  return (
    <div className={`${styles.container} ${panelClassName}`}>
      <div className={classname}>
        <Button
          look="string"
          leading={<PiArrowCounterClockwise size={16} />}
          disabled={!history?.canUndo}
          onClick={(ev) => {
            annotation?.undo();
            ev.preventDefault();
          }}
        >
          {/* Undo */}
           撤销
          {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ Ctrl+z ]</Hint>}
        </Button>
        <Button
          look="string"
          disabled={!history?.canRedo}
          leading={<PiArrowClockwise size={16} />}
          onClick={(ev) => {
            annotation?.redo();
            ev.preventDefault();
          }}
        >
          {/* Redo */}
          恢复
        </Button>
        <Button
          type="ghost"
          disabled={!history?.canUndo}
          icon={<PiArrowUUpLeft size={16} />}
          onClick={() => {
            history && history.reset();
          }}
        >
          {/* Reset */}
           重置
        </Button>
        {store.setPrelabeling && (
          <Button
            variant="neutral"
            style={{ display: "none" }}
            onClick={() => {
              store.resetPrelabeling();
            }}
          >
            {/* Reset Prelabeling */}
            重置预标注
          </Button>
        )}
        {store.hasInterface("debug") && (
          <span>
            {history.undoIdx} / {history.history.length}
            {history.isFrozen && " (frozen)"}
          </span>
        )}
      </div>

      <div className={[styles.block, styles.common].join(" ")}>
        {store.description && store.showingDescription && (
          <Button
            variant="neutral"
            onClick={() => {
              store.toggleDescription();
            }}
          >
            {/* Hide Instructions */}
            隐藏说明
          </Button>
        )}
        {store.description && !store.showingDescription && (
          <Button
            variant="neutral"
            onClick={() => {
              store.toggleDescription();
            }}
          >
            {/* Instructions */}
            说明
          </Button>
        )}

        <Button
          variant="neutral"
          leading={<PiGear size={16} />}
          onClick={(ev) => {
            store.toggleSettings();
            ev.preventDefault();
            return false;
          }}
        />
        <Button
          className="lsf-fs"
          variant="neutral"
          leading={store.settings.fullscreen ? <PiArrowsOutSimple size={16} /> : <PiArrowsInSimple size={16} />}
          onClick={(ev) => {
            store.settings.toggleFullscreen();
            ev.preventDefault();
            return false;
          }}
        />
      </div>
    </div>
  );
});
