// src/repository/activityRepo.js  (ESM, CDN-ready)
const COLLECTION = 'activities';

export const activityRepo = {
  /**
   * Lista atividades do dia (usuário logado)
   * @param {string} userId
   * @param {string} date  ISO ("YYYY-MM-DD")
   * @returns {Promise<Activity[]>}
   */
  async list(userId, date) {
    const q = window.firebase.query(
      window.firebase.collection(window.db, COLLECTION),
      window.firebase.where('userId', '==', userId),
      window.firebase.where('date', '==', date)
    );
    const snap = await window.firebase.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Salva / atualiza atividade
   * @param {string} userId
   * @param {Activity} activity
   */
  async save(userId, activity) {
    const ref = window.firebase.doc(window.db, COLLECTION, activity.id);
    await window.firebase.setDoc(ref, {
      ...activity,
      userId,
      updatedAt: window.firebase.serverTimestamp()
    }, { merge: true });
  },

  /**
   * Remove atividade
   * @param {string} userId
   * @param {string} activityId
   */
  async remove(userId, activityId) {
    const ref = window.firebase.doc(window.db, COLLECTION, activityId);
    await window.firebase.deleteDoc(ref);
  }
};