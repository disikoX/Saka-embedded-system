const admin = require("firebase-admin");
// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();
// const ref = db.ref('/users/{usersId}/distributors/{distributorId}/triggerNow');

const fetchUserIdAssignedToDistributor = async (distributorId) => {
  try {
    const snapshot = await db
                        .ref(`/distributors/${distributorId}`)
                        .child('assignedTo')
                        .once('value');
                        
    const userId = snapshot.val();
   
    return userId
  } catch (error) {
    console.error('Error fetching data from firebase service:', error);
    throw error;
  }
}

const fetchDistributorSettings = async (distributorId) => {
  try {
    const userId = await fetchUserIdAssignedToDistributor(distributorId);
    const snapshot = await db
                        .ref(`/users/${userId}/distributors/${distributorId}/settings`)
                        .once('value');
    const settings = snapshot.val();
    if (!settings) {
      throw new Error(`No settings found for distributor ${distributorId}`);
    }
    return settings;

  } catch (error) {
    console.error('Error fetching distributor settings from firebase service:', error);
    throw error;
  }
}

const fetchTriggerState = async (distributorId) => {
  try {
    const userId = await fetchUserIdAssignedToDistributor(distributorId);
    const snapshot = await db
                        .ref(`/users/${userId}/distributors/${distributorId}/triggerNow`)
                        .once('value');
    const triggerState = snapshot.val();
    if (triggerState === null) {
      throw new Error(`No trigger state found for distributor ${distributorId}`);
    }
    return triggerState;

  } catch (error) {
    console.error('Error fetching trigger state from firebase service:', error);
    throw error;
  }
}

const fetchPlannings = async (distributorId) => {
  try {
    const userId = await fetchUserIdAssignedToDistributor(distributorId);
    const snapshot = await db
                        .ref(`/users/${userId}/distributors/${distributorId}/planning`)
                        .once('value');
    const planning = snapshot.val();
    if (!planning) {
      throw new Error(`No planning found for distributor ${distributorId}`);
    }
    return planning;  
  } catch (error) {
    console.error('Error fetching planning from firebase service:', error);
    throw error;
  }
}

const setDataToValue = async (nodePath, data) => {
  try {
    const ref = db.ref(nodePath);
    await ref.set(data);
  } catch (error) {
    console.error('Error setting data to value in firebase service:', error);
    throw error;
  }
}

const setTriggerToFalse = async ( distributorId) => {
  const userId = await fetchUserIdAssignedToDistributor(distributorId);
  if (!userId) {
    throw new Error(`No user ID found for distributor ${distributorId}`);
  }
  
  try {
   await setDataToValue(`/users/${userId}/distributors/${distributorId}/triggerNow`, false);
  } catch (error) {
    console.error('Error setting trigger to false in firebase service:', error);
    throw error;
  }
}

const setStreamOnNode = async (nodePath, streamCallBack) => {
  try {
   const ref = db.ref(nodePath);
    ref.on('value', streamCallBack);
  } catch (error) {
    console.error('Error setting stream on node from :', error);
    throw error;
  }
}

const removeStreamOnNode = async (nodePath, streamCallBack) => {
  try {
   const ref = db.ref(nodePath);
    ref.off('value', streamCallBack);
  } catch (error) {
    console.error('Error removing stream on node from :', error);
    throw error;
  }
}

const setStreamOnTriggerNow = async (distributorId, streamCallBack) => {
  const userId = await fetchUserIdAssignedToDistributor(distributorId);
  if (!userId) {
    throw new Error(`No user ID found for distributor ${distributorId}`);
  }
  const nodePath = `/users/${userId}/distributors/${distributorId}/triggerNow`;
  try {
    await setStreamOnNode(nodePath, streamCallBack);
  } catch (error) {
    console.error('Error setting stream on triggerNow:', error);
    throw error;
  }
}

const removeStreamOnTriggerNow = async (distributorId, streamCallBack) => {
  const userId = await fetchUserIdAssignedToDistributor(distributorId);
  if (!userId) {
    throw new Error(`No user ID found for distributor ${distributorId}`);
  }
  const nodePath = `/users/${userId}/distributors/${distributorId}/triggerNow`;
  try {
    await removeStreamOnNode(nodePath, streamCallBack);
  } catch (error) {
    console.error('Error removing stream on triggerNow:', error);
    throw error;
  }
}

const setStreamOnPlanning = async (distributorId, planningId, streamCallBack) => {
  const userId = await fetchUserIdAssignedToDistributor(distributorId);
  if (!userId) {
    throw new Error(`No user ID found for distributor ${distributorId}`);
  }
  const nodePath = `/users/${userId}/distributors/${distributorId}/planning/${planningId}`;
  try {
    await setStreamOnNode(nodePath, streamCallBack);
  } catch (error) {
    console.error('Error setting stream on planning:', error);
    throw error;
  }
}

const removeStreamOnPlanning = async (distributorId, streamCallBack) => {
  const userId = await fetchUserIdAssignedToDistributor(distributorId);
  if (!userId) {
    throw new Error(`No user ID found for distributor ${distributorId}`);
  }
  const nodePath = `/users/${userId}/distributors/${distributorId}/planning/${planningId}`;

  try {
    await removeStreamOnNode(nodePath, streamCallBack);
  } catch (error) {
    console.error('Error removing stream on planning:', error);
    throw error;
  }
}

const updateDistributorStatus = async (distributorId, status) => {
  const userId = await fetchUserIdAssignedToDistributor(distributorId);
  if (!userId) {
    throw new Error(`No user ID found for distributor ${distributorId}`);
  }

  try {
    await setDataToValue(`/distributors/${distributorId}/status`, status);
  } catch (error) {
    console.error('Error updating distributor status:', error);
    throw error;
  }
}

module.exports = {
  fetchUserIdAssignedToDistributor,
  fetchDistributorSettings,
  fetchTriggerState,
  setStreamOnNode,
  removeStreamOnNode,
  setTriggerToFalse,
  setStreamOnTriggerNow,
  removeStreamOnTriggerNow,
  updateDistributorStatus,
  fetchPlannings,
  setStreamOnPlanning,
  removeStreamOnPlanning,
}