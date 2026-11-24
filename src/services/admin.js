// Single source of truth for who the admin is.
//
// The admin is identified by their Firebase Authentication UID, which a user
// cannot choose or change. (Previously the app treated anyone whose userName
// and fullName were both "admin" as the admin, which any user could set.)
//
// This check only controls what the UI shows. Real protection comes from the
// Firestore security rules in firestore.rules, which use the same UID.
export const ADMIN_UID = "CzdRCmUwf4PH3SZAtf4mFEGx7ON2";

// Accepts a Firebase Auth user, a Firestore user profile, or a plain UID.
export const isAdmin = (userOrUid) => {
  if (!userOrUid) return false;
  const uid =
    typeof userOrUid === "string"
      ? userOrUid
      : userOrUid.uid || userOrUid.id || userOrUid.docId;
  return uid === ADMIN_UID;
};
