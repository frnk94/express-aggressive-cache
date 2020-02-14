// Cache-Control for Civilians
// https://csswizardry.com/2019/03/cache-control-for-civilians/

export const shouldCache = (cacheControl: Record<string, any> | null) => {
  if (!cacheControl) return true;

  const noCache = cacheControl["no-cache"];
  const noStore = cacheControl["no-store"];
  const isPrivate = cacheControl["private"];
  const maxAge = cacheControl["max-age"];

  if (noCache || noStore || isPrivate || maxAge === 0) {
    return false;
  }

  return true;
};
