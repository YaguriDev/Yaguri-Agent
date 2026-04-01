type QueueItem<T> = {
  data: T;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};

export const createQueue = <T>(processor: (item: T) => Promise<any>) => {
  const items: QueueItem<T>[] = [];
  let processing = false;

  const processNext = async (): Promise<void> => {
    if (processing || items.length === 0) return;

    processing = true;
    const item = items.shift()!;

    try {
      const result = await processor(item.data);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      processing = false;
      if (items.length > 0) processNext();
    }
  };

  return {
    push: (data: T): Promise<any> =>
      new Promise((resolve, reject) => {
        items.push({ data, resolve, reject });
        processNext();
      }),

    get length() {
      return items.length;
    },
    get isProcessing() {
      return processing;
    },
  };
};
