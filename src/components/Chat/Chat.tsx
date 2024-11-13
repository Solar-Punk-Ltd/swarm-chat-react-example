import React, { useEffect, useRef, useState } from "react";
import "./Chat.scss";
import { EthAddress, EVENTS, MessageData, SwarmChat } from "../../libs";
import NavigationFooter from "../../components/NavigationFooter/NavigationFooter";
import ChatInput from "../../components/ChatInput/ChatInput";
import { Wallet } from "ethers";
import { BatchId } from "@ethersphere/bee-js";
import { LikeMessage, MessageWithThread, ThreadId } from "../types/message";
import InputLoading from "../../components/ChatInput/InputLoading/InputLoading";
import ChatHeader from "../../components/ChatHeader/ChatHeader";
import NavigationHeader from "../../components/NavigationHeader/NavigationHeader";
import FilteredMessages from "../../components/FilteredMessages/FilteredMessages";
import { MINUTE } from "../../libs/constants";

interface ChatProps {
  title: string | undefined;
  topic: string;
  wallet: Wallet;
  stamp: BatchId;
  nickname: string;
  gsocResourceId: string;
  gateway?: string;
  topMenuColor?: string;
  activeNumber?: number;
  backAction: () => void | undefined | null;
}

const Chat: React.FC<ChatProps> = ({
  title,
  topic,
  wallet,
  stamp,
  nickname,
  gsocResourceId,
  gateway,
  activeNumber,
  backAction,
}) => {
  const chat = useRef<SwarmChat | null>(null);
  const keepMeAlive = useRef<NodeJS.Timer | null>(null);
  /*   const currentThreadRef = useRef(currentThread); */

  const [allMessages, setAllMessages] = useState<MessageData[]>([]);
  const [beingSentMessages, setBeingSentMessages] = useState<
    MessageWithThread[]
  >([]);
  const [visibleMessages, setVisibleMessages] = useState<MessageWithThread[]>(
    []
  );
  const [currentThread, setCurrentThread] = useState<ThreadId | null>(null);
  const [chatLoaded, setChatLoaded] = useState<boolean>(false);

  const ownAddress = wallet.address as EthAddress;
  const modal = true;
  // Now that we have 'title', we could calculate 'topic' here. Only problem is that it might be undefined.

  const resendStuckMessages = async () => {
    if (!topic) return;
    const beingSentThreshold = 1 * MINUTE;
    const now = Date.now();
    const messagesOlderThanThreshold = beingSentMessages.filter(
      (msg) => msg.timestamp < now - beingSentThreshold
    );

    for (let i = 0; i < messagesOlderThanThreshold.length; i++) {
      const newlyConstructedMessage: MessageData = {
        address: messagesOlderThanThreshold[i].address,
        username: messagesOlderThanThreshold[i].username,
        message: JSON.stringify({
          text: messagesOlderThanThreshold[i].message,
          threadId: messagesOlderThanThreshold[i].threadId,
          messageId: messagesOlderThanThreshold[i].messageId,
          parent: messagesOlderThanThreshold[i].parent,
        }),
        timestamp: messagesOlderThanThreshold[i].timestamp,
      };
      try {
        console.info("Resending message: ", newlyConstructedMessage);
        const sResult = await chat.current?.sendMessage(
          ownAddress,
          topic,
          newlyConstructedMessage,
          stamp,
          wallet.privateKey
        );
        console.log("sResult ", sResult);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  // useEffect(() => {
  //   resendStuckMessages();

  //   const messageIds = allMessages.map(
  //     (msg) => (msg.message as unknown as MessageWithThread).messageId
  //   );
  //   const newBeingSent = beingSentMessages.filter(
  //     (message) => !messageIds.includes(message.messageId)
  //   );
  //   setBeingSentMessages(newBeingSent);
  // }, [allMessages]);

  // useEffect(() => {
  //   const finalMessages = filterMessages(allMessages);
  //   setVisibleMessages([...finalMessages, ...beingSentMessages]);
  // }, [allMessages, beingSentMessages]);

  const filterMessages = (data: MessageData[]): MessageWithThread[] => {
    const threadCapableMessages: MessageWithThread[] = [];
    for (let i = 0; i < data.length; i++) {
      let msgObj: any;
      try {
        msgObj = data[i].message as unknown as MessageWithThread | LikeMessage;
        console.log(`msgObj: ${msgObj}`);
      } catch (error) {
        console.log(`error parsing message: ${data[i].message}:\n ${error}`);
        return [];
      }
      const address = data[i].address;

      if (typeof msgObj === "string") {
        const likeObj = JSON.parse(msgObj);
        const likedIndex = threadCapableMessages.findIndex(
          (msg) => msg.messageId === likeObj.like
        );
        if (likedIndex === -1) {
          console.warn("This thread does not exist (will not add like)");
        } else {
          threadCapableMessages[likedIndex].likeTable[address] = true;
        }
      } else {
        threadCapableMessages.push({
          username: data[i].username,
          address: data[i].address,
          timestamp: data[i].timestamp,
          message: msgObj.text || "",
          threadId: msgObj.threadId,
          messageId: msgObj.messageId,
          parent: msgObj.parent,
          replyCount: 0,
          likeTable: {},
          flagged: msgObj.flagged,
        });

        if (msgObj.parent) {
          const parentIndex = threadCapableMessages.findIndex(
            (msg) => msg.threadId === msgObj.parent
          );
          if (parentIndex === -1) {
            console.warn(
              "This thread does not exist (will not increase replyCount)"
            );
          } else {
            threadCapableMessages[parentIndex].replyCount++;
          }
        }
      }
    }

    let filteredMessages = [];
    // if (currentThreadRef.current) {
    //   filteredMessages = threadCapableMessages.filter(
    //     (msg) =>
    //       msg.parent === currentThreadRef.current ||
    //       msg.threadId === currentThreadRef.current
    //   );
    // } else {
    //   filteredMessages = threadCapableMessages.filter(
    //     (msg) => msg.parent === null
    //   );
    // }

    // const withoutDuplicates = Array.from(
    //   new Map(filteredMessages.map((item) => [item.messageId, item])).values()
    // );

    return [];
  };

  useEffect(() => {
    if (!chat.current) {
      const newChat = new SwarmChat({
        gsocResourceId,
        url: "http://65.108.40.58:1733",
        gateway: gateway || process.env.GATEWAY,
        logLevel: "error",
        usersFeedTimeout: 5000,
        messageCheckInterval: 1600,
        messageFetchMin: 1600,
      });
      chat.current = newChat;

      newChat.listenToNewSubscribers(topic, stamp, gsocResourceId);
      keepMeAlive.current = setInterval(() => {
        newChat.keepMeRegistered(topic, {
          address: wallet.address as EthAddress,
          stamp,
          nick: nickname,
          key: wallet.privateKey,
        });
      }, 10000);

      setChatLoaded(true);
    }

    return () => {
      console.info("Chat cleanup...", chat.current);
      clearInterval(keepMeAlive.current as NodeJS.Timer);
      keepMeAlive.current = null;
      chat.current?.stopMessageFetchProcess();
      chat.current = null;
      console.info("Chat cleanup done.");
    };
  }, []);

  // useEffect(() => {
  //   setVisibleMessages([]);
  //   setBeingSentMessages([]);
  //   currentThreadRef.current = currentThread;
  //   const newlyFilteredMessages = filterMessages(allMessages);

  //   setVisibleMessages([...newlyFilteredMessages]);
  // }, [currentThread]);

  if (!topic) {
    return (
      <div className="chat-page-error">
        Topic is undefined
        <NavigationFooter />
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <NavigationHeader
          backgroundColor="#F1F2F4"
          to={"/"}
          saveQuestionBeforeLeave={true}
          handlerInCaseOfSave={
            currentThread ? () => setCurrentThread(null) : backAction
          }
        />
        <ChatHeader category={title} activeVisitors={activeNumber} />
      </div>

      {chatLoaded ? (
        <>
          <FilteredMessages
            filterFunction={(message: MessageWithThread) =>
              message.flagged !== true
            }
            filteringEnabled={false}
            messages={visibleMessages}
            nickname={nickname}
            ownAddress={ownAddress}
            chat={chat.current}
            topic={topic}
            stamp={stamp}
            privKey={wallet.privateKey}
            currentThread={currentThread}
            setThreadId={setCurrentThread}
            key={`${currentThread}-${allMessages.length}`}
          />

          <ChatInput
            chat={chat.current}
            ownAddress={ownAddress}
            nickname={nickname}
            topic={topic}
            stamp={stamp}
            privKey={wallet.privateKey}
            currentThread={currentThread}
            setBeingSentMessages={setBeingSentMessages}
            key={topic}
          />
        </>
      ) : (
        <div className="chat-page__loading">
          <div className="chat-page__loading__container">
            <InputLoading />
            <p>Loading chat...</p>
          </div>
        </div>
      )}

      {!modal && <NavigationFooter />}
    </div>
  );
};

export default Chat;
