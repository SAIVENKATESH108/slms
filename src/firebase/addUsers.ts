import * as admin from "firebase-admin";
import { firestoreService } from "../services/firestoreService";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

const serviceAccountObj = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
  universeDomain: serviceAccount.universe_domain
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountObj)
});

/**
 * Creates a user in Firebase Authentication and Firestore with the specified role and details.
 * @param email User's email address
 * @param phoneNumber User's phone number
 * @param password User's password
 * @param displayName User's display name
 * @param role Role of the user (admin, manager, employee)
 */
export async function createUserWithRole(email: string, phoneNumber: string, password: string, displayName: string, role: string) {
  try {
    const userRecord = await admin.auth().createUser({
      email,
      phoneNumber,
      password,
      displayName,
    });

    // Add user document in Firestore under 'users' collection
    await firestoreService.addStaff({
      role,
      name: displayName,
      email,
      phone: phoneNumber,
      createdAt: new Date()
    }, userRecord.uid);

    console.log(`Successfully created user ${displayName} with role ${role}`);
    return userRecord;
  } catch (error) {
    console.error(`Error creating user ${displayName} with role ${role}:`, error);
    throw error;
  }
}
