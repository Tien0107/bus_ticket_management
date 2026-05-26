import { jwtDecode } from "jwt-decode";

export const MIN_LOGIN_LOADING_MS = 2000;

export const waitForLoginLoading = (startedAt = Date.now()) =>
  new Promise((resolve) => {
    const elapsed = Date.now() - startedAt;
    window.setTimeout(resolve, Math.max(0, MIN_LOGIN_LOADING_MS - elapsed));
  });

export const firstValue = (...values) =>
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

    if (matchedEntry) {
      return matchedEntry[1];
    }
  }

  return undefined;
};

const toAuthString = (value) => {
  if (value && typeof value === "object") {
    return toAuthString(firstValue(value.name, value.code, value.value, value.role));
  }

  return value === undefined || value === null ? "" : String(value).trim();
};

export const normalizeRole = (value) => toAuthString(value).replace(/[\s-]+/g, "_").toLowerCase();

const normalizeStaffProfileRole = (value) => {
  const normalized = normalizeRole(value);

  const aliases = {
    admin: "company_admin",
    companyadmin: "company_admin",
    company_admin: "company_admin",
    operator_admin: "company_admin",
    operatoradmin: "company_admin",
    dispatcher: "dispatcher",
    operator_dispatcher: "dispatcher",
    operatordispatcher: "dispatcher",
    support: "support",
    company_support: "support",
    operator_support: "support",
    company_admin_support: "support",
  };

  return aliases[normalized] || normalized;
};

const getRoleValue = (source) =>
  firstValue(
    getField(source, ["role", "userRole", "accountRole"]),
    getField(source?.user, ["role", "userRole", "accountRole"]),
    getField(source?.data, ["role", "userRole", "accountRole"]),
    getField(source?.account, ["role", "userRole", "accountRole"])
  );

const getStaffProfileRoleValue = (source) =>
  firstValue(
    getField(source, [
      "staffProfileRole",
      "staff_profile_role",
      "staffRole",
      "profileRole",
      "roleProfile",
      "operatorRole",
      "operatorProfileRole",
    ]),
    getField(source?.staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.staff_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.operatorProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.operator_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.user, ["staffProfileRole", "staff_profile_role", "staffRole", "profileRole", "roleProfile"]),
    getField(source?.user?.staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.user?.staff_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.data, ["staffProfileRole", "staff_profile_role", "staffRole", "profileRole", "roleProfile"]),
    getField(source?.data?.user, ["staffProfileRole", "staff_profile_role", "staffRole", "profileRole", "roleProfile"]),
    getField(source?.data?.user?.staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.data?.user?.staff_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"])
  );

const getCompanyIdValue = (source) =>
  firstValue(
    getField(source, ["companyId", "company_id", "driverCompanyId", "driver_company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.user, ["companyId", "company_id", "driverCompanyId", "driver_company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.data, ["companyId", "company_id", "driverCompanyId", "driver_company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.data?.user, ["companyId", "company_id", "driverCompanyId", "driver_company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.driverProfile, ["companyId", "company_id", "driverCompanyId", "driver_company_id"]),
    getField(source?.driver_profile, ["companyId", "company_id", "driverCompanyId", "driver_company_id"]),
    getField(source?.operatorProfile, ["companyId", "company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.operator_profile, ["companyId", "company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.staffProfile, ["companyId", "company_id", "operatorCompanyId", "operator_company_id"]),
    getField(source?.staff_profile, ["companyId", "company_id", "operatorCompanyId", "operator_company_id"])
  );

export const mergeAuthClaims = (user, source) => {
  if (!source || typeof source !== "object") return user;

  const role = getRoleValue(source);
  const staffProfileRole = getStaffProfileRoleValue(source);
  const companyId = getCompanyIdValue(source);

  if (role) user.role = normalizeRole(role);
  if (staffProfileRole) user.staffProfileRole = normalizeStaffProfileRole(staffProfileRole);
  if (companyId !== undefined) user.companyId = companyId;
  if (source.accountStripeId !== undefined) user.accountStripeId = source.accountStripeId;
  if (source.account_stripe_id !== undefined) user.accountStripeId = source.account_stripe_id;
  if (source.stripeAccountId !== undefined) user.accountStripeId = source.stripeAccountId;
  if (source.stripe_account_id !== undefined) user.accountStripeId = source.stripe_account_id;
  if (source.email && !user.email) user.email = source.email;
  if (source.phone && !user.phone) user.phone = source.phone;
  if (source.fullName && !user.fullName) user.fullName = source.fullName;
  if (source.full_name && !user.fullName) user.fullName = source.full_name;

  return user;
};

export const buildAuthenticatedUser = (data) => {
  const token = firstValue(data?.token, data?.accessToken, data?.data?.token, data?.data?.accessToken);
  const userPayload = firstValue(data?.user, data?.data?.user, data?.profile, data?.data?.profile);
  let user = userPayload && typeof userPayload === "object" ? { ...userPayload } : {};

  if (!token) {
    throw new Error("Backend không trả về token. Kiểm tra API.");
  }

  if (!user || typeof user !== "object") {
    user = {};
  }

  try {
    const decoded = jwtDecode(token);
    [
      decoded,
      decoded?.user,
      decoded?.data,
      decoded?.data?.user,
      decoded?.staffProfile,
      decoded?.staff_profile,
    ].forEach((source) => {
      user = mergeAuthClaims(user, source);
    });
    user = mergeAuthClaims(user, decoded);
  } catch {
    // Tiếp tục dùng payload backend nếu token không decode được ở client.
  }

  [user, data, data?.user, data?.data, data?.data?.user, data?.profile, data?.data?.profile].forEach((source) => {
    user = mergeAuthClaims(user, source);
  });

  if (!user.role) {
    user.role = "customer";
  }

  if (normalizeRole(user.role) === "operator" && !user.staffProfileRole) {
    throw new Error("Backend chưa trả staffProfileRole cho tài khoản operator.");
  }

  return { token, user };
};

export const getRedirectUrl = (user) => {
  const role = normalizeRole(user?.role);
  const staffRole = normalizeStaffProfileRole(user?.staffProfileRole);
  const companyAdminRoles = new Set(["company_admin", "operator_admin", "admin"]);
  const dispatcherRoles = new Set(["dispatcher", "operator_dispatcher"]);
  const supportRoles = new Set(["support", "company_support", "operator_support"]);

  if (role === "driver") {
    return "/driver/dashboard";
  }

  if (role === "operator") {
    if (companyAdminRoles.has(staffRole)) {
      return "/company/dashboard";
    }

    if (supportRoles.has(staffRole)) {
      return "/company-support/tickets";
    }

    if (dispatcherRoles.has(staffRole)) {
      return "/operator/dashboard";
    }

    return "/company/dashboard";
  }

  if (role === "admin") {
    return staffRole === "support" ? "/company-support/tickets" : "/company/dashboard";
  }

  if (role === "super_admin" || role === "superadmin") {
    return "/super-admin/dashboard";
  }

  return "/";
};
