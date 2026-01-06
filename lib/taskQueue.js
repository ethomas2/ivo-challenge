class TaskQueue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.promises = [];
  }

  pushTask(task) {
    this.queue.push(task);
    this.#next();
  }

  async #next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    const task = this.queue.shift();
    this.running++;
    this.promises.push(
      (async () => {
        const res = await task();
        this.running--;
        this.#next();
        return res;
      })()
    );
  }

  async all() {
    while (this.running !== 0 || this.queue.length !== 0) {
      await Promise.all(this.promises);
    }
    return await Promise.all(this.promises);
  }
}

exports.TaskQueue = TaskQueue;
