import { type FormEventHandler, useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Button, ToastType, useToast } from "@humansignal/ui";
import styles from "../AccountSettings.module.scss";
import { useCurrentUserAtom } from "@humansignal/core/lib/hooks/useCurrentUser";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core or ui
 */
import { Input } from "apps/labelstudio/src/components/Form/Elements";

export const PersonalInfo = () => {
  const toast = useToast();
  const { user, fetch: refetchUser, isInProgress: userInProgress, updateAsync: updateUser } = useCurrentUserAtom();
  const [isInProgress, setIsInProgress] = useState(false);
  const [fname, setFname] = useState(user?.first_name);
  const [lname, setLname] = useState(user?.last_name);
  const [phone, setPhone] = useState(user?.phone);

  const userFormSubmitHandler: FormEventHandler = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user) return;
      const body = new FormData(e.currentTarget as HTMLFormElement);
      const json = Object.fromEntries(body.entries());
      const response = await updateUser(json);

      refetchUser();
      if (!response?.$meta.ok) {
        toast?.show({ message: response?.response?.detail ?? "Error updating user", type: ToastType.error });
      }
    },
    [user?.id],
  );

  useEffect(() => {
    setIsInProgress(userInProgress);
  }, [userInProgress]);

  useEffect(() => {
    setFname(user?.first_name);
    setLname(user?.last_name);
    setPhone(user?.phone);
  }, [user]);

  return (
    <div className={styles.section} id="personal-info">
      <div className={styles.sectionContent}>
        <form onSubmit={userFormSubmitHandler} className={styles.sectionContent}>
          <div className={styles.flexRow}>
            <div className={styles.flex1}>
              <Input
                label="姓名"
                value={fname}
                onChange={(e: React.KeyboardEvent<HTMLInputElement>) => setFname(e.currentTarget.value)}
                name="first_name"
              />
            </div>
            <div className={styles.flex1}>
              <Input
                label="昵称"
                value={lname}
                onChange={(e: React.KeyboardEvent<HTMLInputElement>) => setLname(e.currentTarget.value)}
                name="last_name"
              />
            </div>
          </div>
          <div className={styles.flexRow}>
            <div className={styles.flex1}>
              <Input label="E-mail" type="email" readOnly={true} value={user?.email} />
            </div>
            <div className={styles.flex1}>
              <Input
                label="手机号码"
                type="phone"
                onChange={(e: React.KeyboardEvent<HTMLInputElement>) => setPhone(e.currentTarget.value)}
                value={phone}
                name="phone"
              />
            </div>
          </div>
          <div className={clsx(styles.flexRow, styles.flexEnd)}>
            <Button look="filled" style={{ width: 125 }} waiting={isInProgress}>
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
