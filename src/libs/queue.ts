type Task = () => void;

export class Queue {
  private tasks: Task[] = [];
  private isProcessing: boolean = false;

  enqueue(task: Task): void {
    this.tasks.push(task);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.tasks.length > 0) {
      const task = this.tasks.shift();
      if (task) {
        task();
      }
    }

    this.isProcessing = false;
  }
}
