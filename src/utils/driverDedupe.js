const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

const getDriverDedupeKey = (driver = {}, index = 0) => {
  const phone = normalizePhone(driver.phone || driver.phoneNumber || driver.phone_number);
  if (phone) return `phone:${phone}`;

  const email = String(driver.email || "").trim().toLowerCase();
  if (email) return `email:${email}`;

  const id = driver.userId ?? driver.user_id ?? driver.id;
  if (id !== undefined && id !== null && id !== "") return `id:${id}`;

  return `row:${index}`;
};

const getDriverScore = (driver = {}) =>
  Number(driver.completedTripCount || 0) + Number(driver.cancelledTripCount || 0);

export const dedupeDriversByContact = (drivers = []) => {
  const uniqueMap = new Map();

  drivers.forEach((driver, index) => {
    const key = getDriverDedupeKey(driver, index);
    const current = uniqueMap.get(key);

    if (!current || getDriverScore(driver) > getDriverScore(current)) {
      uniqueMap.set(key, driver);
    }
  });

  return Array.from(uniqueMap.values());
};
