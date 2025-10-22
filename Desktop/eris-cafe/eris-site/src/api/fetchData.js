export async function fetchData(endpoint, params = {}) {
  const url = new URL(endpoint);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY,
      'x-rapidapi-host': url.hostname,
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}