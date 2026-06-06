import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StaticContent } from "../../app/StaticContent/StaticContent";
import { TbPinnedFilled, TbPinnedOff } from "react-icons/tb";
import {
  IconBook,
  IconFolder,
  IconHome,
  // IconHotkeys,
  IconPersonInCircle,
  IconPin,
  IconTerminal,
  IconDoor,
  IconGithub,
  IconSettings,
  IconSlack,
  IconList,
  IconModel
} from "@humansignal/icons";
import { MdManageAccounts } from "react-icons/md";
import { IoIosExit } from "react-icons/io";
import { FaBell } from "react-icons/fa";
import { BiSolidKeyboard } from "react-icons/bi";
import { LSLogo } from "../../assets/images";
import { Button, Userpic, ThemeToggle } from "@humansignal/ui";
import { useConfig } from "../../providers/ConfigProvider";
import { useContextComponent, useFixedLocation } from "../../providers/RoutesProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { cn } from "../../utils/bem";
import { absoluteURL, isDefined } from "../../utils/helpers";
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs";
import { Dropdown } from "../Dropdown/Dropdown";
import { Hamburger } from "../Hamburger/Hamburger";
import { Menu } from "../Menu/Menu";
// import { VersionNotifier, VersionProvider } from "../VersionNotifier/VersionNotifier";
import "./Menubar.scss";
import "./MenuContent.scss";
import "./MenuSidebar.scss";
import { FF_HOMEPAGE } from "../../utils/feature-flags";
import { pages } from "@humansignal/app-common";
import { isFF } from "../../utils/feature-flags";
import { ff } from "@humansignal/core";
import { openHotkeyHelp } from "@humansignal/app-common/pages/AccountSettings/sections/Hotkeys/Help";

export const MenubarContext = createContext();

const LeftContextMenu = ({ className }) => (
  <StaticContent id="context-menu-left" className={className}>
    {(template) => <Breadcrumbs fromTemplate={template} />}
  </StaticContent>
);

const RightContextMenu = ({ className, ...props }) => {
  const { ContextComponent, contextProps } = useContextComponent();

  return ContextComponent ? (
    <div className={className}>
      <ContextComponent {...props} {...(contextProps ?? {})} />
    </div>
  ) : (
    <StaticContent id="context-menu-right" className={className} />
  );
};

export const Menubar = ({ enabled, defaultOpened, defaultPinned, children, onSidebarToggle, onSidebarPin }) => {
  const menuDropdownRef = useRef();
  const useMenuRef = useRef();
  const { user, fetch, isInProgress } = useCurrentUser();
  const location = useFixedLocation();

  const config = useConfig();
  const [sidebarOpened, setSidebarOpened] = useState(defaultOpened ?? false);
  const [sidebarPinned, setSidebarPinned] = useState(defaultPinned ?? false);
  const [PageContext, setPageContext] = useState({
    Component: null,
    props: {},
  });

  const menubarClass = cn("menu-header");
  const menubarContext = menubarClass.elem("context");
  const sidebarClass = cn("sidebar");
  const contentClass = cn("content-wrapper");
  const contextItem = menubarClass.elem("context-item");
  const showNewsletterDot = !isDefined(user?.allow_newsletters);
  const menuList = cn("menu-list");
  const menuCollIcon = cn("menu-coll-icon");

  const sidebarPin = useCallback(
    (e) => {
      e.preventDefault();

      const newState = !sidebarPinned;

      setSidebarPinned(newState);
      onSidebarPin?.(newState);
    },
    [sidebarPinned],
  );

  const sidebarToggle = useCallback(
    (visible) => {
      const newState = visible;

      setSidebarOpened(newState);
      onSidebarToggle?.(newState);
    },
    [sidebarOpened],
  );

  const providerValue = useMemo(
    () => ({
      PageContext,

      setContext(ctx) {
        setTimeout(() => {
          setPageContext({
            ...PageContext,
            Component: ctx,
          });
        });
      },

      setProps(props) {
        setTimeout(() => {
          setPageContext({
            ...PageContext,
            props,
          });
        });
      },

      contextIsSet(ctx) {
        return PageContext.Component === ctx;
      },
    }),
    [PageContext],
  );

  useEffect(() => {
    if (!sidebarPinned) {
      menuDropdownRef?.current?.close();
    }
    useMenuRef?.current?.close();
  }, [location]);

  return (
    <div className={contentClass}>
      {enabled && (
        <div className={menubarClass}>
          <Dropdown.Trigger dropdown={menuDropdownRef} closeOnClickOutside={!sidebarPinned}>
            <div className={`${menubarClass.elem("trigger")} main-menu-trigger`}>
              <div >
                <svg t="1768213197333" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14296" width="20" height="20"><path d="M833.792 191.232c-69.376 0-126.208 57.6-126.208 128 0 12.8 0 19.2 6.336 32L512 466.432l-201.92-115.2c6.336-12.8 6.336-19.2 6.336-32 0-70.4-56.832-128-126.208-128-69.44 0-126.208 57.6-126.208 128s56.768 128 126.208 128c37.824 0 69.376-19.2 94.656-44.8l195.584 115.2v224c-56.768 12.8-94.656 64-94.656 121.6 0 70.4 56.768 128 126.208 128s126.208-57.6 126.208-128c0-57.6-37.888-108.8-94.656-121.6v-224l201.92-108.8c18.944 19.2 50.496 38.4 88.32 38.4 69.44 0 126.208-57.6 126.208-128s-56.768-128-126.208-128z m-643.584 192c-37.888 0-63.104-25.6-63.104-64s25.216-64 63.104-64c37.824 0 63.104 25.6 63.104 64s-25.28 64-63.104 64z m384.896 480c0 38.4-31.552 64-63.104 64-37.888 0-63.104-25.6-63.104-64s25.216-64 63.104-64 63.104 25.6 63.104 64z m258.688-480c-37.824 0-63.104-25.6-63.104-64s25.28-64 63.104-64c37.888 0 63.104 25.6 63.104 64s-31.552 64-63.104 64z" fill="#ed8d1d" p-id="14297"></path><path d="M164.928 511.232c-25.216 0-44.16-6.4-63.04-19.2v211.2c0 19.2 12.608 38.4 31.552 51.2l189.248 115.2v-6.4c0-19.2 6.336-38.4 12.608-57.6l-170.368-102.4v-192zM859.008 703.232l-170.304 96c6.272 19.2 12.608 38.4 12.608 57.6v6.4l189.248-115.2c18.944-12.8 31.616-32 31.616-51.2v-204.8c-18.944 6.4-44.16 12.8-63.168 19.2v192zM328.96 204.032L512 95.232l176.64 102.4c12.672-19.2 31.616-32 50.56-44.8L543.488 37.632c-18.944-6.4-44.16-6.4-63.104 0l-201.92 121.6c18.944 6.4 37.888 25.6 50.496 44.8z" fill="#ed8d1d" p-id="14298"></path></svg>
              海南空间数据标注平台</div>
              <Hamburger opened={sidebarOpened} />
            </div>
          </Dropdown.Trigger>

          <div className={menubarContext}>
            <LeftContextMenu className={contextItem.mod({ left: true })} />
            <RightContextMenu className={contextItem.mod({ right: true })} />
          </div>

          <div className={menubarClass.elem("hotkeys")}>
            <div className={menubarClass.elem("hotkeys-button")}>
              <Button
                variant="neutral"
                look="outlined"
                tooltip="键盘快捷键"
                data-testid="hotkeys-button"
                size="small"
                onClick={() => {
                  openHotkeyHelp([
                    "annotation",
                    "data_manager",
                    "regions",
                    "tools",
                    "audio",
                    "video",
                    "timeseries",
                    "image_gallery",
                  ]);
                }}
                icon={<BiSolidKeyboard />}
              />
            </div>
          </div>

          {/* {ff.isActive(ff.FF_THEME_TOGGLE) && <ThemeToggle />} */}

          <Dropdown.Trigger
            ref={useMenuRef}
            align="right"
            style={{right: 0, marginTop: '10px', display: 'flex', alignItems:'center', justifyContent: 'center',}}
            content={
              <div className={menuList}>
                  <a  href={pages.AccountSettingsPage.path} className={menuList.elem('item')}>
                    <div className={menuList.elem('icon')}>
                      <MdManageAccounts />
                    </div>
                    <span>账户设置</span>
                  </a>

                  <a href={absoluteURL("/logout")} data-external className={menuList.elem('item')}>
                    <div className={menuList.elem('icon')}>
                      <IoIosExit />
                    </div>
                    <span>退出登录</span>
                  </a>

                  {showNewsletterDot && (
                  <a href={pages.AccountSettingsPage.path} className={menuList.elem('item')}>
                    <div className={menuList.elem('icon')}>
                      <div className={menubarClass.elem("userpic-badge")} />
                      <FaBell />
                    </div>
                    <span>通知消息</span>
                  </a>
                  )}
                </div>
            }
          >
            <div title={user?.email} className={menubarClass.elem("user")}>
              <Userpic user={user} isInProgress={isInProgress} />
              {showNewsletterDot && <div className={menubarClass.elem("userpic-badge")} />}
            </div>
          </Dropdown.Trigger>
        </div>
      )}

        <div className={contentClass.elem("body")}>
          {enabled && (
            <Dropdown
              ref={menuDropdownRef}
              onToggle={sidebarToggle}
              onVisibilityChanged={() => window.dispatchEvent(new Event("resize"))}
              visible={sidebarOpened}
              className={[sidebarClass, sidebarClass.mod({ floating: !sidebarPinned })].join(" ")}
              style={{ width: 240 }}
            >
              <Menu>
                {isFF(FF_HOMEPAGE) && <Menu.Item label="首页" to="/" icon={<IconHome />} data-external exact />}
                <Menu.Item label="项目管理" to="/projects" icon={<IconFolder />} data-external exact />
                <Menu.Item label="团队设置" to="/organization" icon={<IconPersonInCircle />} data-external exact />
                <Menu.Item label="训练任务" to="/plans" icon={<IconList />} data-external exact />
                <Menu.Item label="训练结果" to="/trained-models" icon={<IconModel />} data-external exact />
                <Menu.Spacer />

                {/* <VersionNotifier showNewVersion /> */}

                {/* <Menu.Item */}
                {/*   label="API" */}
                {/*   href="https://api.labelstud.io/api-reference/introduction/getting-started" */}
                {/*   icon={<IconTerminal />} */}
                {/*   target="_blank" */}
                {/* /> */}
                {/* <Menu.Item label="Docs" href="https://labelstud.io/guide" icon={<IconBook />} target="_blank" /> */}
                {/* <Menu.Item */}
                {/*   label="GitHub" */}
                {/*   href="https://github.com/HumanSignal/label-studio" */}
                {/*   icon={<IconGithub />} */}
                {/*   target="_blank" */}
                {/*   rel="noreferrer" */}
                {/* /> */}
                {/* <Menu.Item */}
                {/*   label="Slack Community" */}
                {/*   href="https://slack.labelstud.io/?source=product-menu" */}
                {/*   icon={<IconSlack />} */}
                {/*   target="_blank" */}
                {/*   rel="noreferrer" */}
                {/* /> */}

                {/* <VersionNotifier showCurrentVersion /> */}

                {/* <Menu.Divider /> */}

                {/* <Menu.Item */}
                {/*   icon={<IconPin />} */}
                {/*   className={sidebarClass.elem("pin")} */}
                {/*   onClick={sidebarPin} */}
                {/*   active={sidebarPinned} */}
                {/* > */}
                {/*   {sidebarPinned ? "释放菜单" : "固定菜单"} */}
                {/* </Menu.Item> */}
                  {sidebarPinned ? <TbPinnedOff className={menuCollIcon} onClick={sidebarPin}/> : <TbPinnedFilled className={menuCollIcon} onClick={sidebarPin}/>}
              </Menu>
            </Dropdown>
          )}

          <MenubarContext.Provider value={providerValue}>
            <div className={contentClass.elem("content").mod({ withSidebar: sidebarPinned && sidebarOpened })}>
              {children}
            </div>
          </MenubarContext.Provider>
        </div>
    </div>
  );
};
