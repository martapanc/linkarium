export type FeatureFlags = {
  showWriteGuard: boolean;
  showLanguageSwitcher: boolean;
};

export function getFeatureFlags(): FeatureFlags {
  return {
    showWriteGuard: process.env.SHOW_WRITE_GUARD !== "false",
    showLanguageSwitcher: process.env.SHOW_LANGUAGE_SWITCHER !== "false",
  };
}
