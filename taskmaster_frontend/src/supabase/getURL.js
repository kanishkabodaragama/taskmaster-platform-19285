export const getURL = () => {
  let url = process.env.REACT_APP_SITE_URL || window?.location?.origin || 'http://localhost:3000';

  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  if (!url.endsWith('/')) {
    url = `${url}/`;
  }
  return url;
};
