// activityStore.js

// A biblioteca 'svelte/store' ou 'nano-stores' não funcionará sem um
// sistema de build. Para este exemplo, vou remover a dependência
// e criar um objeto simples para o código funcionar.
// import { writable } from 'svelte/store'; // <- REMOVIDO

// CORRIGIDO: Caminhos relativos
import { activityRepo } from './../repository/activity.js';
import { auth } from './../firebase-config.js';

// Função 'writable' simulada para evitar erros
function writable(initialValue) {
    let value = initialValue;
    const subscribers = new Set();
    return {
        subscribe(callback) {
            subscribers.add(callback);
            callback(value); // call immediately
            return () => subscribers.delete(callback);
        },
        set(newValue) {
            value = newValue;
            subscribers.forEach(cb => cb(value));
        },
        update(updater) {
            value = updater(value);
            subscribers.forEach(cb => cb(value));
        }
    };
}


function createActivityStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    /** Carrega atividades do dia */
    async load(date) {
      const user = auth.currentUser;
      if (!user) return;
      // Adicionando um 'try-catch' para melhor tratamento de erros
      try {
        const data = await activityRepo.list(user.uid, date);
        set(data);
      } catch (error) {
        console.error("Erro ao carregar atividades:", error);
        set([]); // Define como vazio em caso de erro
      }
    },
    /** Salva e atualiza store local */
    async save(act) {
      const user = auth.currentUser;
      if (!user) return;
      await activityRepo.save(user.uid, act);
      update(list => {
        const idx = list.findIndex(a => a.id === act.id);
        if (idx >= 0) list[idx] = act; else list.push(act);
        return [...list]; // Retorna uma nova array para garantir a reatividade
      });
    },
    /** Remove */
    async remove(id) {
      const user = auth.currentUser;
      if (!user) return;
      await activityRepo.remove(user.uid, id);
      update(list => list.filter(a => a.id !== id));
    }
  };
}

export const activityStore = createActivityStore();