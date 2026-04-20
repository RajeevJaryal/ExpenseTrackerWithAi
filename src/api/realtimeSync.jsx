export const subscribeExpenses = (callback) => {
  const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL;
  const token = localStorage.getItem("token");
  const uid = localStorage.getItem("uid");

  if (!DB_URL || !token || !uid) {
    return () => {};
  }

  // User specific database path
  const url = `${DB_URL}/expenses/${uid}.json?auth=${token}`;

  // Firebase stream attempt
  let es;

  try {
    es = new EventSource(url + "&stream=true");
  } catch (error) {
    console.log("Streaming not supported");
  }

  // Poll fallback every 8 sec
  const poll = setInterval(async () => {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data) {
        const arr = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .reverse();

        callback(arr);
      } else {
        callback([]);
      }
    } catch (error) {
      console.log("Realtime sync failed");
    }
  }, 8000);

  // Cleanup
  return () => {
    clearInterval(poll);

    if (es) {
      es.close();
    }
  };
};