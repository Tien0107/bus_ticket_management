import { PAGE_SIZE, toNumber } from "./chatUtils";

export const normalizeSearchValue = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const getField = (source, keys) => {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  const entries = Object.entries(source);
  for (const key of keys) {
    const matchedEntry = entries.find(
      ([entryKey, entryValue]) =>
        entryKey.toLowerCase() === key.toLowerCase() &&
        entryValue !== undefined &&
        entryValue !== null &&
        entryValue !== ""
    );

    if (matchedEntry) return matchedEntry[1];
  }

  return undefined;
};

const toRoleString = (value) => {
  if (value && typeof value === "object") {
    return toRoleString(firstValue(value.name, value.code, value.value, value.role));
  }

  return value === undefined || value === null ? "" : String(value).trim();
};

export const normalizeRoleValue = (value) =>
  toRoleString(value).replace(/[\s-]+/g, "_").toLowerCase();

const SEARCHABLE_CHAT_ROLES = new Set(["operator", "driver", "customer"]);

const uniqueQueryParams = (queries) => {
  const seen = new Set();

  return queries.filter((query) => {
    const normalizedEntries = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
    const key = JSON.stringify(normalizedEntries);

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getChatRecipientSearchQueries = (keyword = "") => {
  const value = String(keyword || "").trim();
  if (!value) return [];

  const queries = [];
  const base = { limit: PAGE_SIZE };
  const activeBase = { status: "active", limit: PAGE_SIZE };
  const normalizedRole = normalizeRoleValue(value);
  const digitsOnly = value.replace(/\D/g, "");
  const phoneVariants = new Set();
  const searchableRoles = Array.from(SEARCHABLE_CHAT_ROLES);

  const pushSearchVariants = (params) => {
    queries.push({ ...activeBase, ...params });
    queries.push({ ...base, ...params });

    searchableRoles.forEach((role) => {
      queries.push({ ...activeBase, role, ...params });
      queries.push({ ...base, role, ...params });
    });
  };

  if (SEARCHABLE_CHAT_ROLES.has(normalizedRole)) {
    queries.push({ ...activeBase, role: normalizedRole });
    queries.push({ ...base, role: normalizedRole });
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    pushSearchVariants({ email: value });
  }

  if (/^\d{10,13}$/.test(digitsOnly)) {
    phoneVariants.add(digitsOnly);

    if (digitsOnly.startsWith("84") && digitsOnly.length >= 11) {
      phoneVariants.add(`0${digitsOnly.slice(2)}`);
    }

    phoneVariants.forEach((phone) => {
      pushSearchVariants({ phone });
    });
  }

  return uniqueQueryParams(queries);
};

const normalizeStaffProfileRole = (value) => {
  const normalized = normalizeRoleValue(value);
  const aliases = {
    admin: "company_admin",
    companyadmin: "company_admin",
    company_admin: "company_admin",
    operator_admin: "company_admin",
    operatoradmin: "company_admin",
    dispatcher: "dispatcher",
    dispacher: "dispatcher",
    operator_dispatcher: "dispatcher",
    operatordispatcher: "dispatcher",
    operator_dispacher: "dispatcher",
    operatordispacher: "dispatcher",
    support: "support",
    suport: "support",
    company_support: "support",
    company_suport: "support",
    operator_support: "support",
    operator_suport: "support",
  };

  return aliases[normalized] || normalized;
};

const getCompanyIdFromProfile = (profile = {}) =>
  firstValue(
    getField(profile, [
      "companyId",
      "company_id",
      "companyID",
      "driverCompanyId",
      "driver_company_id",
      "operatorCompanyId",
      "operator_company_id",
    ]),
    getField(getField(profile, ["company"]), ["id", "_id", "companyId"])
  );

const getUserCompanyId = (user = {}) => {
  const account = getField(user, ["user", "account"]);
  const staffProfile = firstValue(
    getField(user, ["staffProfile", "staff_profile", "staffprofile"]),
    getField(account, ["staffProfile", "staff_profile", "staffprofile"])
  );
  const operatorProfile = firstValue(
    getField(user, ["operatorProfile", "operator_profile", "operatorprofile"]),
    getField(account, ["operatorProfile", "operator_profile", "operatorprofile"])
  );
  const driverProfile = firstValue(
    getField(user, ["driverProfile", "driver_profile", "driverprofile"]),
    getField(account, ["driverProfile", "driver_profile", "driverprofile"])
  );

  return toNumber(
    firstValue(
      getCompanyIdFromProfile(user),
      getCompanyIdFromProfile(account),
      getCompanyIdFromProfile(staffProfile),
      getCompanyIdFromProfile(operatorProfile),
      getCompanyIdFromProfile(driverProfile)
    )
  );
};

export const normalizeUser = (user = {}) => {
  const account = getField(user, ["user", "account"]);
  const staffProfile = firstValue(
    getField(user, ["staffProfile", "staff_profile", "staffprofile"]),
    getField(account, ["staffProfile", "staff_profile", "staffprofile"])
  );
  const operatorProfile = firstValue(
    getField(user, ["operatorProfile", "operator_profile", "operatorprofile"]),
    getField(account, ["operatorProfile", "operator_profile", "operatorprofile"])
  );
  const id = toNumber(
    firstValue(
      getField(user, ["id", "userId", "user_id", "accountId", "account_id"]),
      getField(account, ["id", "userId", "user_id", "accountId", "account_id"])
    )
  );
  const role = normalizeRoleValue(
    firstValue(
      getField(user, ["role", "userRole", "user_role", "accountRole", "account_role"]),
      getField(account, ["role", "userRole", "user_role", "accountRole", "account_role"])
    )
  );
  const staffProfileRole = normalizeStaffProfileRole(
    firstValue(
      getField(user, [
        "staffProfileRole",
        "staff_profile_role",
        "staffprofileRole",
        "staffprofilerole",
        "staffRole",
        "profileRole",
        "roleProfile",
        "operatorRole",
        "operatorProfileRole",
      ]),
      getField(staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffprofilerole", "staffRole"]),
      getField(operatorProfile, ["role", "staffProfileRole", "staff_profile_role", "staffprofilerole", "staffRole"]),
      getField(account, ["staffProfileRole", "staff_profile_role", "staffprofilerole", "staffRole"]),
      getField(getField(account, ["staffProfile", "staff_profile", "staffprofile"]), [
        "role",
        "staffProfileRole",
        "staff_profile_role",
        "staffprofilerole",
        "staffRole",
      ])
    )
  );

  return {
    ...user,
    id,
    fullName:
      firstValue(
        getField(user, ["fullName", "full_name", "name", "username"]),
        getField(account, ["fullName", "full_name", "name", "username"])
      ) || `Người dùng #${id || getField(user, ["id", "userId", "user_id"]) || ""}`,
    email: firstValue(getField(user, ["email"]), getField(account, ["email"])) || "",
    phone:
      firstValue(
        getField(user, ["phone", "phoneNumber", "phone_number", "mobile"]),
        getField(account, ["phone", "phoneNumber", "phone_number", "mobile"])
      ) || "",
    role,
    staffProfileRole,
    companyId: getUserCompanyId(user),
    status: firstValue(getField(user, ["status"]), getField(account, ["status"])) || "",
    username: firstValue(getField(user, ["username"]), getField(account, ["username"])) || "",
  };
};

export const mergeUniqueUsers = (users = []) => {
  const seen = new Set();

  return users.filter((user) => {
    const key = String(user.id);
    if (!user.id || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export const normalizeUsersResponse = (data, viewerId) => {
  const users = Array.isArray(data?.users)
    ? data.users
    : Array.isArray(data?.data?.users)
    ? data.data.users
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data?.items)
    ? data.data.items
    : Array.isArray(data?.accounts)
    ? data.accounts
    : Array.isArray(data?.data?.accounts)
    ? data.data.accounts
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return {
    users: users
      .map(normalizeUser)
      .filter(
        (user) =>
          user.id &&
          Number(user.id) !== Number(viewerId) &&
          normalizeRoleValue(user.role) !== "super_admin"
      ),
    next: data?.next ?? data?.data?.next ?? null,
  };
};
