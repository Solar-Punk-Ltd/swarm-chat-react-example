# Swarm Chat React Example ⚛️🐝💬

This project provides an example React application demonstrating real-time, decentralized chat functionality built on Swarm. It utilizes the following core components:

- **[Solar-Punk-Ltd/swarm-chat-js Library](https://github.com/Solar-Punk-Ltd/swarm-chat-js):** The client-side library that handles Swarm interactions for sending and receiving messages.
- **[Solar-Punk-Ltd/swarm-chat-aggregator-js](https://github.com/Solar-Punk-Ltd/swarm-chat-aggregator-js):** A required backend aggregator server that listens for user messages broadcast via GSOC and consolidates them into a shared chat feed.

This example showcases how to integrate `swarm-chat-js` into a React frontend to create a functional chat interface.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) (or npm)
- Access to one or more running Swarm Bee nodes:
  - One for the client application to connect to (swarm-chat-js).
  - One for the `swarm-chat-aggregator-js` to use. (These can be the same node for simple testing, but ideally are separate).
- A running instance of the **[Solar-Punk-Ltd/swarm-chat-aggregator-js](https://github.com/Solar-Punk-Ltd/swarm-chat-aggregator-js)**. This example application **will not function** without it.

---

## 🚀 Getting Started

Follow these steps to get the example application up and running:

### 1\. Clone the Repository

```bash
git clone https://github.com/Solar-Punk-Ltd/swarm-chat-react-example.git
cd swarm-chat-react-example
```

### 2\. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3\. Set Up the Aggregator

This React example **requires** a running `swarm-chat-aggregator-js` instance.

- Clone and set up the [swarm-chat-aggregator-js](https://github.com/Solar-Punk-Ltd/swarm-chat-aggregator-js) project according to its README.
- Ensure it's configured and running successfully.
- **Take note of the GSOC and Chat Feed details configured in your aggregator**, as you'll need them for the React app's configuration.

### 4\. Configure the React Example

This application uses environment variables for configuration. Create a `.env` file in the root of the `swarm-chat-react-example` project directory. You can copy the `.env.example` file if one is provided:

```bash
cp .env.example .env
```

Now, edit the `.env` file with the necessary values. These correspond to the `ChatSettings` required by the `swarm-chat-js` library:

```env
# .env

VITE_BEE_URL= Address of the node that will be used by swarm-chat-js
VITE_CHAT_STAMP = Stamp used to write to the chat

VITE_CHAT_OWNER= Public address of the feed written by the aggregator

VITE_CHAT_GSOC_RESOURCE_ID= Mined GSOC address
VITE_CHAT_GSOC_TOPIC= Topic used for the mined GSOC address


```

### 5\. Run the Application

Once configured, start the development server:

```bash
pnpm run dev
# or
npm run dev
```

---

## 🧐 Understanding the Code

The core integration with `swarm-chat-js` can typically be found in:

- A custom React hook (e.g., `src/hooks/useSwarmChat.ts` if you've structured it that way, similar to the example in the `swarm-chat-js` README).

The `ChatSettings` object, populated from the environment variables, is passed to the `SwarmChat` constructor from the `swarm-chat-js` library.

---

## 📌 Important Notes

- **Example Only:** This application is an _example_ to demonstrate functionality. It may lack features, robust error handling, or security measures found in a production application.
- **Aggregator Dependency:** This React app is only one part of the system. It relies on a correctly configured and running `swarm-chat-aggregator-js` instance.
- **Private Key Handling:** The method for handling keys in this example is for demonstration purposes. Secure private key management is critical for real applications.
- **Swarm Network:** Ensure your Bee nodes are properly connected to the Swarm network and have sufficient funds/postage stamps for operations.

---
