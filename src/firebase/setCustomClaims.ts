import * as admin from "firebase-admin";

/**
 * Sets custom claims for a user to assign roles and permissions.
 * @param uid The user ID to set claims for
 * @param claims The custom claims object, e.g. { admin: true, permissions: ['manage:employees'] }
 */
export async function setCustomClaims(uid: string, claims: Record<string, unknown>) {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error(`Error setting custom claims for user ${uid}:`, error);
    throw error;
  }
}
