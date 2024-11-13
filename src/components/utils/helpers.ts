import { Wallet, hexlify } from "ethers";
import { CATEGORY_NAMES_TO_ID_MAP, RESOURCE_IDS } from "./constants";
import { Signer, Utils, Data } from "@ethersphere/bee-js";

export function shortenTitle(title?: string, maxTitleLength?: number): string {
  let shortTitle = title || "No title";
  maxTitleLength = maxTitleLength || shortTitle.length;
  if (shortTitle.length > maxTitleLength) {
    shortTitle = shortTitle.substring(0, maxTitleLength) + "...";
  }
  return shortTitle;
}

// From "2022-10-11T15:30:00.000Z" to "15:30"
export function dateToTime(date?: string): string {
  if (!date) {
    return "";
  }
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const createMonogram = (name: string) => {
  const initials = name.split(" ").map((n) => n[0]);
  return initials.join("").toUpperCase();
};

export function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();

  const formatHM = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isSameDay(date, now)) {
    return formatHM(date);
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return `Yesterday ${formatHM(date)}`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${formatDate(date)} ${formatHM(date)}`;
  }

  return `${date.getFullYear()} ${formatDate(date)} ${formatHM(date)}`;
}

export function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
}

export function stringToBoolean(str: string | null): boolean {
  if (!str) {
    return false;
  }
  return str.toLowerCase() === "true";
}

export function booleanToString(val: boolean): string {
  return val ? "true" : "false";
}

// export function debounce(callback: () => void, delay: number) {
//   let timeoutId;
//   return function (...args) {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => {
//       callback.apply(this, args);
//     }, delay);
//   };
// }

export function randomThreadId() {
  const randomPart = Math.random().toString(36).substr(2, 9);
  const timestampPart = Date.now().toString(36);

  return `${timestampPart}-${randomPart}`;
}

export function textExtract(content: string): string {
  const modifiedContent = content.replace(/[\s\n]+/g, " ");

  if (modifiedContent.length > 34) {
    return modifiedContent.substring(0, 34) + "...";
  } else {
    return modifiedContent;
  }
}

export function getWallet(input: string): Wallet {
  const privateKey = Utils.keccak256Hash(input);
  return new Wallet(hexlify(privateKey));
}

export const getResourceId = (category: string) => {
  const categoryId = CATEGORY_NAMES_TO_ID_MAP.get(category);
  if (categoryId) {
    const result = RESOURCE_IDS.get(categoryId);
    if (result) {
      return result;
    } else {
      return "";
    }
  } else {
    return "";
  }
};

export function getSigner(wallet: Wallet): Signer {
  const signer: Signer = {
    address: Utils.hexToBytes(wallet.address.slice(2)),
    sign: async (data: Data) => {
      return await wallet.signMessage(data);
    },
  };
  return signer;
}

export const handleKeyDown = (
  e: React.KeyboardEvent,
  key: string,
  callback: () => void
) => {
  if (e.key === key) {
    callback();
  }
};

export function isEmpty(obj?: object) {
  if (!obj) {
    return true;
  }
  return Object.keys(obj).length === 0;
}

export const getPrivateKey = () => {
  const privKey = localStorage.getItem("privKey");
  if (privKey) {
    return privKey;
  } else {
    return "";
  }
};

export const isUserRegistered = () => {
  const privKey = getPrivateKey();
  const username = localStorage.getItem("username");
  if (
    privKey &&
    privKey.slice(2).length === 64 &&
    username &&
    username.length > 0
  )
    return true;
  else return false;
};
