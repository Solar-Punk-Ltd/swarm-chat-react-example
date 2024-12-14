import { ErrorObject } from "./types";

export class AsyncQueue {
  private waitable;
  private clearWaitTime;
  private isProcessing = false;
  private isWaiting = false;
  private queue: ((index?: string) => Promise<void>)[] = [];

  private handleError: (errObject: ErrorObject) => void;

  constructor(
    settings: {
      waitable?: boolean;
      clearWaitTime?: number;
    } = {},
    handleError: (errObject: ErrorObject) => void
  ) {
    this.waitable = settings.waitable || false;
    this.clearWaitTime = settings.clearWaitTime || 100;
    this.handleError = handleError;
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const promise = this.queue.shift()!;
      const action = () => promise();

      if (this.waitable) {
        try {
          await action();
        } catch (error) {
          this.handleError({
            error: error as unknown as Error,
            context: "Error processing promise",
            throw: false,
          });
        }
      } else {
        action()
          .then(() => {})
          .catch((error) => {
            this.handleError({
              error: error as unknown as Error,
              context: "Error processing promise",
              throw: false,
            });
          });
      }
    }

    this.isProcessing = false;
  }

  enqueue(promiseFunction: () => Promise<any>) {
    this.queue.push(promiseFunction);
    this.processQueue();
  }

  async clearQueue() {
    this.queue = [];
    while (this.isProcessing) {
      await this.sleep(this.clearWaitTime);
    }
  }

  async waitForProcessing() {
    if (this.isWaiting) return true;

    this.isWaiting = true;

    while (this.isProcessing) {
      await this.sleep(this.clearWaitTime);
    }

    this.isWaiting = false;
    return false;
  }

  sleep(delay: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }
}
