export const createMonogram = (name: string) => {
  const initials = name.split(" ").map((n) => n[0]);
  return initials.join("").toUpperCase();
};
