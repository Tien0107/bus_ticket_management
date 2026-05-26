export const PAGE_SIZE = 10;
export const RECALLED_MESSAGE = "Tin nhắn đã được thu hồi";
export const SOCKET_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL ||
  process.env.REACT_APP_SOCKET_URL ||
  process.env.VITE_SOCKET_URL ||
  "https://socket-server-b5r4.onrender.com";

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const getRecallCacheKey = (userId) => `driverChatRecalledMessages:${userId || "guest"}`;

export const readRecalledMessageIds = (userId) => {
  try {
    const raw = localStorage.getItem(getRecallCacheKey(userId));
    const ids = JSON.parse(raw || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
};

export const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isRecalledText = (value) => {
  const text = String(value || "").trim().toLowerCase();
  return (
    text === RECALLED_MESSAGE.toLowerCase() ||
    text === "tin nhắn đã thu hồi" ||
    text === "message recalled" ||
    text === "recalled"
  );
};

export const isMessageRecalled = (message = {}) =>
  Boolean(
    message.recalled ||
      message.isRecalled ||
      message.is_recalled ||
      message.status === "recalled" ||
      message.messageStatus === "recalled" ||
      message.deletedAt ||
      message.recalledAt ||
      isRecalledText(message.message) ||
      isRecalledText(message.body)
  );

const normalizeBox = (box = {}) => ({
  ...box,
  id: toNumber(box.id ?? box.boxId),
  senderId: toNumber(box.senderId),
  receiverId: toNumber(box.receiverId),
  lastMessageSenderId: toNumber(box.lastMessageSenderId),
  unreadReceiverCount: Number(box.unreadReceiverCount || 0),
  unreadSenderCount: Number(box.unreadSenderCount || 0),
  displayName: box.displayName || `Hội thoại #${box.id ?? box.boxId ?? ""}`,
  lastMessage: box.lastMessage || "",
});

export const normalizeBoxesResponse = (data) => {
  const boxes = Array.isArray(data?.boxes)
    ? data.boxes
    : Array.isArray(data?.data?.boxes)
    ? data.data.boxes
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return {
    boxes: boxes.map(normalizeBox).filter((box) => box.id),
    next: data?.next ?? data?.data?.next ?? null,
  };
};

export const normalizeMessage = (message = {}, boxId) => ({
  ...message,
  id: message.id ?? message.messageId ?? `local-${Date.now()}-${Math.random()}`,
  boxId: toNumber(message.boxId ?? boxId),
  message: message.message ?? message.body ?? "",
  senderId: toNumber(message.senderId),
  fullName: message.fullName || message.senderName || "Người dùng",
  createdAt: message.createdAt || new Date().toISOString(),
  recalled: isMessageRecalled(message),
});

export const normalizeMessagesResponse = (data, boxId) => {
  const messages = Array.isArray(data?.messages)
    ? data.messages
    : Array.isArray(data?.data?.messages)
    ? data.data.messages
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return {
    messages: messages
      .map((message) => normalizeMessage(message, boxId))
      .filter((message) => message.message || message.id),
    next: data?.next ?? data?.data?.next ?? null,
  };
};

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

const COMPANY_ADMIN_STAFF_ROLES = new Set(["company_admin"]);
const DISPATCHER_STAFF_ROLES = new Set(["dispatcher", "operator_dispatcher"]);
const SUPPORT_STAFF_ROLES = new Set(["support", "company_support", "operator_support"]);
const COMPANY_ADMIN_OPERATOR_RECIPIENT_STAFF_ROLES = new Set([
  ...DISPATCHER_STAFF_ROLES,
  ...SUPPORT_STAFF_ROLES,
]);
const OPERATOR_CHAT_ROLES = new Set([
  "operator",
  "dispatcher",
  "operator_dispatcher",
  "support",
  "company_support",
  "operator_support",
]);

const isSameCompanyOrUnknown = (viewer, recipient) => {
  if (!viewer?.companyId || !recipient?.companyId) return true;
  return Number(viewer.companyId) === Number(recipient.companyId);
};

const isSameCompanyStrict = (viewer, recipient) =>
  Boolean(
    viewer?.companyId &&
      recipient?.companyId &&
      Number(viewer.companyId) === Number(recipient.companyId)
  );

const isSuperAdminChatUser = (user = {}) => {
  const role = normalizeRoleValue(user.role);
  return role === "super_admin";
};

const isCompanyAdminChatUser = (user = {}) => {
  const role = normalizeRoleValue(user.role);
  const staffRole = normalizeStaffProfileRole(user.staffProfileRole);

  return (
    (role === "operator" && COMPANY_ADMIN_STAFF_ROLES.has(staffRole)) ||
    (!role && COMPANY_ADMIN_STAFF_ROLES.has(staffRole))
  );
};

const isOperatorChatUser = (user = {}) => {
  const role = normalizeRoleValue(user.role);
  const staffRole = normalizeStaffProfileRole(user.staffProfileRole);

  return (
    OPERATOR_CHAT_ROLES.has(role) ||
    COMPANY_ADMIN_STAFF_ROLES.has(staffRole) ||
    DISPATCHER_STAFF_ROLES.has(staffRole) ||
    SUPPORT_STAFF_ROLES.has(staffRole)
  );
};

const isCompanyAdminOperatorRecipient = (user = {}) => {
  const role = normalizeRoleValue(user.role);
  const staffRole = normalizeStaffProfileRole(user.staffProfileRole);

  return (role === "operator" || !role) && COMPANY_ADMIN_OPERATOR_RECIPIENT_STAFF_ROLES.has(staffRole);
};

const isDriverChatUser = (user = {}) => normalizeRoleValue(user.role) === "driver";
const isCustomerChatUser = (user = {}) => normalizeRoleValue(user.role) === "customer";

const hasRoleMetadata = (users = []) =>
  users.some((user) => normalizeRoleValue(user.role) || normalizeStaffProfileRole(user.staffProfileRole));

const keepBackendScopedRecipientsWhenRoleMissing = (users, filteredUsers) => {
  if (filteredUsers.length || hasRoleMetadata(users)) return filteredUsers;
  return users;
};

const getOperatorRecipients = (users, viewer, useCompanyFilter = false) => {
  const operators = users.filter(isOperatorChatUser);
  if (!useCompanyFilter) return operators;

  return operators.filter((user) => isSameCompanyOrUnknown(viewer, user));
};

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

export const getChatRecipientQueries = (currentUser = {}) => {
  const viewer = normalizeUser(currentUser || {});
  const base = { status: "active", limit: PAGE_SIZE };
  const byRole = (role) => ({ ...base, role });
  const byRoleAnyStatus = (role) => ({ limit: PAGE_SIZE, role });
  const withCompanyFallback = (query) =>
    viewer.companyId ? [{ ...query, companyId: viewer.companyId }, query] : [query];
  const withCompanyOnly = (query) =>
    viewer.companyId ? [{ ...query, companyId: viewer.companyId }] : [query];

  if (isCustomerChatUser(viewer)) {
    return [byRole("operator")];
  }

  if (isDriverChatUser(viewer)) {
    return uniqueQueryParams(withCompanyOnly(byRole("operator")));
  }

  if (isCompanyAdminChatUser(viewer)) {
    return uniqueQueryParams([
      ...withCompanyFallback(byRole("operator")),
      ...withCompanyFallback(byRole("driver")),
      byRole("super_admin"),
      byRoleAnyStatus("super_admin"),
      base,
      { limit: PAGE_SIZE },
    ]);
  }

  if (isOperatorChatUser(viewer)) {
    return uniqueQueryParams([
      ...withCompanyFallback(byRole("driver")),
      ...withCompanyFallback(byRole("operator")),
      byRole("customer"),
    ]);
  }

  return [base];
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

export const filterChatRecipientsForViewer = (users = [], currentUser = {}) => {
  const viewer = normalizeUser(currentUser || {});

  if (isDriverChatUser(viewer)) {
    const filteredUsers = getOperatorRecipients(users, viewer, true);
    return keepBackendScopedRecipientsWhenRoleMissing(users, filteredUsers);
  }

  if (isCustomerChatUser(viewer)) {
    const filteredUsers = users.filter(isCompanyAdminChatUser);
    return keepBackendScopedRecipientsWhenRoleMissing(users, filteredUsers);
  }

  if (isCompanyAdminChatUser(viewer)) {
    const filteredUsers = users.filter(
      (user) =>
        isSuperAdminChatUser(user) ||
        ((isDriverChatUser(user) || isCompanyAdminOperatorRecipient(user)) &&
          isSameCompanyStrict(viewer, user))
    );
    return keepBackendScopedRecipientsWhenRoleMissing(users, filteredUsers);
  }

  if (isOperatorChatUser(viewer)) {
    const filteredUsers = users.filter(
      (user) =>
        isCustomerChatUser(user) ||
        ((isDriverChatUser(user) || isCompanyAdminChatUser(user) || isOperatorChatUser(user)) &&
          isSameCompanyOrUnknown(viewer, user))
    );
    return keepBackendScopedRecipientsWhenRoleMissing(users, filteredUsers);
  }

  if (isSuperAdminChatUser(viewer)) {
    return users;
  }

  return users;
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
      .filter((user) => user.id && Number(user.id) !== Number(viewerId)),
    next: data?.next ?? data?.data?.next ?? null,
  };
};

export const normalizeIncomingMessage = (payload = {}) => {
  const boxId = toNumber(payload.boxId ?? payload.box?.id);
  const body = payload.body ?? payload.message ?? payload.lastMessage;
  if (!boxId || !body) return null;

  return normalizeMessage(
    {
      id: payload.messageId ?? payload.id,
      boxId,
      message: body,
      senderId: payload.senderId,
      fullName: payload.fullName || payload.senderName,
      createdAt: payload.createdAt,
    },
    boxId
  );
};

export const getUnreadForViewer = (box, viewerId) => {
  if (!viewerId) return Math.max(Number(box.unreadReceiverCount || 0), Number(box.unreadSenderCount || 0));
  if (Number(box.receiverId) === Number(viewerId)) return Number(box.unreadReceiverCount || 0);
  if (Number(box.senderId) === Number(viewerId)) return Number(box.unreadSenderCount || 0);
  return 0;
};

export const zeroUnreadForViewer = (box, viewerId) => {
  if (Number(box.receiverId) === Number(viewerId)) return { ...box, unreadReceiverCount: 0 };
  if (Number(box.senderId) === Number(viewerId)) return { ...box, unreadSenderCount: 0 };
  return box;
};

export const getBoxPreview = (box, viewerId) => {
  if (!box.lastMessage) return "Chưa có tin nhắn";

  const senderName = Number(box.lastMessageSenderId) === Number(viewerId) ? "Bạn" : box.displayName;
  return `${senderName}: ${box.lastMessage}`;
};

export const appendUniqueMessages = (current, incoming) => {
  const items = Array.isArray(incoming) ? incoming : [incoming];
  const existing = new Set(current.map((message) => String(message.id)));
  const next = [...current];

  items.forEach((message) => {
    if (!existing.has(String(message.id))) {
      next.push(message);
      existing.add(String(message.id));
    }
  });

  return next.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
};

export const sortMessagesOldestFirst = (items = []) =>
  [...items].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "BG";
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
};

export const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};
