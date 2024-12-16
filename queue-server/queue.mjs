export class Queue {
  constructor(waitTimeMs = 1000) {
    this.tasks = [];
    this.isProcessing = false;
    this.waitTimeMs = waitTimeMs; // Time to wait between tasks
  }

  enqueue(task) {
    if (typeof task !== "function") {
      throw new Error("Task must be a function that returns a Promise.");
    }
    this.tasks.push(task);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.tasks.length > 0) {
      const task = this.tasks.shift();
      if (task) {
        try {
          await task(); // Await the async task
        } catch (error) {
          console.error("Error executing task:", error);
        }
        await this.wait(this.waitTimeMs); // Wait specified time before continuing
      }
    }

    this.isProcessing = false;
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
