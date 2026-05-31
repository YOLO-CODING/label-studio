import { Callout, CalloutContent, CalloutHeader, CalloutIcon, CalloutTitle } from "@humansignal/ui/lib/callout/callout";
import { IconWarning } from "@humansignal/icons";
import { atomWithMutation, atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { useAtomValue } from "jotai";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useCopyText } from "@humansignal/core";
import styles from "./PersonalJWTToken.module.scss";
import { Button } from "@humansignal/ui";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { API } from "apps/labelstudio/src/providers/ApiProvider";
import { modal, confirm } from "apps/labelstudio/src/components/Modal/Modal";
import { Input, Label } from "apps/labelstudio/src/components/Form/Elements";
import { Tooltip } from "@humansignal/ui";

type Token = {
  token: string;
  expires_at: string;
};

const ACCESS_TOKENS_QUERY_KEY = ["access-tokens"];

// list all existing API tokens
const tokensListAtom = atomWithQuery(() => ({
  queryKey: ACCESS_TOKENS_QUERY_KEY,
  async queryFn() {
    const tokens = await API.invoke("accessTokenList");
    if (!tokens.$meta.ok) {
      console.error(token.error);
      return [];
    }

    return tokens as Token[];
  },
}));

// despite the name, gets user's access token
const refreshTokenAtom = atomWithMutation((get) => {
  const queryClient = get(queryClientAtom);
  return {
    mutationKey: ["refresh-token"],
    async mutationFn() {
      const token = await API.invoke("accessTokenGetRefreshToken");
      if (!token.$meta.ok) {
        console.error(token.error);
        return "";
      }
      return token.token;
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: ACCESS_TOKENS_QUERY_KEY });
    },
  };
});

const revokeTokenAtom = atomWithMutation((get) => {
  const queryClient = get(queryClientAtom);
  return {
    mutationKey: ["revoke"],
    async mutationFn({ token }: { token: string }) {
      await API.invoke("accessTokenRevoke", null, {
        params: {},
        body: {
          refresh: token,
        },
      });
    },
    // Optimistic update
    async onMutate({ token }: { token: string }) {
      // Cancel all ongoing queries so we can override the data they hold
      await queryClient.cancelQueries({ queryKey: ACCESS_TOKENS_QUERY_KEY });
      // Getting currently cached data of a specific query
      const previousTokens = queryClient.getQueryData(ACCESS_TOKENS_QUERY_KEY) as Token[];
      // We need to keep everything but one token that we just deleted
      const filtered = previousTokens.filter((t) => t.token !== token);
      // We now optimistically override data inside the query
      queryClient.setQueryData(ACCESS_TOKENS_QUERY_KEY, (old: Token[]) => filtered as Token[]);
      return { previousTokens };
    },
    onError: (err, newTodo, context) => {
      // If error, reset query to its previous state (without changes from `onMutate`)
      queryClient.setQueryData(ACCESS_TOKENS_QUERY_KEY, context?.previousTokens);
    },
    onSettled() {
      // Reload query from remote if deletion went ok
      queryClient.invalidateQueries({
        queryKey: ACCESS_TOKENS_QUERY_KEY,
      });
    },
  };
});

export function PersonalJWTToken() {
  const [dialogOpened, setDialogOpened] = useState(false);
  const tokens = useAtomValue(tokensListAtom);
  const revokeToken = useAtomValue(revokeTokenAtom);
  const createToken = useAtomValue(refreshTokenAtom);
  const queryClient = useAtomValue(queryClientAtom);

  const tokensListClassName = clsx({
    [styles.tokensList]: tokens.data && tokens.data.length,
  });

  const revoke = useCallback(
    async (token: string) => {
      confirm({
        // title: "Revoke Token",
        // body: `Are you sure you want to delete this access token? Any application using this token will need a new token to be able to access ${
        //   window?.APP_SETTINGS?.app_name || "Label Studio"
        // }`,
        // okText: "Revoke",
        buttonLook: "negative",
        title: "撤销令牌",
        body: `确定要删除此访问令牌吗？使用此令牌的任何应用程序都需要新令牌才能访问${
          window?.APP_SETTINGS?.app_name || ""
        }`,
        okText: "撤销",
        onOk: async () => {
          await revokeToken.mutateAsync({ token });
        },
      });
    },
    [revokeToken],
  );

  const disallowAddingTokens = useMemo(() => {
    return createToken.isPending || tokens.isLoading || (tokens.data?.length ?? 0) > 0;
  }, [createToken.isPending, tokens.isLoading, tokens.data]);

  function openDialog() {
    if (dialogOpened) return;
    setDialogOpened(true);
    modal({
      visible: true,
      // title: "New Auth Token",
      title: "新认证令牌",
      style: { width: 680 },
      body: CreateTokenForm,
      closeOnClickOutside: false,
      onHidden: () => {
        setDialogOpened(false);
        queryClient.invalidateQueries({ queryKey: ACCESS_TOKENS_QUERY_KEY });
      },
    });
  }

  return (
    <div className={styles.personalAccessToken}>
      <div className={tokensListClassName}>
        {tokens.isLoading ? (
          <div>loading...</div>
        ) : tokens.isSuccess && tokens.data && tokens.data.length ? (
          <div>
            <Label text="访问令牌" className={styles.label} />
            <div className="flex flex-col gap-2">
              {tokens.data.map((token, index) => {
                return (
                  <div key={`${token.expires_at}${index}`} className={styles.token}>
                    <div className={styles.tokenWrapper}>
                      <div className={styles.expirationDate}>
                        {/* {token.expires_at */}
                        {/*   ? `Expires on ${format(new Date(token.expires_at), "MMM dd, yyyy HH:mm")}` */}
                        {/*   : "Personal access token"} */}
                        {token.expires_at
                          ? `有效期至 ${format(new Date(token.expires_at),'yyyy/MM/dd HH:mm:ss')}`
                          : "个人访问令牌"}
                      </div>
                      <div className={styles.tokenString}>{token.token}</div>
                    </div>
                    <Button variant="negative" look="outlined" onClick={() => revoke(token.token)}>
                      撤销
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : tokens.isError ? (
          // {/* <div>Unable to load tokens list</div> */}
          <div>无法加载令牌列表</div>
        ) : null}
      </div>
      <Tooltip title="每人只能生成一个令牌" disabled={!disallowAddingTokens}>
        <div style={{ width: "max-content" }}>
          <Button disabled={disallowAddingTokens || dialogOpened} onClick={openDialog}>
            生成新令牌
          </Button>
        </div>
      </Tooltip>
    </div>
  );
}

function CreateTokenForm() {
  const { data, mutate: createToken } = useAtomValue(refreshTokenAtom);
  const [copy, copied] = useCopyText({ defaultText: data ?? "" });

  useEffect(() => {
    createToken();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p>复制您的新访问令牌并妥善保管。 </p>
      {/* <p>Copy your new access token from below and keep it secure. </p> */}

      <div className="flex items-end w-full gap-2">
        <Input
          label="访问令牌"
          labelProps={{ className: "flex-1", rawClassName: "flex-1" }}
          className="w-full"
          readOnly
          value={data}
        />
        <Button onClick={() => copy()} disabled={copied} variant="neutral" look="outlined">
          {/* {copied ? "Copied!" : "Copy"} */}
          {copied ? "已复制！" : "复制"}
        </Button>
      </div>

      {data?.expires_at && (
        <div>
          <Label text="令牌过期时间" />
          {data && format(new Date(data?.expires_at), "yyyy/MM/dd HH:mm:ss")}
        </div>
      )}

      <Callout variant="warning">
        <CalloutHeader>
          <CalloutIcon>
            <IconWarning />
          </CalloutIcon>
          {/* <CalloutTitle>Manage your access tokens securely</CalloutTitle> */}
          <CalloutTitle>安全管理您的访问令牌</CalloutTitle>
        </CalloutHeader>
        <CalloutContent>
            请勿将此密钥分享给任何人。如果您怀疑任何密钥已被泄露，应立即撤销并创建新密钥。
          {/* Do not share this key with anyone. If you suspect any keys have been compromised, you should revoke them and */}
          {/* create new ones. */}
        </CalloutContent>
      </Callout>
    </div>
  );
}
