function getEnv(name: string): string {
  const value = import.meta.env[name as keyof ImportMetaEnv];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const config = {
  beeUrl: getEnv("VITE_BEE_URL"),
  chatOwner: getEnv("VITE_CHAT_OWNER"),
  chatGsocResourceId: getEnv("VITE_CHAT_GSOC_RESOURCE_ID"),
  chatGsocTopic: getEnv("VITE_CHAT_GSOC_TOPIC"),
};
